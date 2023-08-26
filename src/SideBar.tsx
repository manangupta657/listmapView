import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import SingleDetails from "./SingleDetails";
import { colors } from "./constants";
import DatePickerValue from "./DatePicker";
import { clusters } from "./constants";
import { formatDate } from "./functionss";

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
          secondary={`${formatDate(item?.start_time)} - ${formatDate(item?.end_time)}`}
          id={index + 1}
          routes = {item.route_to_next_cluster}
        />
      ))}
    </List>
  );
}
