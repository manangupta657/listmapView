import List from "@mui/material/List";
import SingleDetails from "./SingleDetails";
import { colors } from "./constants";
import { Clusters } from "./types";

type Props = {
  data: Clusters | null,
}

export default function ListView({data}: Props) {
  return (
    <List sx={{ height: "100%", overflowY:"scroll" , bgcolor: "background.paper", py: 0 }}>
      {data && data.map((item, index) => (
        <SingleDetails
          color={colors[index]}
          label={item.address}
          startTime={item?.start_time}
          endTime={item?.end_time}
          id={index + 1}
          routes = {item.route_to_next_cluster}
        />
      ))}
    </List>
  );
}
