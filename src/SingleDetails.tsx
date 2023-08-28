import * as React from "react";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Collapse from "@mui/material/Collapse";
import ListItemButton from "@mui/material/ListItemButton";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import BasicTimeline from "./TimeLine";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import { RouteToNextCluster } from "./types";
import { formatDate } from "./functionss";

type Props = {
  color: string;
  label: string;
  startTime: string;
  endTime: string;
  id: number;
  routes: RouteToNextCluster[]
}

export default function SingleDetails(props: Props) {
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <>
      <ListItemButton onClick={handleClick}>
        <ListItemAvatar>
          <Avatar sx={{ background: props.color }}>{props.id}</Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={props.label}
          secondary={
            <Stack direction="row">
              {`${formatDate(props.startTime)} - ${formatDate(props.endTime)}`}
            </Stack>
          }
        />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <BasicTimeline routes={props.routes} color={props.color} />
      </Collapse>
      <Divider />
    </>
  );
}
