import Grid from "@mui/material/Grid";
import "./App.css";
import ListView from "./ListView";
import { useEffect, useState } from "react";
import { Clusters } from "./types";
import { getClusters } from "./functionss";
import dayjs, { Dayjs } from "dayjs";

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
        <Grid item xs={3.5}>
          <ListView data={clusters} date={startDate} setDate={setStartDate}/>
        </Grid>
        <Grid item xs={8.5}>
          <div className="container">
            <div className="map-image">
              <img src="https://i.stack.imgur.com/HILmr.png" />
            </div>
          </div>
        </Grid>
      </Grid>
    </>
  );
}

export default App;
