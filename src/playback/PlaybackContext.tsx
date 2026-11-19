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
import { Track, TrackPoint, buildTrack } from "../utils/playback";

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
  children,
}: {
  data: Clusters | null;
  children: ReactNode;
}) {
  const track = useMemo(
    () => buildTrack(data ? getFlattenedData(data) : []),
    [data],
  );

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

  // New day → back to the start
  useEffect(() => {
    progressRef.current = 0;
    holdUntilRef.current = 0;
    setProgress(0);
    setArrivedAt(null);
    setStatus("stopped");
  }, [track]);

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
