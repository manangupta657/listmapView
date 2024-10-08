import Grid from '@mui/material/Grid';
import DialogModal from './dialog';

type Props = {
    isOpen: boolean;
    handleClose(): void;
    image: string | null;
}

const ImageDialog = ({ isOpen, handleClose, image }: Props) => {
    return (
        <DialogModal
            isOpen={isOpen}
            handleClose={handleClose}
            title=""
            contentSx={{
                backgroundColor: "#1B1F23",
                color: "#ffffff"
            }}
            titleSx={{
                backgroundColor: "#1B1F23",
                color: "#ffffff",
                "& p": {
                    fontWeight: "600 !important"
                }
            }}
        >
            <Grid container>
                <Grid item sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "1rem",
                    borderRadius: "2px"
                }} xs={12}>
                    {image ? <img src={image} alt='profile' /> : <p>No Image to Show</p>}
                </Grid>
            </Grid>
        </DialogModal>
    )
}

export default ImageDialog