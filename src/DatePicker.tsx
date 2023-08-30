import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { ArrowLeftIcon, ArrowRightIcon } from "@mui/x-date-pickers";
import { IconButton, Stack } from "@mui/material";

export default function DatePickerValue({date, setDate, name}: any) {

  return (
    <Stack direction="row" spacing={1} alignItems={"center"} >
      <IconButton size="small" onClick={() => setDate(dayjs(date).subtract(1, 'day'))}>
        <ArrowLeftIcon />
      </IconButton>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={name || undefined}
            value={date}
            onChange={(newValue) => setDate(newValue)}
            slotProps={{ textField: { size: "small" } }}
            format="DD/MM/YYYY"
          />
      </LocalizationProvider>
      <IconButton size="small" onClick={() => setDate(dayjs(date).add(1, 'day'))}>
        <ArrowRightIcon />
      </IconButton>
    </Stack>
  );
}
