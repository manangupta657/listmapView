import "../App.css";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { Grid } from "@mui/material";
import Header from "../Header";
import GoogleMapsNew from "./newMap";
import { getClusters, NewCluster, transformClusterData } from "./helper";
import ListView from "./listView";

type Clusters = NewCluster[];
type Cluster = NewCluster;

function NewMap() {
  const urlParams = new URLSearchParams(window.location.search);
  const dateParams = urlParams.get("date");
  const [clusters, setClusters] = useState<Clusters | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Dayjs>(
    dayjs(dateParams || undefined)
  );
  const formattedDate = dayjs(startDate).format("YYYY-MM-DD");
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up("sm"));
  const [listMode, setListMode] = useState(true);
  const [activeCluster, setActiveCluster] = useState<Cluster | null>(null)
  const [apiInProgress, setInProgress] = useState<boolean>(false)
  

  useEffect(() => {
    async function getData() {
      setInProgress(true)
      const response = await getClusters(formattedDate, urlParams);
      setInProgress(false)
      setClusters(transformClusterData(response?.response?.data));
      setName(response?.msg);
    }
    getData();
  }, [formattedDate]);

  useEffect(() => {
    document.title = `Locations: ${name} - ${startDate ? startDate.format("DD/MM/YYYY") : ""}`
  }, [name, startDate.format("DD/MM/YYYY")])
  return (
    <>
      <Grid container>
          <Grid item xs={12} sm={3.5}>
            <div className="left-side">
              <Header setDate={setStartDate} date={startDate} listMode={listMode} setListMode={setListMode} name={name}/>
              {( matches || listMode ) ? ( <ListView data={clusters} setActiveCluster={setActiveCluster}/> ) : (<GoogleMapsNew apiInProgress={apiInProgress} data={clusters} activeCluster={activeCluster}/>)}
            </div>
          </Grid>
        
        {matches ? (
          <Grid item xs={12} sm={8.5}>
            <div className="right-side">
              <GoogleMapsNew apiInProgress={apiInProgress} data={clusters} activeCluster={activeCluster} />
            </div>
          </Grid>
        ) : null}
      </Grid>
    </>
  );
}

export default NewMap;
