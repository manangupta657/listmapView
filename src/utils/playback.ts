import { FlattenedData } from "../types";
import dayjs from "dayjs";

export const TRAVEL_LABEL = "Travel 🚗";

export type TrackPoint = {
  lat: number;
  lng: number;
  address: string;
  /** Arrival time (ms epoch) at this point, if known */
  arriveAt: number | null;
  /** Departure time (ms epoch) — differs from arriveAt only for stops */
  departAt: number | null;
  stopIndex?: number;
  startTime?: string;
  endTime?: string;
};

export type TrackStop = { dist: number; point: TrackPoint };

export type Track = {
  points: TrackPoint[];
  /** cumulative distance (m) from the first point to points[i] */
  cumDist: number[];
  total: number;
  stops: TrackStop[];
};

export type TrackSample = {
  lat: number;
  lng: number;
  segIndex: number;
  heading: number;
  time: number | null;
  /** the point the vehicle most recently passed */
  lastPoint: TrackPoint;
};

const EARTH_RADIUS = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

const toMs = (value?: string) => {
  if (!value) return null;
  const ms = dayjs(value).valueOf();
  return Number.isNaN(ms) ? null : ms;
};

export function distance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Compass bearing in degrees (0 = north, clockwise) from a to b */
export function bearing(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δλ = toRad(b.lng - a.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Turn the day's flattened markers into an ordered, de-duplicated track */
export function buildTrack(data: FlattenedData[]): Track {
  const points: TrackPoint[] = [];

  for (const d of data) {
    // "Travel" rows are synthetic list entries; their route points follow them.
    if (d.type === "halt" && d.address === TRAVEL_LABEL) continue;
    if (typeof d.lat !== "number" || typeof d.lng !== "number") continue;

    const point: TrackPoint =
      d.type === "halt"
        ? {
            lat: d.lat,
            lng: d.lng,
            address: d.address,
            arriveAt: toMs(d.start_time),
            departAt: toMs(d.end_time) ?? toMs(d.start_time),
            stopIndex: d.stoppageIndex,
            startTime: d.start_time,
            endTime: d.end_time,
          }
        : {
            lat: d.lat,
            lng: d.lng,
            address: d.address,
            arriveAt: toMs(d.datetime),
            departAt: toMs(d.datetime),
          };

    const last = points[points.length - 1];
    if (last && last.lat === point.lat && last.lng === point.lng) {
      // Same spot twice in a row: keep one, preferring the stop's details.
      if (point.stopIndex !== undefined && last.stopIndex === undefined) {
        points[points.length - 1] = point;
      } else if (point.departAt !== null) {
        // never move a departure earlier (route lists repeat the stop's start time)
        last.departAt = Math.max(last.departAt ?? point.departAt, point.departAt);
      }
      continue;
    }
    points.push(point);
  }

  const cumDist: number[] = [];
  let total = 0;
  points.forEach((p, i) => {
    if (i > 0) total += distance(points[i - 1], p);
    cumDist.push(total);
  });

  const stops = points
    .map((point, i) => ({ dist: cumDist[i], point }))
    .filter((s) => s.point.stopIndex !== undefined);

  return { points, cumDist, total, stops };
}

/** Position, heading and interpolated clock time at `dist` metres along the track */
export function sampleTrack(track: Track, dist: number): TrackSample | null {
  const { points, cumDist, total } = track;
  if (points.length === 0) return null;
  if (points.length === 1) {
    const p = points[0];
    return { lat: p.lat, lng: p.lng, segIndex: 0, heading: 0, time: p.arriveAt, lastPoint: p };
  }

  const d = Math.max(0, Math.min(total, dist));

  // binary search for the segment [i, i+1] that contains d
  let lo = 0;
  let hi = points.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cumDist[mid] <= d) lo = mid;
    else hi = mid - 1;
  }
  const i = lo;
  const a = points[i];
  const b = points[i + 1];
  const segLen = cumDist[i + 1] - cumDist[i];
  const t = segLen > 0 ? (d - cumDist[i]) / segLen : 0;

  let time: number | null = null;
  const start = a.departAt ?? a.arriveAt;
  const end = b.arriveAt;
  if (start !== null && end !== null) time = start + (end - start) * t;
  else time = start ?? end;

  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
    segIndex: i,
    heading: bearing(a, b),
    time,
    lastPoint: t >= 1 ? b : a,
  };
}

/** "1h 05m" / "21 min" */
export function formatMinutes(minutes: number) {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return `${h}h ${String(r).padStart(2, "0")}m`;
}

export function minutesBetween(start?: string, end?: string) {
  if (!start || !end) return 0;
  const diff = dayjs(end).diff(dayjs(start), "minute", true);
  return Number.isFinite(diff) ? Math.max(0, diff) : 0;
}

export function formatKm(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 2 : 1)} km`;
}
