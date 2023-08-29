import Divider from "@mui/material/Divider";
import DatePickerValue from "./DatePicker";
import { Dayjs } from "dayjs";

type Props = {
    date: Dayjs,
    setDate: (date: Dayjs) => void
};

export default function Header({date, setDate}: Props) {
  return (
    <>
      <div className="date-picker-container">
        <DatePickerValue date={date} setDate={setDate} />
      </div>
      <Divider />
    </>
  );
}
