import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineOppositeContent, {
  timelineOppositeContentClasses,
} from "@mui/lab/TimelineOppositeContent";
import { formatDate } from "./functionss";

export default function LeftAlignedTimeline(props: any) {
  return (
    <Timeline
      sx={{
        [`& .${timelineOppositeContentClasses.root}`]: {
          flex: 0.1,
        },
      }}
    >
      {props.routes.map((item: any, index: number) => {
        return (
          <TimelineItem>
            <TimelineOppositeContent color="textSecondary">
              {formatDate(item.time)}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot sx={{ backgroundColor: props.color }} />
              {index !== props.routes.length - 1 ? <TimelineConnector /> : null}
            </TimelineSeparator>

            <TimelineContent>{item.address}</TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
