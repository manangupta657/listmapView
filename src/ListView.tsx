import { Cluster, Clusters } from "./types";

import List from "@mui/material/List";
import SingleDetails from "./SingleDetails";
import { ListItemAvatar, ListItemButton, ListItemText, Skeleton, Typography } from "@mui/material";
import { colors } from "./constants";

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
      {
        data ?  data.map((item, index) => (
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
        )) : <>
        <SkeletonLoading/>
        <SkeletonLoading/>
        <SkeletonLoading/>
        <SkeletonLoading/>
        <SkeletonLoading/>
      </>
      }

      {data && data.length === 0 ? (
        <Typography className="no-location">No locations tracked on this date</Typography>
      ) : null}
    </List>
  );
}

export function SkeletonLoading(){
  return  <ListItemButton >
    <ListItemAvatar>
      <Skeleton animation="wave" variant="circular" width={40} height={40} />
    </ListItemAvatar>
    <ListItemText
      primary={ <Skeleton
        animation="wave"
        width="80%"
        height={24}
 
      />}
      secondary={
        <Skeleton
        animation="wave"
        height={16}
        width="60%"
      />
      }
    />
    
  </ListItemButton>
}