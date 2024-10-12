import { useEffect, useMemo, useRef, useState } from 'react';
import { Wrapper } from "@googlemaps/react-wrapper";
import { createRoot } from "react-dom/client";
import { Box, Chip, CircularProgress, Stack, Tooltip, Typography } from '@mui/material';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import { AccessTime } from "@mui/icons-material";
import FmdGoodOutlinedIcon from '@mui/icons-material/FmdGoodOutlined';
import TagIcon from '@mui/icons-material/Tag';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { formatDate } from '../functionss';
import { NewCluster } from './helper';
import { formatDurationNew } from './SingleDetails';
import ImageDialog from './profile-picture-dialog';


type Clusters = NewCluster[];
type Cluster = NewCluster;

const WeatherComponentStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
}

type Props = {
    data: Clusters | null;
    activeCluster: Cluster | null;
    apiInProgress: boolean;
};

const mapOptions = {
    mapId: "DEMO_MAP_ID",
    center: { lat: 24.6628595, lng: 77.3348837 },
    zoom: 12,
    disableDefaultUI: true,
    zoomControl: true,
    scaleControl: true,
};


export default function GoogleMapsNew({ apiInProgress, data, activeCluster }: Props) {
    return (
        <Wrapper apiKey={"AIzaSyCXmuZgrN0tJsciGtndwNGsBDT5lISv3bM"}
            version="beta"
            libraries={["marker"]}
        >
            <MyMap apiInProgress={apiInProgress} markers={data} activeCluster={activeCluster} />
        </Wrapper>
    );
}

