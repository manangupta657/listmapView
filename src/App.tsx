import "./App.css";

import { Cluster, Clusters } from "./types";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";

import GoogleMaps from "./MapComponent";
import Header from "./Header";
import ListView from "./ListView";
import { PlaybackProvider } from "./playback/PlaybackContext";
import { cleanDay } from "./utils/cleanup";
import { getClusters } from "./functionss";
import { transformClusterData } from "./utils/transform";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const dateParams = urlParams.get("date");
  const viewParam = urlParams.get("view");
  const [rawData, setRawData] = useState<Clusters | null>(null);
  const [cleanGps, setCleanGps] = useState(urlParams.get("raw") !== "1");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Dayjs>(
    dayjs(dateParams || undefined),
  );
  const formattedDate = dayjs(startDate).format("YYYY-MM-DD");
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up("sm"));
  const [listMode, setListMode] = useState(viewParam === "map" ? false : true);
  const [activeCluster, setActiveCluster] = useState<Cluster | null>(null);
  const [apiInProgress, setInProgress] = useState<boolean>(false);
  const [showOnlyStoppages, setShowOnlyStoppages] = useState<boolean>(false);

  useEffect(() => {
    async function getData() {
      setInProgress(true);
      setActiveCluster(null);
      const response = await getClusters(formattedDate, urlParams);
      setInProgress(false);
      setRawData(response?.response?.data ?? []);
      setName(response?.msg ?? "");
    }
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formattedDate]);

  useEffect(() => {
    document.title = `Locations: ${name} - ${
      startDate ? startDate.format("DD/MM/YYYY") : ""
    }`;
  }, [name, startDate]);

  // Raw API data stays untouched; each view works on its own copy
  const { clusters, cleanup } = useMemo(() => {
    if (!rawData) return { clusters: null, cleanup: null };
    const copy: Clusters = structuredClone(rawData);
    if (!cleanGps) return { clusters: transformClusterData(copy), cleanup: null };
    const result = cleanDay(copy);
    return {
      clusters: transformClusterData(result.clusters, { clean: true }),
      cleanup: result.stats,
    };
  }, [rawData, cleanGps]);

  const toggleCleanGps = () => {
    setActiveCluster(null);
    setCleanGps((v) => !v);
  };

  const showList = matches || listMode;
  const showMap = matches || !listMode;

  return (
    <PlaybackProvider data={clusters}>
      <div className="app-shell">
        <Header
          setDate={setStartDate}
          date={startDate}
          listMode={listMode}
          setListMode={setListMode}
          name={name}
          setShowOnlyStoppages={setShowOnlyStoppages}
          showOnlyStoppages={showOnlyStoppages}
        />
        <div className="app-body">
          {showList ? (
            <aside className="sidebar">
              <ListView
                data={clusters}
                activeCluster={activeCluster}
                setActiveCluster={setActiveCluster}
                showOnlyStoppages={showOnlyStoppages}
                cleanGps={cleanGps}
                onToggleCleanGps={toggleCleanGps}
                cleanup={cleanup}
              />
            </aside>
          ) : null}
          {showMap ? (
            <main className="map-pane">
              <GoogleMaps
                apiInProgress={apiInProgress}
                data={clusters}
                activeCluster={activeCluster}
                showOnlyStoppages={showOnlyStoppages}
              />
            </main>
          ) : null}
        </div>
      </div>
    </PlaybackProvider>
  );
}

export default App;
