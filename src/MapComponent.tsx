import { Box, CircularProgress, Tooltip } from "@mui/material";
import { Cluster, Clusters } from "./types";
import { getDuration, getFlattenedData, getPolylinesData } from "./functionss";
import { useEffect, useMemo, useRef, useState } from "react";

import { AccessTime } from "@mui/icons-material";
import FmdGoodOutlinedIcon from "@mui/icons-material/FmdGoodOutlined";
import Typography from "@mui/material/Typography";
import { Wrapper } from "@googlemaps/react-wrapper";
import { createRoot } from "react-dom/client";

type Props = {
  data: Clusters | null;
  activeCluster: Cluster | null;
  apiInProgress: boolean;
};

const WeatherComponentStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  zIndex: 1000,
};
// old key : AIzaSyCf2_txZACzBqNY99vHR1YWdbExpCuQ_Lg
export default function GoogleMaps({
  data,
  activeCluster,
  apiInProgress,
}: Props) {
  return (
    <Wrapper
      apiKey={"AIzaSyCXmuZgrN0tJsciGtndwNGsBDT5lISv3bM"}
      version="beta"
      libraries={["marker"]}
    >
      <MyMap
        apiInProgress={apiInProgress}
        data={data}
        activeCluster={activeCluster}
      />
    </Wrapper>
  );
}

const mapOptions = {
  mapId: "DEMO_MAP_ID",
  center: { lat: 24.6628595, lng: 77.3348837 },
  zoom: 12,
  disableDefaultUI: true,
  zoomControl: true,
  scaleControl: true,
};

function MyMap({ data, activeCluster, apiInProgress }: Props) {
  const [map, setMap] = useState<google.maps.Map>();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (data && data.length > 0) {
      if (ref.current) {
        const center = { lat: data[0].lat, lng: data[0].lng };
        const map = new window.google.maps.Map(ref.current, {
          ...mapOptions,
          center,
        });
        setMap(map);
      }
    }
  }, [data]);

  useEffect(() => {
    if (activeCluster && map) {
      // map.setCenter({ lat: activeCluster.lat, lng: activeCluster.lng })
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: activeCluster.lat, lng: activeCluster.lng });
      map.fitBounds(bounds);
      map.setZoom(15);
    }
  }, [activeCluster, map]);

  if (apiInProgress) {
    return (
      <Box sx={WeatherComponentStyle}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {!map ? (
        <Typography
          sx={{ display: { lg: "none", md: "none" } }}
          className="no-location"
        >
          No locations tracked on this date
        </Typography>
      ) : (
        <></>
      )}
      <div ref={ref} id="map" />
      {map ? (
        <MapWrapper map={map} data={data} activeCluster={activeCluster} />
      ) : (
        <></>
      )}
    </>
  );
}

type MapWrapperProps = {
  map: any;
  data: Clusters | null;
  activeCluster: any;
};

function MapWrapper({ map, data, activeCluster }: MapWrapperProps) {
  const flattenedData = useMemo(() => {
    if (!data) return [];
    return getFlattenedData(data);
  }, [data]);

  const polyLinesData = useMemo(() => {
    if (!activeCluster?.route_to_next_cluster?.length || !activeCluster)
      return [];
    return getPolylinesData(activeCluster?.route_to_next_cluster);
  }, [activeCluster]);

  return (
    <>
      <PolyLine data={polyLinesData} map={map} />
      {flattenedData
        ?.filter((d) => d.stoppageIndex !== undefined)
        .map((item) => {
          const key = item.stoppageIndex;
          return (
            <Marker
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
                          {" "}
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
                  className={`marker ${item.stoppageIndex}`}
                  style={{ background: item.color }}
                >
                  {item.stoppageIndex}
                </div>
              </Tooltip>
            </Marker>
          );
        })}
    </>
  );
}

function Marker({ map, position, children, onClick }) {
  const rootRef = useRef();
  const markerRef = useRef();

  useEffect(() => {
    if (!rootRef.current) {
      const container = document.createElement("div");
      rootRef.current = createRoot(container);
      markerRef.current = new google.maps.marker.AdvancedMarkerView({
        position,
        content: container,
      });
    }

    return () => {
      markerRef.current.map = null;
    };
  }, [position]);

  useEffect(() => {
    rootRef.current.render(children);
    markerRef.current.position = position;
    markerRef.current.map = map;
    const listener = markerRef.current.addListener("click", onClick);
    return () => listener.remove();
  }, [map, position, children, onClick]);

  return <></>;
}
function PolyLine({ map, data }) {
  useEffect(() => {
    const flightPath = new google.maps.Polyline({
      path: data,
      geodesic: true,
      strokeColor: "#000000",
      strokeOpacity: 1,
      strokeWeight: 1,
      icons: [
        {
          icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
          offset: "100%",
          repeat: "80px",
        },
      ],
    });
    if (data.length) {
      flightPath.setMap(map);
    }
    return () => {
      flightPath.setMap(null);
    };
  }, [map, data]);

  return <></>;
}
