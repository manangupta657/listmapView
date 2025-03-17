import { useEffect } from "react";

type Props = {
    data: Array<any>
    map: google.maps.Map | null
}

export function PolyLine(props: Props) {
    const { map, data } = props
    useEffect(() => {
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
        if (data.length) {
            flightPath.setMap(map);
        }
        return () => {
            flightPath.setMap(null);
        };
    }, [map, data]);

    return <></>;
}