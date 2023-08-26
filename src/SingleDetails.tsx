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

export default function SingleDetails(props: any) {
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
          primary={props.primary}
          secondary={
            <Stack direction="row">
              {props.secondary}
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
