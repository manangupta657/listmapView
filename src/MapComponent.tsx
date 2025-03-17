import { Box, CircularProgress } from "@mui/material";
import { Cluster, Clusters } from "./types";
import { useEffect, useRef, useState } from "react";

import { MapWrapper } from "./components/MapWrapper";
import Typography from "@mui/material/Typography";
import { Wrapper } from "@googlemaps/react-wrapper";

type Props = {
  data: Clusters | null;
  activeCluster: Cluster | null;
  apiInProgress: boolean;
  showOnlyStoppages: boolean;
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
  showOnlyStoppages,
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
        showOnlyStoppages={showOnlyStoppages}
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

function MyMap({
  data,
  activeCluster,
  apiInProgress,
  showOnlyStoppages,
}: Props) {
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
        <MapWrapper
          map={map}
          data={data}
          activeCluster={activeCluster}
          showOnlyStoppages={showOnlyStoppages}
        />
      ) : (
        <></>
      )}
    </>
  );
}

