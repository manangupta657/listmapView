import "../App.css";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import Header from "../Header";
import GoogleMapsNew from "./newMap";
import { getClusters, NewCluster, transformClusterData } from "./helper";
import ListView from "./listView";
import AutoIcon from "./autoIcon";
import { useIsMobile } from "./profile-picture-dialog/dialog";

type Clusters = NewCluster[];
type Cluster = NewCluster;

function NewMap() {
  const urlParams = new URLSearchParams(window.location.search);
  const nameParam = urlParams.get("name");
  const dateParams = urlParams.get("date");
  const [clusters, setClusters] = useState<Clusters | null>(null);
  const [name, setName] = useState(nameParam);
  const [startDate, setStartDate] = useState<Dayjs>(
    dayjs(dateParams || undefined)
  );
  const formattedDate = dayjs(startDate).format("YYYY-MM-DD");
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up("sm"));
  const [listMode, setListMode] = useState(true);
  const [activeCluster, setActiveCluster] = useState<Cluster | null>(null)
  const [apiInProgress, setInProgress] = useState<boolean>(false)
  const [showAuto,setShowAuto] = useState(true)
  const isMobile = useIsMobile();  

  useEffect(() => {
    async function getData() {
      setInProgress(true)
      const response = await getClusters(formattedDate, urlParams);
      setInProgress(false)
      setClusters(transformClusterData(response?.response?.data));
      setName(nameParam);
    }
    getData();
  }, [formattedDate]);

  useEffect(() => {
    document.title = `Locations: ${name} - ${startDate ? startDate.format("DD/MM/YYYY") : ""}`
  }, [name, startDate.format("DD/MM/YYYY")])

  const filteredCluster = clusters ? !showAuto ? clusters.filter(d => !d.automatic_tracking) : clusters : null; 

  return (
    <>
      <Grid container sx={{position: "relative"}}>
          <Grid item xs={12} sm={3.5}>
            <div className="left-side">
              <Header setShowAuto={setShowAuto} showAuto={showAuto} setDate={setStartDate} date={startDate} listMode={listMode} setListMode={setListMode} name={name || ''} />
              {( matches || listMode ) ? ( <ListView data={filteredCluster} setActiveCluster={setActiveCluster}/> ) : (<GoogleMapsNew apiInProgress={apiInProgress} data={filteredCluster} activeCluster={activeCluster}/>)}
            </div>
          </Grid>
        
        {matches ? (
          <Grid item xs={12} sm={8.5}>
            <div className="right-side">
              <GoogleMapsNew apiInProgress={apiInProgress} data={filteredCluster} activeCluster={activeCluster} />
            </div>
          </Grid>
        ) : null}
      </Grid>

      {!isMobile &&
         <AutoIcon 
            sx={{
              position: 'absolute',
              right: "10px",
              bottom: "500px"
            }} 
            showAuto={showAuto}
            setShowAuto={setShowAuto}
          />
      }
    </>
  );
}

export default NewMap;
