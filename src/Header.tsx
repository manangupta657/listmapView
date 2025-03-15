import Divider from "@mui/material/Divider";
import DatePickerValue from "./DatePicker";
import { Dayjs } from "dayjs";
import { Button, IconButton, Switch, Typography } from "@mui/material";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
type Props = {
  date: Dayjs;
  setDate: (date: Dayjs) => void;
  listMode: boolean;
  setListMode: (mode: boolean) => void;
  name: string;
  showOnlyStoppages: boolean;
  setShowOnlyStoppages: (showOnlyStoppages: boolean) => void;
};

export default function Header({
  date,
  setDate,
  listMode,
  setListMode,
  name,
  showOnlyStoppages,
  setShowOnlyStoppages,
}: Props) {
  return (
    <>
      <div className="date-picker-container">
        <DatePickerValue date={date} setDate={setDate} name={name} />
        <div className="switch-button">
          <IconButton
            size="medium"
            onClick={() => {
              setListMode(!listMode);
            }}
          >
            {listMode ? (
              <MapOutlinedIcon sx={{ fontSize: "35px" }} />
            ) : (
              <FormatListBulletedOutlinedIcon sx={{ fontSize: "35px" }} />
            )}
          </IconButton>
        </div>
      </div>
      <Divider />
      <Button
        variant="text"
        onClick={() => setShowOnlyStoppages(!showOnlyStoppages)}
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Typography>Show only stoppages</Typography>
        <Switch
          checked={showOnlyStoppages}
          onChange={() => setShowOnlyStoppages(!showOnlyStoppages)}
        />
      </Button>
      <Divider />
    </>
  );
}
