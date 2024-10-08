import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import { SxProps, Theme, useMediaQuery, useTheme } from "@mui/material";

type props = {
  isOpen: boolean;
  handleClose: any;
  title: any;
  children: any;
  dialogSx?: SxProps<Theme> | undefined,
  contentSx?: SxProps<Theme> | undefined,
  titleSx?: SxProps<Theme> | undefined,
  TitleEl?: JSX.Element;
  isFullScreen?: boolean;
};

export function useIsMobile() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return isMobile;
}

const DialogModal = ({ isOpen, handleClose, title, children, dialogSx = {}, contentSx = {}, titleSx = {}, TitleEl = <></>, isFullScreen = false }: props) => {
  const isMobile = useIsMobile();
  return (
    <Dialog
      maxWidth={"xs"}
      style={{ maxWidth: "none" , zIndex: "1000000000"}}
      className={isFullScreen ? "" : "add-project-modal"}
      open={isOpen}
      onClose={handleClose}
      sx={dialogSx}
      fullScreen={isFullScreen || isMobile}
    >
      <DialogTitle sx={{
        ...titleSx, paddingLeft: "24px !important",
        '@media print': {
          display: 'none', // Hide the button when printing
        },
      }}>
        <Grid container>
          <Grid item xs={11} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0" }}>
            <p>{title}</p>
            {TitleEl}
          </Grid>
          <Grid item xs={1}>
            <CloseIcon sx={{cursor: "pointer"}} onClick={handleClose} />
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent sx={{padding: {
        xs:  "0.75rem 0rem",
        sm:  "0.75rem 1rem"
      },...contentSx}}>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default DialogModal;
