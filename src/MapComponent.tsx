// @ts-nocheck
import { Wrapper } from "@googlemaps/react-wrapper";
import { useRef, useEffect, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Clusters } from "./types";
import { getFlattenedData } from "./functionss";

type Props = {
  data: Clusters | null
}

export default function GoogleMaps({data}: Props) {
  console.log("data is", data)
  return (
    <Wrapper
      apiKey={"AIzaSyCf2_txZACzBqNY99vHR1YWdbExpCuQ_Lg"}
      version="beta"
      libraries={["marker"]}
    >
      <MyMap data={data}/>
    </Wrapper>
  );
}

const mapOptions = {
  mapId: "DEMO_MAP_ID",
  center: { lat: 24.6628595, lng: 77.3348837 },
  zoom: 10,
  disableDefaultUI: true,
};

function MyMap({data}: Props) {
  const [map, setMap] = useState<google.maps.Map>();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (data){
      if (ref.current){
        const center = { lat: data[0].lat, lng: data[0].lng }
        const map = new window.google.maps.Map(ref.current, {...mapOptions, center})
        setMap(map);
      }
    }
  }, [JSON.stringify(data)]);

  return (
    <>
      <div ref={ref} id="map" />
      {map && <Weather map={map} data={data}/>}
    </>
  );
}

type WhetherProps = {
  map: any;
  data: Clusters | null
}

function Weather({ map, data }: WhetherProps) {
  const [highlight, setHighlight] = useState("");
  const [editing, setEditing] = useState();

  const flattenedData = useMemo(() => {
    if (!data) return []
    return  getFlattenedData(data)
  }, [JSON.stringify(data)])

  
  return (
    <>
      {flattenedData.map((item) => {
        const key = item.type === "halt" ? item.start_time : item.datetime
        return <Marker
          key={key}
          map={map}
          position={{ lat: item.lat, lng: item.lng }}
          onClick={() => {}}
        >
          <div
            className={`marker ${item.type} ${
              highlight === key || editing === key ? "highlight" : ""
            }`}
            style={{background: item.color}}
            onMouseEnter={() => setHighlight(key)}
            onMouseLeave={() => setHighlight("")}
          >
            {item.type ==="halt" ? item.id : null}
          </div>
        </Marker>
      })}
      {/* {Object.entries(data).map(([key, weather]) => (
        <Marker
          key={key}
          map={map}
          position={weather.position}
        >
          <div
            className={`marker ${weather.climate.toLowerCase()} ${
              highlight === key || editing === key ? "highlight" : ""
            }`}
            onMouseEnter={() => setHighlight(key)}
            onMouseLeave={() => setHighlight(null)}
          >
          </div>
        </Marker>
      ))} */}
    </>
  );
}

function Marker({ map, position, children, onClick }) {
  // @ts-ignore
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

    return () => {markerRef.current.map = null};
  }, []);

  useEffect(() => {
    rootRef.current.render(children);
    markerRef.current.position = position;
    markerRef.current.map = map;
    const listener = markerRef.current.addListener("click", onClick);
    return () => listener.remove();
  }, [map, position, children, onClick]);

  return <></>
}