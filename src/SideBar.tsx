import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import SingleDetails from "./SingleDetails";
import { colors } from "./constants";
import DatePickerValue from "./DatePicker";
import { clusters } from "./constants";

export default function FolderList() {
  return (
    <List sx={{ width: "100%", height: "100vh", bgcolor: "background.paper" }}>
      <div className="date-picker-container">
        <DatePickerValue />
      </div>
      <Divider />
      {clusters.map((item, index) => (
        <SingleDetails
          color={colors[index]}
          primary={item.address}
          secondary={`item.start_time - item.end_time`}
          id={1}
        />
      ))}
      <SingleDetails
        color={colors[0]}
        primary="13right side me, Bhagat Singh Colony, Guna"
        secondary="06:43 - 07:45"
        id={1}
      />
      <SingleDetails
        color={colors[1]}
        primary="Kamlapur Rd, Kamlapur, Pagara"
        secondary="12:46 - 12:58"
        id={2}
      />
      <SingleDetails
        color={colors[2]}
        primary="Amkheda Nai Saray"
        secondary="16:11 -	16:57"
        id={3}
      />
    </List>
  );
}