function MyMap({ markers, apiInProgress, activeCluster }: { markers: Clusters | null, apiInProgress: boolean, activeCluster: Cluster | null }) {
    const [map, setMap] = useState<google.maps.Map>();
    const [imgDialog, setImgDialog] = useState<{ state: boolean, image: string | null }>({ state: false, image: null });
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (markers && markers.length > 0) {
            if (ref.current) {
                const center = { lat: markers[0].lat, lng: markers[0].lng };
                const map = new window.google.maps.Map(ref.current, {
                    ...mapOptions,
                    center,
                });
                setMap(map);
            }
        }
    }, [JSON.stringify(markers)]);

    useEffect(() => {
        if (activeCluster && map) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend({ lat: activeCluster.lat, lng: activeCluster.lng });
            map.fitBounds(bounds);
            map.setZoom(15);
        }
    }, [activeCluster, map])

    const CheckTimeAppend = (item: any) => {
        let timeString: string = "";

        markers!.forEach((mapData: any) => {
            if ((item.lat === mapData.lat) && (item.lng === mapData.lng)) {
                if (timeString) {
                    timeString += ', ' + formatDate(mapData.datetime);
                } else {
                    timeString = formatDate(mapData.datetime);
                }
            }
        })
        return timeString;
    }

    function getPolylinesData(data: Clusters) {
        return data.map(item => ({ lat: item.lat, lng: item.lng }))
    }

    const polyLinesData = useMemo(() => {
        if (!markers || !markers.length) return [];
        return getPolylinesData(markers);
    }, [JSON.stringify(markers)]);


    if (apiInProgress) {
        return <Box sx={WeatherComponentStyle}>
            <CircularProgress />
        </Box>
    }

    return (
        <>
            <div ref={ref} id="map" />
            <PolyLine data={polyLinesData} map={map} />
            {map && markers && markers.map((item) => (
                <Marker
                    key={item.lat + item.lng + item.address}
                    map={map}
                    position={{ lat: item.lat, lng: item.lng }}
                    title={item.address}
                >
                    <Tooltip
                        placement="top"
                        title={
                            <div className="popper-container">
                                <div className="popper-data">
                                    {/* <Place /> */}
                                    <FmdGoodOutlinedIcon />
                                    <Typography>
                                        <span className="popper-value">{item.address}</span>
                                    </Typography>
                                </div>
                                {item.type === "halt" ? (
                                    <div className="popper-data">
                                        <AccessTime />
                                        <Typography>
                                            <span className="popper-value"> {formatDurationNew(item.start_time)}</span>
                                        </Typography>
                                    </div>
                                ) : (
                                    <div className="popper-data">
                                        <AccessTime />
                                        <Typography>
                                            <span className="popper-value"> {CheckTimeAppend(item)}</span>
                                        </Typography>
                                    </div>
                                )}
                                {item.image &&
                                    <div className='popper-data'>
                                        <Stack sx={{ display: "flex", cursor: "pointer", alignItems: "center", gap: "4px", flexDirection: "row" }}>
                                            <ImageRoundedIcon />
                                            <Chip onClick={() => { setImgDialog(() => ({ state: true, image: item.image })) }} sx={{ fontSize: '12px', fontWeight: "bold", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }} label={"View Image"} />
                                        </Stack>
                                    </div>
                                }
                                {item.label &&
                                    <div className='popper-data'>
                                        <TagIcon />
                                        <Typography>
                                            <span className="popper-value"> {item.label}</span>
                                        </Typography>
                                    </div>
                                }

                                {item.comment &&
                                    <div className='popper-data'>
                                        <FormatQuoteIcon sx={{ marginTop: "2px" }} />
                                        <Typography>
                                            <span className="popper-value" style={{ fontSize: "12px" }}> {item.comment}</span>
                                        </Typography>
                                    </div>
                                }

                            </div>
                        }
                        arrow
                        disableFocusListener
                        componentsProps={{
                            tooltip: {
                                sx: {
                                    bgcolor: "common.white",
                                    color: "common.black",
                                    "& .MuiTooltip-arrow": {
                                        color: "common.white",
                                    },
                                },
                            },
                        }}
                    >
                        <div
                            className={`marker ${item.type}`}
                            style={{ background: item.color }}
                        >
                            {item.type === "halt" ? item.id : null}
                        </div>
                    </Tooltip>
                </Marker>
            ))}
            {
                (!map) ? <Typography sx={{ display: { lg: 'none', md: 'none' } }} className="no-location">No locations tracked on this date</Typography> : <></>
            }

            {imgDialog.state ?
                <ImageDialog
                    isOpen={imgDialog.state}
                    handleClose={() => setImgDialog({ state: false, image: null })}
                    image={imgDialog.image}
                /> : <></>
            }
        </>
    );
}
function Marker({ map, position, children, onClick }: any) {
    // @ts-ignore
    const rootRef = useRef<any>();
    const markerRef = useRef<any>();

    useEffect(() => {
        if (!rootRef.current) {
            const container = document.createElement("div");
            rootRef.current = createRoot(container);
            //@ts-ignore
            markerRef.current = new google.maps.marker.AdvancedMarkerView({
                position,
                content: container,
            });
        }

        return () => {
            if (markerRef.current) {
                markerRef.current.map = null;
            }
        };
    }, []);

    useEffect(() => {
        rootRef.current.render(children);
        markerRef.current.position = position;
        markerRef.current.map = map;
        const listener = markerRef.current.addListener("click", onClick);
        return () => listener.remove();
    }, [map, position, children, onClick]);

    return <></>;
}

function PolyLine({ map, data }: { map: any, data: any }) {

    useEffect(() => {
        if (data.length === 0) {
            const flightPath = new google.maps.Polyline();
            flightPath.setMap(map);
        }
        else {
            const flightPath = new google.maps.Polyline({
                path: data,
                geodesic: true,
                strokeColor: "#000000",
                strokeOpacity: 1,
                strokeWeight: 1,
                icons: [
                    {
                        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
                        offset: "100%",
                        repeat: "80px",
                    },
                ],
            });

            flightPath.setMap(map);
        }
    }, [map, JSON.stringify(data)]);

    return <></>;
}