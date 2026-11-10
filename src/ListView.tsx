import { Cluster, Clusters } from "./types";
import { Collapse, IconButton, Skeleton, Switch, Typography } from "@mui/material";
import { CleanupStats } from "./utils/cleanup";
import { DirectionsCarRounded, ExpandLess, ExpandMore } from "@mui/icons-material";
import { TRAVEL_LABEL, formatKm, formatMinutes, minutesBetween } from "./utils/playback";
import { useEffect, useMemo, useRef, useState } from "react";

import BasicTimeline from "./TimeLine";
import dayjs from "dayjs";
import { getTransformedLocationForList } from "./functionss";
import { usePlayback } from "./playback/PlaybackContext";

type Props = {
  data: Clusters | null;
  activeCluster: Cluster | null;
  setActiveCluster: (data: Cluster | null) => void;
  showOnlyStoppages: boolean;
  cleanGps: boolean;
  onToggleCleanGps: () => void;
  cleanup: CleanupStats | null;
};

const fmt = (t?: string) => (t ? dayjs(t).format("hh:mm a") : "");
const isTravel = (c: Cluster) => c.address === TRAVEL_LABEL;

export default function ListView({
  data,
  activeCluster,
  setActiveCluster,
  showOnlyStoppages,
  cleanGps,
  onToggleCleanGps,
  cleanup,
}: Props) {
  const { track, status, atStop, passedStops, seek, seekToStop, follow } = usePlayback();
  const [expanded, setExpanded] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Give each travel leg its start/end stop so the expanded route reads end to end
  useEffect(() => {
    if (data) {
      for (let i = 1; i < data?.length - 1; i++) {
        const lastStoppage = getTransformedLocationForList(data[i - 1]);
        const nextStoppage = getTransformedLocationForList(data[i + 1]);

        if (data[i].route_to_next_cluster.length) {
          if (
            data[i].route_to_next_cluster[0].lat != lastStoppage.lat ||
            data[i].route_to_next_cluster[0].lng != lastStoppage.lng
          )
            data[i].route_to_next_cluster.splice(0, 0, lastStoppage);
          if (
            data[i].route_to_next_cluster[data[i].route_to_next_cluster.length - 1].lat != nextStoppage.lat ||
            data[i].route_to_next_cluster[data[i].route_to_next_cluster.length - 1].lng != nextStoppage.lng
          )
            data[i].route_to_next_cluster.push(nextStoppage);
        }
      }
    }
  }, [data]);

  useEffect(() => setExpanded(null), [data]);

  /** stoppageIndex → { order along the track, distance along the track } */
  const stopInfo = useMemo(() => {
    const info = new Map<number, { order: number; dist: number }>();
    track.stops.forEach((s, order) => {
      if (s.point.stopIndex !== undefined) info.set(s.point.stopIndex, { order, dist: s.dist });
    });
    return info;
  }, [track]);

  const summary = useMemo(() => {
    if (!data?.length) return null;
    let moving = 0;
    let stopped = 0;
    let stops = 0;
    data.forEach((c) => {
      const mins = minutesBetween(c.start_time, c.end_time);
      if (isTravel(c)) moving += mins;
      else {
        stopped += mins;
        stops += 1;
      }
    });
    return {
      stops,
      moving,
      stopped,
      first: fmt(data[0].start_time),
      last: fmt(data[data.length - 1].end_time),
    };
  }, [data]);

  const active = status !== "stopped";
  const lastPassed = passedStops > 0 ? track.stops[passedStops - 1]?.point.stopIndex : undefined;

  // Keep the current row in view while the replay runs
  useEffect(() => {
    if (status !== "playing") return;
    listRef.current
      ?.querySelector(".tl-row.is-current")
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [atStop, passedStops, status]);

  return (
    <div className="sidebar-inner">
      <section className="day-summary" aria-label="Day summary">
        <div className="day-summary-head">
          <h2>Day summary</h2>
          {summary ? (
            <span className="tabular">
              {summary.first} – {summary.last}
            </span>
          ) : null}
        </div>
        <div className="stat-grid">
          <Stat label="Distance" value={track.total > 0 ? formatKm(track.total) : "—"} loading={!data} />
          <Stat label="Stops" value={summary ? String(summary.stops) : "—"} loading={!data} />
          <Stat label="On the move" value={summary ? formatMinutes(summary.moving) : "—"} loading={!data} />
          <Stat label="At stops" value={summary ? formatMinutes(summary.stopped) : "—"} loading={!data} />
        </div>
        <label className="cleanup-row">
          <span className="cleanup-text">
            <span className="cleanup-title">GPS clean-up</span>
            <span className="cleanup-caption">
              {!cleanGps
                ? "Showing raw readings"
                : cleanup && cleanup.rawStops !== cleanup.stops
                  ? `${cleanup.rawStops} raw stops → ${cleanup.stops} · ${
                      cleanup.droppedReadings + cleanup.absorbedReadings
                    } noisy readings folded in`
                  : "Drift and duplicate stops removed"}
            </span>
          </span>
          <Switch
            size="small"
            checked={cleanGps}
            onChange={onToggleCleanGps}
            inputProps={{ "aria-label": "GPS clean-up" }}
          />
        </label>
      </section>

      <div className="timeline-head">
        <h3>Timeline</h3>
        {track.stops.length ? <span>Click a stop to jump there</span> : null}
      </div>

      <div className="timeline" ref={listRef}>
        {!data ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : null}

        {data && data.length === 0 ? (
          <Typography className="no-location">No locations tracked on this date</Typography>
        ) : null}

        {data?.map((item, index) => {
          if (isTravel(item)) {
            if (showOnlyStoppages) return null;
            const prevStop = data[index - 1]?.stoppageIndex;
            const nextStop = data[index + 1]?.stoppageIndex;
            const from = prevStop !== undefined ? stopInfo.get(prevStop) : undefined;
            const to = nextStop !== undefined ? stopInfo.get(nextStop) : undefined;
            const legKm = from && to ? formatKm(to.dist - from.dist) : null;
            const onLeg = active && atStop === null && prevStop !== undefined && prevStop === lastPassed;
            const legDone = active && to !== undefined && to.order < passedStops;
            const isOpen = expanded === index;

            return (
              <div key={index} className={`tl-leg ${onLeg ? "is-current" : ""} ${legDone || onLeg ? "done" : ""} tl-row`}>
                <button
                  type="button"
                  className="tl-leg-main"
                  onClick={() => from && seek(from.dist + 1)}
                  aria-label={`Jump to the drive at ${fmt(item.start_time)}`}
                >
                  <span className="tl-rail" aria-hidden="true" />
                  <DirectionsCarRounded sx={{ fontSize: 16 }} />
                  <span className="tabular">
                    Travel{legKm ? ` · ${legKm}` : ""} · {formatMinutes(minutesBetween(item.start_time, item.end_time))}
                  </span>
                </button>
                {item.route_to_next_cluster.length > 0 ? (
                  <IconButton
                    size="small"
                    aria-label={isOpen ? "Hide route points" : "Show route points"}
                    aria-expanded={isOpen}
                    onClick={() => {
                      setExpanded(isOpen ? null : index);
                      setActiveCluster(isOpen ? null : item);
                    }}
                  >
                    {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  </IconButton>
                ) : null}
                <Collapse in={isOpen} timeout="auto" unmountOnExit className="tl-leg-detail">
                  <BasicTimeline routes={item.route_to_next_cluster} color="#2B6EF2" />
                </Collapse>
              </div>
            );
          }

          const n = item.stoppageIndex;
          const info = n !== undefined ? stopInfo.get(n) : undefined;
          const visited = active && info !== undefined && info.order < passedStops;
          const isHere = active && atStop !== null && atStop === n;
          const isSelected = activeCluster === item;
          const mins = minutesBetween(item.start_time, item.end_time);

          return (
            <button
              key={index}
              type="button"
              className={`tl-row tl-stop ${isHere ? "is-current" : ""} ${isSelected ? "is-selected" : ""}`}
              onClick={() => {
                const jumped = n !== undefined && seekToStop(n);
                if (!jumped || !follow) setActiveCluster(item);
              }}
              aria-label={`Stop ${n ?? ""}: ${item.address}`}
            >
              <span className={`tl-badge ${visited ? "visited" : ""}`}>{n}</span>
              <span className="tl-body">
                <span className="tl-title-row">
                  <span className="tl-title" title={item.full_address ?? item.address}>
                    {item.address}
                  </span>
                  {mins >= 1 ? <span className="tl-dur">{formatMinutes(mins)}</span> : null}
                </span>
                <span className="tl-time tabular">
                  {mins >= 1 ? `${fmt(item.start_time)} – ${fmt(item.end_time)}` : fmt(item.start_time)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value tabular">{loading ? <Skeleton width="60%" /> : value}</div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="tl-skeleton">
      <Skeleton animation="wave" variant="circular" width={28} height={28} />
      <div style={{ flex: 1 }}>
        <Skeleton animation="wave" width="80%" height={22} />
        <Skeleton animation="wave" width="50%" height={16} />
      </div>
    </div>
  );
}
