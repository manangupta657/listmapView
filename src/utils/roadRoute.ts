/**
 * Road routing via the same self-hosted OSRM server the backend uses for
 * `total_autologged_distance` (be/custom/Functions.php → getDistance()).
 * Not a Google API. Override with VITE_OSRM_URL (e.g. an HTTPS proxy in production).
 */
const OSRM_URL = (
  (import.meta.env.VITE_OSRM_URL as string | undefined) ?? "http://139.59.64.241:5000"
).replace(/\/$/, "");

/** coordinates per request — the backend proxy accepts up to 100 */
const MAX_COORDS = 90;

type LatLng = { lat: number; lng: number };

export type RoadLeg = {
  /** OSRM driving distance in metres between the two readings */
  distance: number;
  /** road geometry from one reading to the next, both readings included */
  coords: LatLng[];
};

/** HTTPS proxy in the backend (be/custom/Apis.php → osrmRoute); needs the page's token */
const PROXY_URL = "https://be.platform.simplifii.com/api/v1/custom/osrmRoute";

/** An HTTPS page can't call an HTTP server (mixed content), so skip instead of failing */
function directAvailable() {
  return !(window.location.protocol === "https:" && OSRM_URL.startsWith("http:"));
}

const pageToken = () => new URLSearchParams(window.location.search).get("token");

export function roadRoutingAvailable() {
  return !!pageToken() || directAvailable();
}

/** Backend proxy first (works on HTTPS pages), then OSRM directly where allowed */
async function requestRoute(coords: string, signal?: AbortSignal) {
  const query = "overview=false&steps=true&geometries=geojson";
  const token = pageToken();

  if (token) {
    try {
      const res = await fetch(
        `${PROXY_URL}?coords=${encodeURIComponent(coords)}&${query}&token=${encodeURIComponent(token)}`,
        { signal },
      );
      if (res.ok) {
        const json = await res.json();
        if (json?.code === "Ok") return json;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e;
    }
  }

  if (!directAvailable()) return null;
  const res = await fetch(`${OSRM_URL}/route/v1/driving/${coords}?${query}`, { signal });
  return res.ok ? res.json() : null;
}

const cache = new Map<string, RoadLeg[]>();

export async function fetchRoadLegs(points: LatLng[], signal?: AbortSignal): Promise<RoadLeg[] | null> {
  if (points.length < 2 || !roadRoutingAvailable()) return null;

  const key = points.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join(";");
  const cached = cache.get(key);
  if (cached) return cached;

  const legs: RoadLeg[] = [];
  // consecutive chunks share their boundary point so every reading pair gets a leg
  for (let start = 0; start < points.length - 1; start += MAX_COORDS - 1) {
    const chunk = points.slice(start, start + MAX_COORDS);
    const coords = chunk.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(";");
    const json = await requestRoute(coords, signal);
    const route = json?.routes?.[0];
    if (json?.code !== "Ok" || !route || route.legs?.length !== chunk.length - 1) return null;

    // Same as the backend's getDistance(): OSRM's distance for every pair, used as-is
    route.legs.forEach((leg: { distance: number; steps: { geometry: { coordinates: [number, number][] } }[] }, i: number) => {
      const path = leg.steps.flatMap((s) => s.geometry.coordinates).map(([lng, lat]) => ({ lat, lng }));
      legs.push({ distance: leg.distance, coords: [chunk[i], ...path, chunk[i + 1]] });
    });
  }

  if (legs.length !== points.length - 1) return null;
  cache.set(key, legs);
  return legs;
}

/** Port of Functions::getAerialDistanceUsingFormula() (metres, rounded like the PHP) */
function aerialDistance(a: LatLng, b: LatLng) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const cos =
    Math.sin(rad(a.lat)) * Math.sin(rad(b.lat)) +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(a.lng - b.lng));
  const miles = ((Math.acos(Math.min(1, cos)) * 180) / Math.PI) * 60 * 1.1515;
  return Math.round(miles * 1.609344 * 100) / 100 * 1000;
}

/**
 * Same logic as the backend's total_autologged_distance
 * (be/custom/Functions.php → phoneClaimLimitCheck):
 *  - readings after 06:00, in time order
 *  - more than 300 readings → skip any within 100 m of the previous kept one
 *  - more than 600 kept → no distance (null), like the backend
 *  - OSRM driving distance for every consecutive pair, summed, km to 2 decimals
 */
export async function fetchAutologgedKm(
  readings: { lat: number; lng: number; time: string }[],
  signal?: AbortSignal,
): Promise<number | null> {
  const sorted = readings
    .filter((r) => (r.time ?? "").slice(11) > "06:00:00")
    .sort((a, b) => a.time.localeCompare(b.time));

  const kept: LatLng[] = [];
  for (const r of sorted) {
    if (sorted.length > 300 && kept.length && aerialDistance(kept[kept.length - 1], r) <= 100) continue;
    kept.push({ lat: r.lat, lng: r.lng });
  }

  if (kept.length < 2) return 0;
  if (kept.length > 600) return null;

  const legs = await fetchRoadLegs(kept, signal);
  if (!legs) return null;
  const metres = legs.reduce((sum, leg) => sum + leg.distance, 0);
  return Math.round(metres * 0.001 * 100) / 100;
}
