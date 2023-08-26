import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import SingleDetails from "./SingleDetails";
import { colors } from "./constants";
import DatePickerValue from "./DatePicker";
import { Clusters } from "./types";
import { Dayjs } from "dayjs";

type Props = {
  data: Clusters | null,
  date: Dayjs,
  setDate: (date: Dayjs) => void
}
export default function ListView({data, date, setDate}: Props) {
  return (
    <List sx={{ width: "100%", height: "100vh",overflowY:"scroll" , bgcolor: "background.paper" }}>
      <div className="date-picker-container">
        <DatePickerValue date={date} setDate={setDate} />
      </div>
      <Divider />
      {data && data.map((item, index) => (
        <SingleDetails
          color={colors[index]}
          label={item.address}
          startTime={item?.start_time}
          endTime={item?.end_time}
          id={index + 1}
          routes = {item.route_to_next_cluster}
        />
      ))}
    </List>
  );
}
