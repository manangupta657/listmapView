import { Cluster, Clusters } from "./types";
import {
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Skeleton,
  Typography,
} from "@mui/material";

import List from "@mui/material/List";
import SingleDetails from "./SingleDetails";
import { colors } from "./constants";
import { useEffect } from "react";

type Props = {
  data: Clusters | null;
  setActiveCluster: (data: Cluster | null) => void;
};

export default function ListView({ data, setActiveCluster }: Props) {
  useEffect(() => {
    if (data) {
      for (let i = 1; i < data?.length - 1; i++) {
        const lastStoppage = {
          lat: data[i - 1].lat,
          lng: data[i - 1].lng,
          address: data[i - 1].address,
          datetime1: data[i - 1].end_time,
        };
        const nextStoppage = {
          lat: data[i + 1].lat,
          lng: data[i + 1].lng,
          address: data[i + 1].address,
          datetime1: data[i + 1].start_time,
        };
        if (data[i].route_to_next_cluster.length) {
          if (
            data[i].route_to_next_cluster[0].lat != lastStoppage.lat ||
            data[i].route_to_next_cluster[0].lng != lastStoppage.lng
          )
            data[i].route_to_next_cluster.splice(0, 0, lastStoppage);
          if (
            data[i].route_to_next_cluster[
              data[i].route_to_next_cluster.length - 1
            ].lat != nextStoppage.lat ||
            data[i].route_to_next_cluster[
              data[i].route_to_next_cluster.length - 1
            ].lng != nextStoppage.lng
          )
            data[i].route_to_next_cluster.push(nextStoppage);
        }
      }
    }
  }, [data]);
  return (
    <List
      sx={{
        height: "100%",
        overflowY: "scroll",
        bgcolor: "background.paper",
        py: 0,
      }}
    >
      {data ? (
        data.map((item, index) => {
          return (
            <SingleDetails
              key={index}
              color={colors[index]}
              label={item.address}
              startTime={item?.start_time}
              endTime={item?.end_time}
              stoppageIndex={item.stoppageIndex}
              routes={item.route_to_next_cluster}
              setActiveCluster={setActiveCluster}
              cluster={item}
            />
          );
        })
      ) : (
        <>
          <SkeletonLoading />
          <SkeletonLoading />
          <SkeletonLoading />
          <SkeletonLoading />
          <SkeletonLoading />
        </>
      )}

      {data && data.length === 0 ? (
        <Typography className="no-location">
          No locations tracked on this date
        </Typography>
      ) : null}
    </List>
  );
}

export function SkeletonLoading() {
  return (
    <ListItemButton>
      <ListItemAvatar>
        <Skeleton animation="wave" variant="circular" width={40} height={40} />
      </ListItemAvatar>
      <ListItemText
        primary={<Skeleton animation="wave" width="80%" height={24} />}
        secondary={<Skeleton animation="wave" height={16} width="60%" />}
      />
    </ListItemButton>
  );
}
