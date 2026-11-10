import { Cluster, Clusters, FlattenedData, RouteToNextCluster } from "../types";
import { ReactNode, useMemo } from "react";
import { Tooltip, Typography } from "@mui/material";
import { formatDate, getDuration, getFlattenedData } from "../functionss";

import { AccessTime } from "@mui/icons-material";
import { CustomMarker } from "./CustomMarker";
import FmdGoodOutlinedIcon from "@mui/icons-material/FmdGoodOutlined";
import { RoutePlayback } from "./RoutePlayback";
import { TRAVEL_LABEL } from "../utils/playback";
import { usePlayback } from "../playback/PlaybackContext";

export type MapWrapperProps = {
    map: google.maps.Map;
    data: Clusters | null;
    activeCluster: Cluster | null;
    showOnlyStoppages: boolean;
};

function MarkerTooltip({ address, time, children }: { address: string; time: string; children: ReactNode }) {
    return (
        <Tooltip
            placement="top"
            title={
                <div className="popper-container">
                    <div className="popper-data">
                        <FmdGoodOutlinedIcon />
                        <Typography>
                            <span className="popper-value">{address}</span>
                        </Typography>
                    </div>
                    <div className="popper-data">
                        <AccessTime />
                        <Typography>
                            <span className="popper-value">{time}</span>
                        </Typography>
                    </div>
                </div>
            }
            arrow
            disableFocusListener
            componentsProps={{
                tooltip: {
                    sx: {
                        bgcolor: "common.white",
                        color: "common.black",
                        boxShadow: "0 4px 16px rgba(20,24,31,.18)",
                        "& .MuiTooltip-arrow": { color: "common.white" },
                    },
                },
            }}
        >
            {/* Tooltip needs a single element child that can hold a ref */}
            <div>{children}</div>
        </Tooltip>
    );
}

export function MapWrapper({ map, data, activeCluster, showOnlyStoppages }: MapWrapperProps) {
    const { track, passedStops } = usePlayback();

    const flattenedData = useMemo(() => {
        if (!data) return [];
        return getFlattenedData(data);
    }, [data]);

    const stopPoints = useMemo(
        () =>
            flattenedData.filter(
                (d): d is Extract<FlattenedData, { type: "halt" }> =>
                    d.type === "halt" && d.stoppageIndex !== undefined && d.address !== TRAVEL_LABEL,
            ),
        [flattenedData],
    );

    // Order of each stop along the track, to know which ones the vehicle passed
    const stopOrder = useMemo(() => {
        const order = new Map<number, number>();
        track.stops.forEach((s, i) => {
            if (s.point.stopIndex !== undefined) order.set(s.point.stopIndex, i);
        });
        return order;
    }, [track]);

    // All times the person was seen at each route coordinate
    const routeTimes = useMemo(() => {
        const times = new Map<string, string[]>();
        flattenedData.forEach((d) => {
            if (d.type !== "route") return;
            const key = `${d.lat},${d.lng}`;
            times.set(key, [...(times.get(key) ?? []), formatDate(d.datetime)]);
        });
        return times;
    }, [flattenedData]);

    const routePoints = useMemo(() => {
        const stopKeys = new Set(stopPoints.map((s) => `${s.lat},${s.lng}`));
        const seen = new Set<string>();
        return flattenedData.filter((d) => {
            if (d.type !== "route") return false;
            const key = `${d.lat},${d.lng}`;
            if (stopKeys.has(key) || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [flattenedData, stopPoints]);

    const activeRoute: RouteToNextCluster[] = activeCluster?.route_to_next_cluster ?? [];

    return (
        <>
            <RoutePlayback map={map} />

            {stopPoints.map((item) => {
                const order = stopOrder.get(item.stoppageIndex as number);
                const visited = order !== undefined && order < passedStops;
                return (
                    <CustomMarker
                        key={`stop-${item.stoppageIndex}`}
                        map={map}
                        position={{ lat: item.lat, lng: item.lng }}
                        onClick={null}
                    >
                        <MarkerTooltip address={item.full_address ?? item.address} time={getDuration(item.start_time, item.end_time)}>
                            <div className={`stop-marker ${visited ? "visited" : ""}`}>{item.stoppageIndex}</div>
                        </MarkerTooltip>
                    </CustomMarker>
                );
            })}

            {!showOnlyStoppages &&
                routePoints.map((item) => {
                    const key = `${item.lat},${item.lng}`;
                    return (
                        <CustomMarker key={`route-${key}`} map={map} position={{ lat: item.lat, lng: item.lng }} onClick={null}>
                            <MarkerTooltip address={item.full_address ?? item.address} time={(routeTimes.get(key) ?? []).join(", ")}>
                                <div className="route-dot" />
                            </MarkerTooltip>
                        </CustomMarker>
                    );
                })}

            {activeRoute.map((item, index) => {
                if (index === 0 || index === activeRoute.length - 1) return null;
                return (
                    <CustomMarker
                        key={`active-${item.lat},${item.lng},${index}`}
                        map={map}
                        position={{ lat: item.lat, lng: item.lng }}
                        onClick={null}
                    >
                        <MarkerTooltip address={item.full_address ?? item.address} time={formatDate(item.datetime1)}>
                            <div className="route-dot active" />
                        </MarkerTooltip>
                    </CustomMarker>
                );
            })}
        </>
    );
}
