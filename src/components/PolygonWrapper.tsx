import { PolyLineV2 } from "./PolygonV2";

const PolyLineComponent = ({ polyLinesData, map }:any) => {
    const queryParams = new URLSearchParams(window.location.search);
    const isV2 = queryParams.get("version") === "v2";
  
    return isV2 ? (
      <PolyLineV2 apiKey={"AIzaSyCXmuZgrN0tJsciGtndwNGsBDT5lISv3bM"} data={polyLinesData} map={map} />
    ) : (

      <></>
      // <PolyLine data={polyLinesData} map={map} />
    );
  };
  
  export default PolyLineComponent;
  