import List from "@mui/material/List";
import SingleDetails from "./SingleDetails";
import { colors } from "./constants";
import { Cluster, Clusters } from "./types";
import { Typography } from "@mui/material";

type Props = {
  data: Clusters | null;
  setActiveCluster: (data: Cluster | null) => void;
};

export default function ListView({ data, setActiveCluster }: Props) {
  return (
    <List
      sx={{
        height: "100%",
        overflowY: "scroll",
        bgcolor: "background.paper",
        py: 0,
      }}
    >
      {data &&
        data.map((item, index) => (
          <SingleDetails
            color={colors[index]}
            label={item.address}
            startTime={item?.start_time}
            endTime={item?.end_time}
            id={index + 1}
            routes={item.route_to_next_cluster}
            setActiveCluster={setActiveCluster}
            cluster={item}
          />
        ))}

      {data && data.length === 0 ? (
        <Typography className="no-location">No locations tracked on this date</Typography>
      ) : null}
    </List>
  );
}
