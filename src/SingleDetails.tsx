import * as React from "react";

import { Cluster, RouteToNextCluster } from "./types";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

import Avatar from "@mui/material/Avatar";
import BasicTimeline from "./TimeLine";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import { formatDuration } from "./functionss";

type Props = {
  color: string;
  label: string;
  startTime: string;
  endTime: string;
  stoppageIndex?: number | string;
  routes: RouteToNextCluster[];
  setActiveCluster: (cluster: Cluster | null) => void;
  cluster: Cluster
}

export default function SingleDetails(props: Props) {
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    if (open) {
      props.setActiveCluster(null)
    }
    else {
      props.setActiveCluster(props.cluster)
    }
    setOpen(!open);
  };

  return (
    <>
      <ListItemButton onClick={handleClick}>
        <ListItemAvatar>
          {props.stoppageIndex && <Avatar sx={{ background: props.color }}>{props.stoppageIndex}</Avatar>}
        </ListItemAvatar>
        <ListItemText
          primary={props.label}
          secondary={
            <Stack direction="row">
              {formatDuration(props.startTime, props.endTime)}
            </Stack>
          }
        />
        {props.routes.length > 0 && (open ? <ExpandLess /> : <ExpandMore />)}
      </ListItemButton>

      {props.routes.length > 0 && <Collapse in={open} timeout="auto" unmountOnExit>
        <BasicTimeline routes={props.routes} color={props.color} />
      </Collapse>}
      <Divider />
    </>
  );
}
