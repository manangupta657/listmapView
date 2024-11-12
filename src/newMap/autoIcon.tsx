import MotionPhotosAutoIcon from '@mui/icons-material/MotionPhotosAuto';
import { SxProps, Theme, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { Dispatch, SetStateAction } from 'react';


export default function AutoIcon({sx = {}, showAuto, setShowAuto}: {sx?: SxProps<Theme>, showAuto: boolean, setShowAuto: Dispatch<SetStateAction<boolean>>}) {
    const searchParams = new URLSearchParams(window.location.search);
    const saoParams = searchParams.get("sao"); 

    if(saoParams !== "y") {
        return <></>
    }

    return (
        <Tooltip title="Automatic Tracking" arrow>
              <IconButton
                    onClick={() => {
                        setShowAuto((prev) => !prev);
                    }}
                    sx={{
                        backgroundColor: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: '5px',
                        "&:hover": {
                        backgroundColor: "white"
                        },
                        ...sx
                }}>
                    <MotionPhotosAutoIcon sx={{
                        fontSize: '30px',
                        color: showAuto ? "purple" :  "rgba(0,0,0,0.7)",
                        "&:hover": {
                        color:showAuto ? "purple" :  "rgba(0,0,0,1)"
                        }
                    }} />
                </IconButton>
        </Tooltip>
    )
}