import { useEffect, useState } from "react";

type Props = {
    data: Array<any>,
    map: google.maps.Map | null,
    apiKey: string
};


export function PolyLineV2({ map, data, apiKey }: Props) {
    const [snappedPath, setSnappedPath] = useState<any[]>([]);
    
    useEffect(() => {
        if (!data.length || !apiKey) return;

        const optimizedData = data 

        const fetchSnappedPath = async () => {
            const pathString = optimizedData.map(({ lat, lng }) => `${lat},${lng}`).join("|");
            const url = `https://roads.googleapis.com/v1/snapToRoads?interpolate=true&path=${encodeURIComponent(pathString)}&key=${apiKey}`;

            try {
                const response = await fetch(url);
                const result = await response.json();

                console.log("Google Roads API Response:", result);

                if (result.snappedPoints) {
                    const snappedCoordinates = result.snappedPoints.map((point: any) => ({
                        lat: point.location.latitude,
                        lng: point.location.longitude,
                    }));
                    console.log("Snapped Coordinates:", snappedCoordinates);
                    setSnappedPath(snappedCoordinates);
                }
            } catch (error) {
                console.error("Error fetching snapped road path:", error);
            }
        };

        fetchSnappedPath();
    }, [data, apiKey]);

    useEffect(() => {
        if (!map || !snappedPath.length) return;
        
        let index = 0;
        const animatedPath: any[] = [];
        const flightPath = new google.maps.Polyline({
            path: animatedPath,
            geodesic: false,
            strokeColor: "#0000FF", // Changed to blue
            strokeOpacity: 1,
            strokeWeight: 4, // Made it thicker
            icons: [{
                icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
                offset: "100%", // Single arrow at the end, keeping focus
            }],
        });
        flightPath.setMap(map);

        const animatePath = () => {
            if (index < snappedPath.length) {
                animatedPath.push(snappedPath[index]);
                flightPath.setPath([...animatedPath]);
                index++;
                setTimeout(animatePath, 100); // Adjust speed by changing timeout duration
            }
        };

        animatePath();

        return () => {
            flightPath.setMap(null);
        };
    }, [map, snappedPath]);

    return null;
}