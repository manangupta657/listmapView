import { Box, IconButton, Slider, Tooltip, Typography } from "@mui/material";
import {
  MyLocationRounded,
  PauseRounded,
  PlaceRounded,
  PlayArrowRounded,
  ReplayRounded,
  StopRounded,
} from "@mui/icons-material";
import { Track, formatKm, formatMinutes, minutesBetween, sampleTrack } from "../utils/playback";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePlayback, usePlaybackProgress } from "../playback/PlaybackContext";

import dayjs from "dayjs";

const FOLLOW_ZOOM = 16;
export const ROUTE_COLOR = "#234C87";
const ROUTE_DONE_COLOR = "#2F5FA6";
const ROUTE_DONE_EDGE = "#14213D";
const ROUTE_BG_COLOR = "#A9B3C1";

function createVehicleElement() {
  const root = document.createElement("div");
  root.className = "nav-vehicle";
  root.innerHTML = `
    <span class="nav-pulse"></span>
    <div class="nav-arrow">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="#fff" d="M12 2 4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
      </svg>
    </div>`;
  return root;
}

function fitTrack(map: google.maps.Map, track: Track) {
  if (!track.points.length) return;
  const bounds = new google.maps.LatLngBounds();
  track.points.forEach((p) => bounds.extend(p));
  map.fitBounds(bounds, { top: 80, left: 40, right: 40, bottom: 220 });
}

const fmtTime = (ms: number | null) => (ms ? dayjs(ms).format("hh:mm a") : "--:--");

