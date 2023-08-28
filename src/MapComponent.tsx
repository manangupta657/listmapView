import { Wrapper } from "@googlemaps/react-wrapper";
import { useRef, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { colors } from "./constants";

const locationData = [
  {
      "lat": 24.6628731,
      "lng": 77.3348826,
      "address": "13right side me, Bhagat Singh Colony, Guna",
      "start_time": "2023-07-27 00:06:43",
      "end_time": "2023-07-27 10:48:39",
      "route_to_next_cluster": [
          {
              "datetime1": "2023-07-27 11:24:31",
              "lat": 24.6461873,
              "lng": 77.3207247,
              "address": "Adarsh Colony, Guna"
          },
          {
              "datetime1": "2023-07-27 11:35:14",
              "lat": 24.6502481,
              "lng": 77.3656405,
              "address": "Singwasa"
          }
      ]
  },
  {
      "lat": 24.654986,
      "lng": 77.4406739,
      "address": "SH-20, Guna Sub-District",
      "start_time": "2023-07-27 11:46:25",
      "end_time": "2023-07-27 11:56:03",
      "route_to_next_cluster": [
          {
              "datetime1": "2023-07-27 12:06:56",
              "lat": 24.6389458,
              "lng": 77.5474325,
              "address": "JGQX+FFH Rusty para park, Guna - Ashoknagar Rd, Rusalla Shadora"
          },
          {
              "datetime1": "2023-07-27 12:17:10",
              "lat": 24.6192693,
              "lng": 77.6090398,
              "address": "Shadhora"
          },
          {
              "datetime1": "2023-07-27 12:27:37",
              "lat": 24.5873012,
              "lng": 77.7167714,
              "address": "Ashoknagar"
          },
          {
              "datetime1": "2023-07-27 12:37:07",
              "lat": 24.588586,
              "lng": 77.7259137,
              "address": "Durga Colony, Ashoknagar"
          },
          {
              "datetime1": "2023-07-27 12:50:13",
              "lat": 24.557358,
              "lng": 77.7403192,
              "address": "Purana Bazar, Ashoknagar"
          },
          {
              "datetime1": "2023-07-27 13:02:28",
              "lat": 24.5793892,
              "lng": 77.7493209,
              "address": "Shankar Colony, Ashoknagar"
          },
          {
              "datetime1": "2023-07-27 13:12:29",
              "lat": 24.5703584,
              "lng": 77.8129616,
              "address": "Mungaoli - Ashoknagar Rd, Pipnawada"
          },
          {
              "datetime1": "2023-07-27 13:24:28",
              "lat": 24.543461399999998,
              "lng": 77.8819238,
              "address": "Govind Kheda"
          }
      ]
  },
  {
      "lat": 24.5165402,
      "lng": 77.9647636,
      "address": "Pipraigaon, Piprai",
      "start_time": "2023-07-27 13:34:44",
      "end_time": "2023-07-27 14:19:31",
      "route_to_next_cluster": []
  },
  {
      "lat": 24.506895,
      "lng": 77.9641517,
      "address": "Mungaoli - Ashoknagar Rd, Pipraigaon, Piprai",
      "start_time": "2023-07-27 14:29:00",
      "end_time": "2023-07-27 15:00:02",
      "route_to_next_cluster": [
          {
              "datetime1": "2023-07-27 15:10:42",
              "lat": 24.4838433,
              "lng": 78.00375,
              "address": "Mungaoli - Ashoknagar Rd, Shuklapuri"
          }
      ]
  },
  {
      "lat": 24.4056058,
      "lng": 78.1029077,
      "address": "Station Rd, Mungaoli",
      "start_time": "2023-07-27 15:51:53",
      "end_time": "2023-07-27 16:11:49",
      "route_to_next_cluster": [
          {
              "datetime1": "2023-07-27 16:22:44",
              "lat": 24.410697,
              "lng": 78.0856955,
              "address": "MP SH 19, Mungaoli"
          },
          {
              "datetime1": "2023-07-27 16:36:12",
              "lat": 24.3550601,
              "lng": 77.9793968,
              "address": "MP SH 19, Jhagar Bamuriya"
          }
      ]
  },
  {
      "lat": 24.3405847,
      "lng": 77.9645436,
      "address": "Ashoknagar - Bahadurpur Rd, Bahadurpur Gaon, Sumer",
      "start_time": "2023-07-27 16:45:45",
      "end_time": "2023-07-27 17:51:55",
      "route_to_next_cluster": [
          {
              "datetime1": "2023-07-27 18:02:43",
              "lat": 24.3161753,
              "lng": 77.9229945,
              "address": "Mungaoli"
          }
      ]
  },
  {
      "lat": 24.24892,
      "lng": 77.9483467,
      "address": "SH-19, Mungaoli",
      "start_time": "2023-07-27 18:13:37",
      "end_time": "2023-07-27 18:33:14",
      "route_to_next_cluster": [
          {
              "datetime1": "2023-07-27 18:46:01",
              "lat": 24.1550798,
              "lng": 77.9615511,
              "address": "NH 346, Parasari"
          }
      ]
  },
  {
      "lat": 24.1036581,
      "lng": 77.9660371,
      "address": "MP SH 19, Mehluwa",
      "start_time": "2023-07-27 18:59:55",
      "end_time": "2023-07-27 19:12:08",
      "route_to_next_cluster": [
          {
              "datetime1": "2023-07-27 19:21:46",
              "lat": 24.1034998,
              "lng": 77.8926394,
              "address": "MP SH 14, Sona"
          },
          {
              "datetime1": "2023-07-27 19:31:39",
              "lat": 24.1158383,
              "lng": 77.8188817,
              "address": "MP SH 14, Pathriya"
          },
          {
              "datetime1": "2023-07-27 19:43:43",
              "lat": 24.0965637,
              "lng": 77.7292916,
              "address": "Unnamed Road, Ahir Khedi"
          }
      ]
  },
  {
      "lat": 24.105894,
      "lng": 77.7271453,
      "address": "MP SH 14",
      "start_time": "2023-07-27 19:53:18",
      "end_time": "2023-07-27 20:25:04",
      "route_to_next_cluster": []
  }
]
type FlattenedData = {
  lat: number;
  lng: number;
  address: string;
  color: string;
} & ({
  type: "halt",
  start_time: string;
  end_time: string;
  id: number
} | {
  type: "route",
  datetime: string;
}
)


const flattenedData: FlattenedData[] = locationData.reduce((accumulator, currentLocation, index) => {
  const flatRouteData: FlattenedData[] = currentLocation.route_to_next_cluster.map(
    (step) => ({
      lat: step.lat,
      lng: step.lng,
      address: step.address,
      type: "route",
      color: colors[index],
      datetime: step.datetime1,
    })
  );

  const flatHalt: FlattenedData = {
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      address: currentLocation.address,
      type: "halt",
      color: colors[index],
      start_time: currentLocation.start_time,
      end_time: currentLocation.end_time,
      id: index + 1
  }
      

  return [...accumulator, flatHalt, ...flatRouteData]
}, []);

console.log(flattenedData);


export default function App() {
  return (
    <Wrapper
      apiKey={"AIzaSyCf2_txZACzBqNY99vHR1YWdbExpCuQ_Lg"}
      version="beta"
      libraries={["marker"]}
    >
      <MyMap />
    </Wrapper>
  );
}

const mapOptions = {
  mapId: "DEMO_MAP_ID",
  center: { lat: 24.6628595, lng: 77.3348837 },
  zoom: 15,
  disableDefaultUI: true,
};

function MyMap() {
  const [map, setMap] = useState();
  const ref = useRef();

  useEffect(() => {
    setMap(new window.google.maps.Map(ref.current, mapOptions));
  }, []);

  return (
    <>
      <div ref={ref} id="map" />
      {map && <Weather map={map} />}
    </>
  );
}


function Weather({ map }) {
  const [highlight, setHighlight] = useState("");
  const [editing, setEditing] = useState();

  return (
    <>
      {flattenedData.map((item, index) => {
        const key = item.type === "halt" ? item.start_time : item.datetime
        return <Marker
          key={key}
          map={map}
          position={{ lat: item.lat, lng: item.lng }}
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

    return () => (markerRef.current.map = null);
  }, []);

  useEffect(() => {
    rootRef.current.render(children);
    markerRef.current.position = position;
    markerRef.current.map = map;
    const listener = markerRef.current.addListener("click", onClick);
    return () => listener.remove();
  }, [map, position, children, onClick]);
}