import Divider from "@mui/material/Divider";
import DatePickerValue from "./DatePicker";
import { Dayjs } from "dayjs";
import { IconButton } from "@mui/material";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
type Props = {
  date: Dayjs;
  setDate: (date: Dayjs) => void;
  listMode: boolean;
  setListMode: (mode: boolean) => void;
};

export default function Header({ date, setDate, listMode, setListMode }: Props) {
  return (
    <>
      <div className="date-picker-container">
        <DatePickerValue date={date} setDate={setDate} />
        <div className="switch-button">
          <IconButton size="medium" onClick={()=>{ setListMode(!listMode)}}>
          {listMode ? <MapOutlinedIcon sx={{ fontSize: "35px" }} /> : <FormatListBulletedOutlinedIcon sx={{ fontSize: "35px" }}/>}
          </IconButton>
        </div>
      </div>
      <Divider />
    </>
  );
}
