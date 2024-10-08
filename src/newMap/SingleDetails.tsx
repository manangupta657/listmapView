import * as React from "react";

import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import { NewCluster } from "./helper";
import dayjs from "dayjs";
import { Chip, IconButton, Typography } from "@mui/material";
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import ImageDialog from "./profile-picture-dialog";

type Cluster = NewCluster;


export function formatDurationNew(start_time: string) {
  const date1 = dayjs(start_time).format("hh:mm a");
  return `${date1}`
}

type Props = {
  color: string;
  label: string;
  startTime: string;
  id: number;
  setActiveCluster: (cluster: Cluster | null) => void;
  cluster: Cluster
}

export default function SingleDetails(props: Props) {
  const [open, setOpen] = React.useState(false);
  const [openDialog, setDialog] = React.useState(false);

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
          <Avatar sx={{ background: props.color }}>{props.id}</Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={<Stack direction={"row"} alignItems={'center'} gap={"1rem"}>
            <p>{props.label}</p>
            {props.cluster.image &&
              <IconButton onClick={(e) => { e.stopPropagation(); setDialog(true) }}>
                <ImageRoundedIcon sx={{ color: props.cluster.color }} />
              </IconButton>
            }
          </Stack>}
          secondary={
            <Stack>
              <Stack direction="row" alignItems={'center'} gap={"1rem"}>
                {formatDurationNew(props.startTime)}
                <Chip sx={{ fontSize: '12px', fontWeight: "bold", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }} label={props.cluster.label || ""} />
              </Stack>
              {props.cluster.comment ? <Typography sx={{ fontSize: '12px', fontWeight: 'bold' }}>{props.cluster.comment}</Typography> : <></>}
            </Stack>
          }
        />
      </ListItemButton>
      <Divider />

      {openDialog ?
        <ImageDialog
          isOpen={openDialog}
          handleClose={() => setDialog(false)}
          image={props.cluster.image}
        /> : <></>
      }

    </>
  );
}