/** Map layers (route, travelled line, vehicle) + floating player UI */
export function RoutePlayback({ map }: { map: google.maps.Map }) {
  const {
    track,
    status,
    speed,
    follow,
    arrivedAt,
    atStop,
    play,
    pause,
    stop,
    seek,
    cycleSpeed,
    setFollow,
  } = usePlayback();
  const progress = usePlaybackProgress();

  const doneLineRef = useRef<google.maps.Polyline | null>(null);
  const edgeLineRef = useRef<google.maps.Polyline | null>(null);
  const vehicleRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const arrowRef = useRef<HTMLElement | null>(null);
  const angleRef = useRef(0);
  const followRef = useRef(follow);
  followRef.current = follow;

  const hasRoute = track.points.length >= 2;

  // ---- map objects -------------------------------------------------------
  useEffect(() => {
    if (!hasRoute) return;

    const routeLine = new google.maps.Polyline({
      map,
      path: track.points,
      strokeColor: ROUTE_BG_COLOR,
      strokeOpacity: 0.95,
      strokeWeight: 6,
      zIndex: 1,
      icons: [
        {
          icon: {
            path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
            scale: 2,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          offset: "40px",
          repeat: "120px",
        },
      ],
    });
    const edgeLine = new google.maps.Polyline({
      map,
      path: [],
      strokeColor: ROUTE_DONE_EDGE,
      strokeWeight: 9,
      zIndex: 2,
    });
    const doneLine = new google.maps.Polyline({
      map,
      path: [],
      strokeColor: ROUTE_DONE_COLOR,
      strokeWeight: 5,
      zIndex: 3,
    });

    const el = createVehicleElement();
    const vehicle = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: track.points[0],
      content: el,
      zIndex: 10000,
      title: "Playback position",
    });

    doneLineRef.current = doneLine;
    edgeLineRef.current = edgeLine;
    vehicleRef.current = vehicle;
    arrowRef.current = el.querySelector(".nav-arrow");
    angleRef.current = 0;

    // Dragging the map means the user wants to look around — stop following.
    const dragListener = map.addListener("dragstart", () => setFollow(false));

    return () => {
      dragListener.remove();
      routeLine.setMap(null);
      edgeLine.setMap(null);
      doneLine.setMap(null);
      vehicle.map = null;
      doneLineRef.current = null;
      edgeLineRef.current = null;
      vehicleRef.current = null;
      arrowRef.current = null;
    };
  }, [map, track, hasRoute, setFollow]);

  /** Move the vehicle + travelled line to `dist` metres along the track */
  const renderAt = useCallback(
    (dist: number, pan: boolean, clear: boolean) => {
      const sample = sampleTrack(track, dist);
      const lines = [doneLineRef.current, edgeLineRef.current];
      const vehicle = vehicleRef.current;
      if (!sample || !vehicle || lines.some((l) => !l)) return;

      const here = new google.maps.LatLng(sample.lat, sample.lng);
      vehicle.position = here;

      if (arrowRef.current) {
        // Rotate the shortest way round so the arrow never spins 350°
        const target = dist > 0 ? sample.heading : 0;
        const delta = ((target - angleRef.current + 540) % 360) - 180;
        angleRef.current += delta;
        arrowRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      }

      // Travelled path = points[0..segIndex] + current position, updated incrementally
      const fixed = sample.segIndex + 1;
      for (const line of lines as google.maps.Polyline[]) {
        const path = line.getPath();
        if (clear) {
          path.clear();
          continue;
        }
        if (path.getLength() > 0) path.pop();
        while (path.getLength() > fixed) path.pop();
        while (path.getLength() < fixed) {
          path.push(new google.maps.LatLng(track.points[path.getLength()]));
        }
        path.push(here);
      }

      if (pan) map.moveCamera({ center: here });
    },
    [map, track],
  );

  // Draw on every progress tick (and after the layers are rebuilt)
  useEffect(() => {
    renderAt(progress, follow && status !== "stopped", status === "stopped");
  }, [progress, status, follow, renderAt]);

  // Camera reacts to status changes
  const prevStatus = useRef(status);
  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;
    if (!hasRoute) return;
    if (status === "playing" && (prev === "stopped" || prev === "ended") && followRef.current) {
      const s = sampleTrack(track, progress);
      if (s) {
        map.moveCamera({
          center: { lat: s.lat, lng: s.lng },
          zoom: Math.max(map.getZoom() ?? 0, FOLLOW_ZOOM),
        });
      }
    }
    if (status === "stopped" && prev !== "stopped") fitTrack(map, track);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const toggleFollow = () => {
    const next = !follow;
    setFollow(next);
    if (next) {
      const s = sampleTrack(track, progress);
      if (s) {
        map.moveCamera({
          center: { lat: s.lat, lng: s.lng },
          zoom: Math.max(map.getZoom() ?? 0, FOLLOW_ZOOM),
        });
      }
    }
  };

  // ---- view --------------------------------------------------------------
  const sample = useMemo(() => sampleTrack(track, progress), [track, progress]);
  const marks = useMemo(() => track.stops.map((s) => ({ value: s.dist })), [track]);

  if (!hasRoute) return null;

  const first = track.points[0];
  const lastPoint = track.points[track.points.length - 1];
  const isPlaying = status === "playing";
  const nextStop = track.stops.find((s) => s.dist > progress + 0.5);
  const lastStop = track.stops[track.stops.length - 1];
  const clock =
    status === "stopped"
      ? first.arriveAt
      : arrivedAt
        ? arrivedAt.arriveAt
        : atStop !== null
          ? track.stops.find((s) => s.point.stopIndex === atStop)?.point.arriveAt ?? null
          : sample?.time ?? null;

  let statusText: string;
  if (status === "stopped") {
    statusText = `Ready to replay the day · ${track.stops.length} stops · ${formatKm(track.total)}`;
  } else if (status === "ended") {
    statusText = `Replay finished${lastStop ? ` · last seen at ${lastStop.point.address}` : ""}`;
  } else if (atStop !== null) {
    const s = track.stops.find((x) => x.point.stopIndex === atStop);
    statusText = `At stop ${atStop} · ${s?.point.address ?? ""}`;
  } else if (nextStop) {
    statusText = `En route to stop ${nextStop.point.stopIndex} · ${nextStop.point.address}`;
  } else {
    statusText = sample?.lastPoint.address || "On the move";
  }
  const showNext = status !== "stopped" && status !== "ended" && atStop === null && !!nextStop;

  return (
    <>
      <div className="map-legend" aria-hidden="true">
        <span><i className="legend-line done" />Travelled</span>
        <span><i className="legend-line" />Rest of day</span>
        <span><i className="legend-stop" />Stop</span>
      </div>

      <Tooltip title={follow ? "Following vehicle — drag the map to look around" : "Follow vehicle"} placement="left">
        <IconButton
          onClick={toggleFollow}
          aria-label="Follow vehicle"
          aria-pressed={follow}
          className={`map-follow-btn ${follow ? "on" : ""}`}
        >
          <MyLocationRounded />
        </IconButton>
      </Tooltip>

      <section className="playback-panel" aria-label="Route playback">
        {arrivedAt ? (
          <div className="playback-arrival">
            <span className="playback-arrival-badge">{arrivedAt.stopIndex}</span>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <div className="playback-eyebrow">Arrived at stop {arrivedAt.stopIndex}</div>
              <Typography variant="body1" noWrap fontWeight={600}>
                {arrivedAt.address}
              </Typography>
            </Box>
            {arrivedAt.startTime && arrivedAt.endTime ? (
              <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                <Typography variant="body2" fontWeight={600}>
                  {formatMinutes(minutesBetween(arrivedAt.startTime, arrivedAt.endTime))}
                </Typography>
                <Typography variant="caption" color="text.secondary" className="tabular">
                  {dayjs(arrivedAt.startTime).format("hh:mm a")} – {dayjs(arrivedAt.endTime).format("hh:mm a")}
                </Typography>
              </Box>
            ) : null}
          </div>
        ) : (
          <div className="playback-now">
            <PlaceRounded fontSize="small" sx={{ color: ROUTE_COLOR, flexShrink: 0 }} />
            <Typography variant="body1" noWrap fontWeight={600} sx={{ minWidth: 0, flex: 1 }}>
              {statusText}
            </Typography>
            {showNext && nextStop ? (
              <span className="playback-chip">{formatKm(nextStop.dist - progress)} to go</span>
            ) : null}
          </div>
        )}

        <Slider
          size="small"
          min={0}
          max={track.total}
          step={track.total / 1000 || 1}
          value={progress}
          marks={marks}
          onChange={(_, v) => seek(v as number)}
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => fmtTime(sampleTrack(track, v)?.time ?? null)}
          aria-label="Playback position"
          getAriaValueText={(v) => fmtTime(sampleTrack(track, v)?.time ?? null)}
          className="playback-slider"
        />

        <div className="playback-controls">
          <div className="playback-meta">
            <span className="playback-clock tabular">{fmtTime(clock)}</span>
            <Typography variant="caption" color="text.secondary" className="tabular">
              {formatKm(progress)} of {formatKm(track.total)}
            </Typography>
          </div>

          <div className="playback-buttons">
            <Tooltip title="Stop">
              <span>
                <IconButton
                  onClick={stop}
                  disabled={status === "stopped"}
                  aria-label="Stop and reset"
                  className="playback-stop-btn"
                >
                  <StopRounded />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={isPlaying ? "Pause (Space)" : status === "ended" ? "Replay" : "Play (Space)"}>
              <IconButton
                onClick={isPlaying ? pause : play}
                aria-label={isPlaying ? "Pause" : status === "ended" ? "Replay from start" : "Play"}
                className="playback-main-btn"
              >
                {isPlaying ? (
                  <PauseRounded fontSize="large" />
                ) : status === "ended" ? (
                  <ReplayRounded fontSize="large" />
                ) : (
                  <PlayArrowRounded fontSize="large" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Playback speed">
              <button type="button" className="playback-speed" onClick={cycleSpeed} aria-label={`Playback speed ${speed}×`}>
                {speed}×
              </button>
            </Tooltip>
          </div>

          <div className="playback-meta playback-meta-end">
            <Typography variant="caption" color="text.secondary">
              {follow ? "Following vehicle" : "Free map"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap className="tabular">
              {fmtTime(first.arriveAt)} – {fmtTime(lastPoint.departAt ?? lastPoint.arriveAt)}
            </Typography>
          </div>
        </div>
      </section>
    </>
  );
}
