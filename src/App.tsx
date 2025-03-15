import "./App.css";

import { Cluster, Clusters } from "./types";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import GoogleMaps from "./MapComponent";
import Grid from "@mui/material/Grid";
import Header from "./Header";
import ListView from "./ListView";
import { getClusters } from "./functionss";
import { transformClusterData } from "./utils/transform";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const dateParams = urlParams.get("date");
  const viewParam = urlParams.get("view");
  const [clusters, setClusters] = useState<Clusters | null>(null);
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
      const response = await getClusters(formattedDate, urlParams);
      setInProgress(false);
      setClusters(transformClusterData(response?.response?.data));
      setName(response?.msg);
    }
    getData();
  }, [formattedDate]);

  useEffect(() => {
    document.title = `Locations: ${name} - ${
      startDate ? startDate.format("DD/MM/YYYY") : ""
    }`;
  }, [name, startDate.format("DD/MM/YYYY")]);

  const mapEl = (
    <GoogleMaps
      apiInProgress={apiInProgress}
      data={clusters}
      activeCluster={activeCluster}
      showOnlyStoppages={showOnlyStoppages}
    />
  );
  return (
    <>
      <Grid container>
        <Grid item xs={12} sm={3.5}>
          <div className="left-side">
            <Header
              setDate={setStartDate}
              date={startDate}
              listMode={listMode}
              setListMode={setListMode}
              name={name}
              setShowOnlyStoppages={setShowOnlyStoppages}
              showOnlyStoppages={showOnlyStoppages}
            />
            {matches || listMode ? (
              <ListView data={clusters} setActiveCluster={setActiveCluster} />
            ) : (
              mapEl
            )}
          </div>
        </Grid>

        {matches ? (
          <Grid item xs={12} sm={8.5}>
            <div className="right-side">{mapEl}</div>
          </Grid>
        ) : null}
      </Grid>
    </>
  );
}

export default App;
