import Divider from "@mui/material/Divider";
import DatePickerValue from "./DatePicker";
import { Dayjs } from "dayjs";
import { IconButton } from "@mui/material";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import { useIsMobile } from "./newMap/profile-picture-dialog/dialog";
import AutoIcon from "./newMap/autoIcon";
import { Dispatch, SetStateAction } from "react";
type Props = {
  date: Dayjs;
  setDate: (date: Dayjs) => void;
  listMode: boolean;
  setListMode: (mode: boolean) => void;
  name: string;
  showAuto: boolean;
  setShowAuto: Dispatch<SetStateAction<boolean>>
};

export default function Header({ date, setDate, listMode, setListMode, name, setShowAuto, showAuto }: Props) {
  const isMobile = useIsMobile();


  return (
    <>
      <div className="date-picker-container">
        <DatePickerValue date={date} setDate={setDate} name={name}/>

        {isMobile &&
            <AutoIcon showAuto={showAuto} setShowAuto={setShowAuto} />
         }
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
