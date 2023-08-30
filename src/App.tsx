import Grid from "@mui/material/Grid";
import "./App.css";
import ListView from "./ListView";
import { useEffect, useState } from "react";
import { Cluster, Clusters } from "./types";
import { getClusters } from "./functionss";
import dayjs, { Dayjs } from "dayjs";
import GoogleMaps from "./MapComponent";
import Header from "./Header";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const dateParams = urlParams.get("date");
  const viewParam = urlParams.get("view");
  const [clusters, setClusters] = useState<Clusters | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Dayjs>(
    dayjs(dateParams || undefined)
  );
  const formattedDate = dayjs(startDate).format("YYYY-MM-DD");
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up("sm"));
  const [listMode, setListMode] = useState(viewParam === "map" ? false : true);
  const [activeCluster, setActiveCluster] = useState<Cluster | null>(null)

  useEffect(() => {
    async function getData() {
      const response = await getClusters(formattedDate, urlParams);
      setClusters(response?.response?.data);
      setName(response?.msg);
      console.log(response)
    }
    getData();
  }, [formattedDate]);
  return (
    <>
      <Grid container>
        
          <Grid item xs={12} sm={3.5}>
            <div className="left-side">
              <Header setDate={setStartDate} date={startDate} listMode={listMode} setListMode={setListMode} name={name}/>
              {( matches || listMode ) ? ( <ListView data={clusters} setActiveCluster={setActiveCluster}/> ) : (<GoogleMaps data={clusters} activeCluster={activeCluster}/>)}
            </div>
          </Grid>
        
        {matches ? (
          <Grid item xs={12} sm={8.5}>
            <div className="right-side">
              <GoogleMaps data={clusters} activeCluster={activeCluster} />
            </div>
          </Grid>
        ) : null}
      </Grid>
    </>
  );
}

export default App;
