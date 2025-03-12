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
import { RouteToNextCluster } from "./types";

type Props = {
  routes: RouteToNextCluster[];
  color: string;
};

export default function LeftAlignedTimeline(props: Props) {
  return (
    <Timeline
      sx={{
        [`& .${timelineOppositeContentClasses.root}`]: {
          flex: 0.3,
        },
      }}
    >
      {props.routes.map((item, index: number) => {
        return (
          <TimelineItem key={index}>
            <TimelineOppositeContent color="textSecondary">
              {formatDate(item.datetime1)}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot sx={{ backgroundColor: props.color }} />
              {index !== props.routes.length - 1 ? (
                <TimelineConnector sx={{ height: "10px" }} />
              ) : null}
            </TimelineSeparator>

            <TimelineContent>{item.address}</TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
