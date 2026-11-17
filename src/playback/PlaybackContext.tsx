import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RoadLeg, fetchAutologgedKm, fetchRoadLegs } from "../utils/roadRoute";
import { Track, TrackPoint, buildTrack, scaleTrack, withRoadGeometry } from "../utils/playback";

import { Clusters } from "../types";
import { getFlattenedData } from "../functionss";

export type PlaybackStatus = "stopped" | "playing" | "paused" | "ended";

const SPEEDS = [0.5, 1, 2, 4, 8];
/** How long the whole day takes to replay at 1× */
const BASE_DURATION_MS = 60_000;
/** How long the vehicle waits at each stop at 1× */
const STOP_HOLD_MS = 1200;

type PlaybackState = {
  track: Track;
  /**
   * "autologged": total matches the backend's total_autologged_distance logic
   * "road": OSRM along the map's points · "straight": straight lines (no routing)
   */
  distanceSource: "autologged" | "road" | "straight";
  status: PlaybackStatus;
  speed: number;
  follow: boolean;
  /** Stop the vehicle is currently holding at (shows the arrival banner) */
  arrivedAt: TrackPoint | null;
  /** stoppageIndex of the stop the vehicle is sitting on, if any */
  atStop: number | null;
  /** How many stops (in track order) the vehicle has reached */
  passedStops: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stop: () => void;
  seek: (dist: number) => void;
  seekToStop: (stopIndex: number) => boolean;
  cycleSpeed: () => void;
  setFollow: (follow: boolean) => void;
};

const PlaybackContext = createContext<PlaybackState | null>(null);
// Progress changes every frame, so it lives in its own context: only the
// map layers and the player panel re-render at 60fps, not the timeline.
const ProgressContext = createContext(0);

