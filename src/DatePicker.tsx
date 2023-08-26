import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { ArrowLeftIcon, ArrowRightIcon } from "@mui/x-date-pickers";
import { IconButton, Stack } from "@mui/material";

export default function DatePickerValue() {
  const [value, setValue] = React.useState<Dayjs | null>(dayjs());

  return (
    <Stack direction="row" spacing={1} alignItems={"center"} >
      <IconButton size="small" onClick={() => setValue(dayjs(value).subtract(1, 'day'))}>
        <ArrowLeftIcon />
      </IconButton>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Select Date"
            value={value}
            onChange={(newValue) => setValue(newValue)}
            slotProps={{ textField: { size: "small" } }}
            format="DD/MM/YYYY"
          />
      </LocalizationProvider>
      <IconButton size="small" onClick={() => setValue(dayjs(value).add(1, 'day'))}>
        <ArrowRightIcon />
      </IconButton>
    </Stack>
  );
}
