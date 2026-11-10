import { Cluster, Clusters, RouteToNextCluster } from "../types";

import dayjs from "dayjs";
import { distance } from "./playback";

/**
 * GPS clean-up for one day of location clusters, run before transformClusterData.
 * Pure client-side maths — no Google (or other) API calls.
 *
 *  1. Sanitize      drop invalid / 0,0 coordinates and duplicate timestamps, sort by time
 *  2. Spikes        drop route readings that need an impossible speed both in and out,
 *                   or that ping-pong away and straight back (A → B → A)
 *  3. Absorb        slow readings close to a stop become part of that stop
 *  4. Merge         consecutive stops close together with no real movement between them
 *  5. Micro-stops   stays shorter than MIN_STOP_MIN become points on the drive
 *  6. Addresses     shortened for display; the full address is kept in `full_address`
 */
export const CLEANUP_DEFAULTS = {
  /** a reading that needs more than this, in and out, is a spike */
  MAX_SPEED_KMH: 150,
  /** A→B→A: A and A′ within this distance… */
  PINGPONG_NEIGHBOUR_M: 100,
  /** …and B further than this from both → B is a spike */
  PINGPONG_SPIKE_M: 250,
  /** below this speed a step counts as "not moving" */
  MOVING_KMH: 8,
  /** stops closer than this with no movement between them are one stay */
  MERGE_RADIUS_M: 1000,
  /** slow readings within this distance of a stop belong to the stop */
  ABSORB_RADIUS_M: 250,
  /** stays shorter than this (minutes) are pass-throughs, except first/last of day */
  MIN_STOP_MIN: 5,
};

export type CleanupOptions = typeof CLEANUP_DEFAULTS;

export type CleanupStats = {
  /** stops the raw view shows (clusters + single-reading drives it promotes to stops) */
  rawStops: number;
  stops: number;
  droppedReadings: number;
  absorbedReadings: number;
  mergedStops: number;
  microStops: number;
};

type LatLng = { lat: number; lng: number };

const toMs = (s?: string) => (s ? dayjs(s).valueOf() : NaN);

const isValid = (p: LatLng) =>
  Number.isFinite(p.lat) &&
  Number.isFinite(p.lng) &&
  Math.abs(p.lat) <= 90 &&
  Math.abs(p.lng) <= 180 &&
  !(p.lat === 0 && p.lng === 0);

/** km/h between two fixes; a jump with no time elapsed counts as infinitely fast */
function speedKmh(a: LatLng, aTime: string, b: LatLng, bTime: string) {
  const d = distance(a, b);
  const dt = (toMs(bTime) - toMs(aTime)) / 1000;
  if (!Number.isFinite(dt)) return 0;
  if (dt <= 0) return d > 50 ? Infinity : 0;
  return (d / dt) * 3.6;
}

const dwellMin = (c: Cluster) => Math.max(0, (toMs(c.end_time) - toMs(c.start_time)) / 60000);

export function shortenAddress(address: string) {
  if (!address) return address;
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(
      (p) =>
        p &&
        !/^india$/i.test(p) &&
        !/\b\d{6}\b/.test(p) && // "Uttarakhand 249205", bare pincodes
        !/^[\d\s/-]+[a-z]?$/i.test(p) && // house numbers like "11-B", "62/12"
        !/^unnamed road$/i.test(p),
    );
  return parts.slice(0, 2).join(", ") || address;
}

// ---- steps ------------------------------------------------------------------

function sanitizeRoute(route: RouteToNextCluster[], stats: CleanupStats) {
  const seen = new Set<string>();
  const out = route
    .filter((r) => {
      const ok = isValid(r) && Number.isFinite(toMs(r.datetime1)) && !seen.has(r.datetime1);
      if (ok) seen.add(r.datetime1);
      else stats.droppedReadings++;
      return ok;
    })
    .sort((a, b) => toMs(a.datetime1) - toMs(b.datetime1));
  return out;
}

function removeSpikes(stays: Cluster[], o: CleanupOptions, stats: CleanupStats) {
  stays.forEach((stay, i) => {
    const next = stays[i + 1];
    const route = stay.route_to_next_cluster;
    const kept: RouteToNextCluster[] = [];
    let prev: LatLng & { t: string } = { lat: stay.lat, lng: stay.lng, t: stay.end_time };

    route.forEach((cur, k) => {
      const after = route[k + 1] ?? (next ? { lat: next.lat, lng: next.lng, datetime1: next.start_time } : null);
      if (after) {
        const tooFast =
          speedKmh(prev, prev.t, cur, cur.datetime1) > o.MAX_SPEED_KMH &&
          speedKmh(cur, cur.datetime1, after, after.datetime1) > o.MAX_SPEED_KMH;
        const pingPong =
          distance(prev, after) < o.PINGPONG_NEIGHBOUR_M &&
          distance(cur, prev) > o.PINGPONG_SPIKE_M &&
          distance(cur, after) > o.PINGPONG_SPIKE_M;
        if (tooFast || pingPong) {
          stats.droppedReadings++;
          return;
        }
      }
      kept.push(cur);
      prev = { lat: cur.lat, lng: cur.lng, t: cur.datetime1 };
    });
    stay.route_to_next_cluster = kept;
  });
}

