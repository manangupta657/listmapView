import Grid from "@mui/material/Grid";
import "./App.css";
import ListView from "./ListView";
import { useEffect, useState } from "react";
import { Clusters } from "./types";
import { getClusters } from "./functionss";
import dayjs, { Dayjs } from "dayjs";
import GoogleMaps from "./MapComponent";
import Header from "./Header";

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const dateParams = urlParams.get('date');
  const [clusters, setClusters] = useState<Clusters | null>(null);
  const [startDate, setStartDate] = useState<Dayjs>(dayjs(dateParams || undefined));
  const formattedDate = dayjs(startDate).format("YYYY-MM-DD");

  useEffect(() => {
    async function getData(){
      const data = await getClusters(formattedDate, urlParams);
      setClusters(data)
    }
    getData()
  }, [formattedDate])
  
  return (
    <>
      <Grid container>
        <Grid item xs={12} md={3.5}>
          <div className="left-side">
            <Header setDate={setStartDate} date={startDate}/>
            <ListView data={clusters}/>
          </div>
        </Grid>
        <Grid item xs={12} md={8.5}>
          <div className="right-side">
            <div className="map-image">
              <GoogleMaps data={clusters}/>
            </div>
          </div>
        </Grid>
      </Grid>
    </>
  );
}

export default App;
