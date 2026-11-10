import { IconButton, Switch, Tooltip } from "@mui/material";

import DatePickerValue from "./DatePicker";
import { Dayjs } from "dayjs";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";

type Props = {
  date: Dayjs;
  setDate: (date: Dayjs) => void;
  listMode: boolean;
  setListMode: (mode: boolean) => void;
  name: string;
  showOnlyStoppages: boolean;
  setShowOnlyStoppages: (showOnlyStoppages: boolean) => void;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

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
    <header className="topbar">
      <div className="topbar-brand">
        <svg className="brand-mark" width="30" height="30" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 0.6 15.8 8.4H0.2Z" fill="#234C87" />
          <path d="M0.6 9.2H7.4V15.4Z" fill="#F4D700" />
          <path d="M8.6 9.2H15.4L8.6 15.4Z" fill="#F4D700" />
        </svg>
        <span className="brand-name">Simplifii</span>
        <span className="topbar-divider" />
        <span className="topbar-title">Location tracking</span>
      </div>

      <div className="topbar-actions">
        {name ? (
          <span className="person-chip" title={name}>
            <span className="person-avatar">{initials(name) || "?"}</span>
            <span className="person-name">{name}</span>
          </span>
        ) : null}

        <DatePickerValue date={date} setDate={setDate} name="" />

        <label className="pill-toggle">
          <span>Only stops</span>
          <Switch
            size="small"
            checked={showOnlyStoppages}
            onChange={() => setShowOnlyStoppages(!showOnlyStoppages)}
            inputProps={{ "aria-label": "Show only stops" }}
          />
        </label>

        <Tooltip title={listMode ? "Show map" : "Show timeline"}>
          <IconButton
            className="switch-button"
            onClick={() => setListMode(!listMode)}
            aria-label={listMode ? "Show map" : "Show timeline"}
          >
            {listMode ? <MapOutlinedIcon /> : <FormatListBulletedOutlinedIcon />}
          </IconButton>
        </Tooltip>
      </div>
    </header>
  );
}