/** Slow readings right after a stop (or right before the next one) are part of that stop */
function absorb(stays: Cluster[], o: CleanupOptions, stats: CleanupStats) {
  stays.forEach((stay, i) => {
    const route = stay.route_to_next_cluster;

    // leading readings: still hanging around this stop
    let lastT = stay.end_time;
    let last: LatLng = stay;
    while (
      route.length &&
      distance(stay, route[0]) <= o.ABSORB_RADIUS_M &&
      speedKmh(last, lastT, route[0], route[0].datetime1) < o.MOVING_KMH
    ) {
      const r = route.shift() as RouteToNextCluster;
      if (toMs(r.datetime1) > toMs(stay.end_time)) stay.end_time = r.datetime1;
      last = r;
      lastT = r.datetime1;
      stats.absorbedReadings++;
    }

    // trailing readings: already waiting at the next stop
    const next = stays[i + 1];
    if (!next) return;
    let firstT = next.start_time;
    let first: LatLng = next;
    while (route.length) {
      const r = route[route.length - 1];
      if (distance(next, r) > o.ABSORB_RADIUS_M || speedKmh(r, r.datetime1, first, firstT) >= o.MOVING_KMH) break;
      route.pop();
      if (toMs(r.datetime1) < toMs(next.start_time)) next.start_time = r.datetime1;
      first = r;
      firstT = r.datetime1;
      stats.absorbedReadings++;
    }
  });
  return stays;
}

function legMaxSpeed(a: Cluster, b: Cluster) {
  const pts = [
    { lat: a.lat, lng: a.lng, t: a.end_time },
    ...a.route_to_next_cluster.map((r) => ({ lat: r.lat, lng: r.lng, t: r.datetime1 })),
    { lat: b.lat, lng: b.lng, t: b.start_time },
  ];
  let max = 0;
  for (let i = 1; i < pts.length; i++) {
    max = Math.max(max, speedKmh(pts[i - 1], pts[i - 1].t, pts[i], pts[i].t));
  }
  return max;
}

/** Consecutive stops that are close together with no real movement between are one stay */
function merge(stays: Cluster[], o: CleanupOptions, stats: CleanupStats) {
  // the longest piece of a merged stay decides its pin and address
  const best = new Map<Cluster, number>();
  const out: Cluster[] = [];

  for (const s of stays) {
    const a = out[out.length - 1];
    if (a && distance(a, s) < o.MERGE_RADIUS_M && legMaxSpeed(a, s) < o.MOVING_KMH) {
      const aBest = best.get(a) ?? dwellMin(a);
      const sDwell = dwellMin(s);
      if (sDwell > aBest) {
        a.lat = s.lat;
        a.lng = s.lng;
        a.address = s.address;
        best.set(a, sDwell);
      } else best.set(a, aBest);
      stats.absorbedReadings += a.route_to_next_cluster.length;
      a.end_time = s.end_time;
      a.route_to_next_cluster = s.route_to_next_cluster;
      stats.mergedStops++;
    } else {
      out.push(s);
      best.set(s, dwellMin(s));
    }
  }
  return out;
}

/** Very short stays in the middle of the day are just points on the drive */
function dropMicroStops(stays: Cluster[], o: CleanupOptions, stats: CleanupStats) {
  const out: Cluster[] = [];
  stays.forEach((s, i) => {
    const isEdge = i === 0 || i === stays.length - 1;
    const prev = out[out.length - 1];
    if (!isEdge && prev && dwellMin(s) < o.MIN_STOP_MIN) {
      prev.route_to_next_cluster.push(
        { lat: s.lat, lng: s.lng, address: s.address, datetime1: s.start_time },
        ...s.route_to_next_cluster,
      );
      stats.microStops++;
      return;
    }
    out.push(s);
  });
  return out;
}

export function cleanDay(
  input: Clusters,
  options: Partial<CleanupOptions> = {},
): { clusters: Clusters; stats: CleanupStats } {
  const o = { ...CLEANUP_DEFAULTS, ...options };
  const stats: CleanupStats = {
    rawStops: input.length + input.filter((c) => c.route_to_next_cluster?.length === 1).length,
    stops: 0,
    droppedReadings: 0,
    absorbedReadings: 0,
    mergedStops: 0,
    microStops: 0,
  };

  // 1. sanitize (never mutate the caller's data)
  let stays: Clusters = input
    .filter((c) => {
      const ok = isValid(c) && Number.isFinite(toMs(c.start_time));
      if (!ok) stats.droppedReadings++;
      return ok;
    })
    .map((c) => ({
      ...c,
      end_time: Number.isFinite(toMs(c.end_time)) ? c.end_time : c.start_time,
      route_to_next_cluster: sanitizeRoute([...(c.route_to_next_cluster ?? [])], stats),
    }))
    .sort((a, b) => toMs(a.start_time) - toMs(b.start_time));

  // 2. spikes
  removeSpikes(stays, o, stats);

  // 3–5. absorb → merge → absorb, then fold micro-stops and settle again
  stays = absorb(stays, o, stats);
  stays = merge(stays, o, stats);
  stays = absorb(stays, o, stats);
  stays = dropMicroStops(stays, o, stats);
  stays = merge(stays, o, stats);
  stays = absorb(stays, o, stats);

  // 6. readable addresses
  stays.forEach((c) => {
    c.full_address = c.full_address ?? c.address;
    c.address = shortenAddress(c.address);
    c.route_to_next_cluster = c.route_to_next_cluster.map((r) => ({
      ...r,
      full_address: r.full_address ?? r.address,
      address: shortenAddress(r.address),
    }));
  });

  stats.stops = stays.length;
  return { clusters: stays, stats };
}