export function PlaybackProvider({
  data,
  rawData,
  children,
}: {
  data: Clusters | null;
  /** untouched API clusters — the distance always uses these, like the backend */
  rawData: Clusters | null;
  children: ReactNode;
}) {
  // Straight-line track first; upgraded to follow roads once OSRM answers
  const baseTrack = useMemo(
    () => buildTrack(data ? getFlattenedData(data) : []),
    [data],
  );
  const [road, setRoad] = useState<{ base: Track; legs: RoadLeg[] } | null>(null);

  useEffect(() => {
    if (baseTrack.points.length < 2) return;
    const ctrl = new AbortController();
    fetchRoadLegs(baseTrack.points, ctrl.signal)
      .then((legs) => {
        if (legs) setRoad({ base: baseTrack, legs });
      })
      .catch(() => {
        /* offline / blocked → keep straight lines */
      });
    return () => ctrl.abort();
  }, [baseTrack]);

  const roadReady = road !== null && road.base === baseTrack;

  // Day distance computed exactly like the backend's KM Actual, from every raw reading
  const [auto, setAuto] = useState<{ raw: Clusters; km: number | null } | null>(null);
  useEffect(() => {
    if (!rawData?.length) return;
    const readings = rawData.flatMap((c) => [
      { lat: c.lat, lng: c.lng, time: c.start_time },
      ...(c.route_to_next_cluster ?? []).map((r) => ({ lat: r.lat, lng: r.lng, time: r.datetime1 })),
    ]);
    const ctrl = new AbortController();
    fetchAutologgedKm(readings, ctrl.signal)
      .then((km) => setAuto({ raw: rawData, km }))
      .catch(() => {
        /* offline / blocked → keep the map's own distance */
      });
    return () => ctrl.abort();
  }, [rawData]);
  const autoKm = auto && auto.raw === rawData ? auto.km : null;

  const track = useMemo(() => {
    const t = roadReady && road ? withRoadGeometry(baseTrack, road.legs) : baseTrack;
    // Replay, progress and timeline all add up to the auto-logged total
    return autoKm ? scaleTrack(t, autoKm * 1000) : t;
  }, [baseTrack, road, roadReady, autoKm]);

  const [status, setStatus] = useState<PlaybackStatus>("stopped");
  const [progress, setProgress] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [follow, setFollow] = useState(true);
  const [arrivedAt, setArrivedAt] = useState<TrackPoint | null>(null);

  const progressRef = useRef(0);
  const holdUntilRef = useRef(0);
  const statusRef = useRef(status);
  const speedRef = useRef(SPEEDS[speedIdx]);
  statusRef.current = status;
  speedRef.current = SPEEDS[speedIdx];

  // New day → back to the start. Road upgrade of the same day → keep the position.
  const prevTrackRef = useRef<{ base: Track; total: number } | null>(null);
  useEffect(() => {
    const prev = prevTrackRef.current;
    prevTrackRef.current = { base: baseTrack, total: track.total };
    if (prev && prev.base === baseTrack && prev.total > 0) {
      const scaled = (progressRef.current / prev.total) * track.total;
      progressRef.current = scaled;
      setProgress(scaled);
      return;
    }
    progressRef.current = 0;
    holdUntilRef.current = 0;
    setProgress(0);
    setArrivedAt(null);
    setStatus("stopped");
  }, [track, baseTrack]);

  // ---- animation loop ----------------------------------------------------
  useEffect(() => {
    if (status !== "playing" || track.total <= 0) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - last, 100); // don't jump after a background tab
      last = now;

      if (holdUntilRef.current) {
        if (now < holdUntilRef.current) {
          raf = requestAnimationFrame(tick);
          return;
        }
        holdUntilRef.current = 0;
        setArrivedAt(null);
      }

      const speed = speedRef.current;
      const prev = progressRef.current;
      let next = Math.min(
        track.total,
        prev + (track.total / BASE_DURATION_MS) * speed * dt,
      );

      // Pause briefly at each stop we reach
      const reached = track.stops.find((s) => s.dist > prev && s.dist <= next);
      if (reached) {
        next = reached.dist;
        holdUntilRef.current = now + Math.max(250, STOP_HOLD_MS / speed);
        setArrivedAt(reached.point);
      }

      progressRef.current = next;
      setProgress(next);

      if (next >= track.total && !holdUntilRef.current) {
        setStatus("ended");
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, track]);

  // ---- actions -------------------------------------------------------------
  const play = useCallback(() => {
    if (track.points.length < 2) return;
    if (statusRef.current === "ended") {
      progressRef.current = 0;
      holdUntilRef.current = 0;
      setProgress(0);
      setArrivedAt(null);
    }
    setStatus("playing");
  }, [track]);

  const pause = useCallback(
    () => setStatus((s) => (s === "playing" ? "paused" : s)),
    [],
  );

  const toggle = useCallback(() => {
    if (statusRef.current === "playing") pause();
    else play();
  }, [play, pause]);

  const stop = useCallback(() => {
    holdUntilRef.current = 0;
    progressRef.current = 0;
    setProgress(0);
    setArrivedAt(null);
    setStatus("stopped");
  }, []);

  const seek = useCallback(
    (dist: number) => {
      const d = Math.max(0, Math.min(track.total, dist));
      holdUntilRef.current = 0;
      progressRef.current = d;
      setProgress(d);
      setArrivedAt(null);
      setStatus((s) => (s === "playing" ? s : "paused"));
    },
    [track],
  );

  const seekToStop = useCallback(
    (stopIndex: number) => {
      const stop = track.stops.find((s) => s.point.stopIndex === stopIndex);
      if (!stop) return false;
      seek(stop.dist);
      return true;
    },
    [track, seek],
  );

  const cycleSpeed = useCallback(
    () => setSpeedIdx((i) => (i + 1) % SPEEDS.length),
    [],
  );

  // Space bar toggles play / pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        e.code !== "Space" ||
        target?.closest("input, textarea, button, [contenteditable], [role='slider']")
      )
        return;
      if (track.points.length < 2) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, track]);

  // ---- derived, slow-changing values ---------------------------------------
  const passedStops =
    status === "stopped"
      ? 0
      : track.stops.filter((s) => s.dist <= progress + 0.5).length;

  const atStop =
    arrivedAt?.stopIndex ??
    (status !== "stopped" && progress > 0
      ? track.stops.find((s) => Math.abs(s.dist - progress) < 0.5)?.point
          .stopIndex ?? null
      : null);

  const value = useMemo<PlaybackState>(
    () => ({
      track,
      distanceSource: autoKm ? "autologged" : roadReady ? "road" : "straight",
      status,
      speed: SPEEDS[speedIdx],
      follow,
      arrivedAt,
      atStop,
      passedStops,
      play,
      pause,
      toggle,
      stop,
      seek,
      seekToStop,
      cycleSpeed,
      setFollow,
    }),
    [
      track,
      roadReady,
      autoKm,
      status,
      speedIdx,
      follow,
      arrivedAt,
      atStop,
      passedStops,
      play,
      pause,
      toggle,
      stop,
      seek,
      seekToStop,
      cycleSpeed,
    ],
  );

  return (
    <PlaybackContext.Provider value={value}>
      <ProgressContext.Provider value={progress}>
        {children}
      </ProgressContext.Provider>
    </PlaybackContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayback() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error("usePlayback must be used inside <PlaybackProvider>");
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlaybackProgress() {
  return useContext(ProgressContext);
}
