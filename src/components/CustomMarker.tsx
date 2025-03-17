import { ReactNode, useEffect, useRef } from "react";
import { Root, createRoot } from "react-dom/client";

interface CustomMarkerProps {
    map: google.maps.Map | null;
    position: google.maps.LatLng | google.maps.LatLngLiteral;
    children: ReactNode;
    onClick?: (() => void) | null;
}

export function CustomMarker({ map, position, children, onClick }: CustomMarkerProps) {
    const rootRef = useRef<Root | null>(null);
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

    useEffect(() => {
        if (!rootRef.current) {
            const container = document.createElement("div");
            rootRef.current = createRoot(container);
            markerRef.current = new google.maps.marker.AdvancedMarkerElement({
                position,
                content: container,
            });
        }

        return () => {
            if (markerRef.current) {
                markerRef.current.map = null;
            }
        };
    }, [position]);

    useEffect(() => {
        if (rootRef.current && markerRef.current) {
            rootRef.current.render(children);
            markerRef.current.position = position;
            markerRef.current.map = map;

            const listener = markerRef.current.addListener("click", onClick || (() => { }));
            return () => listener.remove();
        }
    }, [map, position, children, onClick]);

    return null;
}
