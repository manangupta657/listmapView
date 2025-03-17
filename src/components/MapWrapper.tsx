import { JSXElementConstructor, ReactElement, ReactNode, ReactPortal, useMemo } from "react";
import { Tooltip, Typography } from "@mui/material";
import { formatDate, getDuration, getFlattenedData, getPolylinesData } from "../functionss";

import { AccessTime } from "@mui/icons-material";
import { Clusters } from "../types";
import { CustomMarker } from "./CustomMarker";
import FmdGoodOutlinedIcon from "@mui/icons-material/FmdGoodOutlined";
import { PolyLine } from "./Polygon";

export type MapWrapperProps = {
    map: any;
    data: Clusters | null;
    activeCluster: any;
    showOnlyStoppages: boolean;
};

export function MapWrapper({
    map,
    data,
    activeCluster,
    showOnlyStoppages,
}: MapWrapperProps) {
    const flattenedData = useMemo(() => {
        if (!data) return [];
        return getFlattenedData(data);
    }, [data]);

    const polyLinesData = useMemo(() => {
        if (showOnlyStoppages) {
            if (!activeCluster?.route_to_next_cluster?.length || !activeCluster)
                return [];
            return getPolylinesData(activeCluster?.route_to_next_cluster);
        } else {
            if (!flattenedData.length) return [];
            return getPolylinesData(flattenedData);
        }
    }, [activeCluster, flattenedData, showOnlyStoppages]);

    const CheckTimeAppend = (item: any) => {
        let timeString: string = "";

        flattenedData.forEach((mapData: any) => {
            if (item.lat === mapData.lat && item.lng === mapData.lng) {
                if (timeString) {
                    timeString += ", " + formatDate(mapData.datetime);
                } else {
                    timeString = formatDate(mapData.datetime);
                }
            }
        });
        return timeString;
    };

    const onlyStoppagePoints = flattenedData
        ?.filter(
            (d) => d.stoppageIndex !== undefined && d.address !== "Travel 🚗",
        );
    return (
        <>
            <PolyLine data={polyLinesData} map={map} />
            {onlyStoppagePoints.map((item) => {
                const key = item.stoppageIndex;
                return (
                    <CustomMarker
                        key={key}
                        map={map}
                        position={{ lat: item.lat, lng: item.lng }}
                        onClick={null}
                    >
                        <Tooltip
                            placement="top"
                            title={
                                <div className="popper-container">
                                    <div className="popper-data">
                                        {/* <Place /> */}
                                        <FmdGoodOutlinedIcon />
                                        <Typography>
                                            <span className="popper-value">{item.address}</span>
                                        </Typography>
                                    </div>
                                    <div className="popper-data">
                                        <AccessTime />
                                        <Typography>
                                            <span className="popper-value">
                                                {getDuration(item.start_time, item.end_time)}
                                            </span>
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
                                        "& .MuiTooltip-arrow": {
                                            color: "common.white",
                                        },
                                    },
                                },
                            }}
                        >
                            <div
                                className={`marker ${item.address === "Travel 🚗" ? "route" : item.type
                                    }`}
                                style={{ background: item.color }}
                            >
                                {item.stoppageIndex}
                            </div>
                        </Tooltip>
                    </CustomMarker>
                );
            })
            }
            {!showOnlyStoppages && flattenedData.map((item) => {
                if (onlyStoppagePoints.find(stoppage => stoppage.lat === item.lat && stoppage.lng === item.lng)) return <></>
                const key = item.lat + item.lng;
                return (
                    <CustomMarker
                        key={key}
                        map={map}
                        position={{ lat: item.lat, lng: item.lng }}
                        onClick={null}
                    >
                        <Tooltip
                            placement="top"
                            title={
                                <div className="popper-container">
                                    <div className="popper-data">
                                        {/* <Place /> */}
                                        <FmdGoodOutlinedIcon />
                                        <Typography>
                                            <span className="popper-value">{item.address}</span>
                                        </Typography>
                                    </div>
                                    <div className="popper-data">
                                        <AccessTime />
                                        <Typography>
                                            <span className="popper-value">
                                                {CheckTimeAppend(item)}
                                            </span>
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
                                        "& .MuiTooltip-arrow": {
                                            color: "common.white",
                                        },
                                    },
                                },
                            }}
                        >
                            <div
                                className={`marker ${item.address === "Travel 🚗" ? "route" : item.type
                                    }`}
                                style={{ background: item.color }}
                            >
                                {item.stoppageIndex}
                            </div>
                        </Tooltip>
                    </CustomMarker>
                );
            })}
            {activeCluster &&
                activeCluster.route_to_next_cluster.map((item: { lat: any; lng: any; address: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; datetime1: string; }, index: number) => {
                    const key = item.lat + item.lng;
                    if (
                        !(
                            index === 0 ||
                            index === activeCluster.route_to_next_cluster.length - 1
                        )
                    ) {
                        return (
                            <CustomMarker
                                key={key}
                                map={map}
                                position={{ lat: item.lat, lng: item.lng }}
                                onClick={null}
                            >
                                <Tooltip
                                    placement="top"
                                    title={
                                        <div className="popper-container">
                                            <div className="popper-data">
                                                {/* <Place /> */}
                                                <FmdGoodOutlinedIcon />
                                                <Typography>
                                                    <span className="popper-value">{item.address}</span>
                                                </Typography>
                                            </div>
                                            <div className="popper-data">
                                                <AccessTime />
                                                <Typography>
                                                    <span className="popper-value">
                                                        {formatDate(item.datetime1)}
                                                    </span>
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
                                                "& .MuiTooltip-arrow": {
                                                    color: "common.white",
                                                },
                                            },
                                        },
                                    }}
                                >
                                    <div
                                        className="marker route"
                                        style={{ background: "blue" }}
                                    ></div>
                                </Tooltip>
                            </CustomMarker>
                        );
                    }
                })}
        </>
    );
}
