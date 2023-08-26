import Grid from "@mui/material/Grid";
import "./App.css";
import VerticalTabs from "./SideBar";

function App() {
  return (
    <>
      <Grid container>
        <Grid xs={3.5}>
          <VerticalTabs />
        </Grid>
        <Grid xs={8.5}>
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
