import { Cluster, Clusters } from './types';
import React, { useEffect, useRef, useState } from 'react';

import { OLA_KEY } from './utils/transform';
import { OlaMaps } from 'olamaps-web-sdk';

interface OlaMapProps {
    visitedLocation?: Clusters | null;
    activeCluster?: Cluster | null;
}


const OlaMap: React.FC<OlaMapProps> = ({ visitedLocation, activeCluster }) => {
    const mapElementRef = useRef<HTMLDivElement>(null);
    const [olaMapRef, setOlaMapRef] = useState<OlaMaps | null>(null)
    const [olaMethodRef, setOlaMethodRef] = useState<OlaMaps | null>(null)

    useEffect(() => {
        if (!mapElementRef.current) return;

        const olaMaps = new OlaMaps({
            apiKey: OLA_KEY,
            mode: "3d",
            threedTileset: "https://api.olamaps.io/tiles/vector/v1/3dtiles/tileset.json",
        });
        const map = olaMaps.init({
            style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
            container: mapElementRef.current,
            center: visitedLocation ? [visitedLocation[0].lng, visitedLocation[0].lat] : [77.5946, 12.9716],
            zoom: 12,
        });

        setOlaMapRef(olaMaps)
        setOlaMethodRef(map)
        setVisitedLocation(olaMaps, map)
        console.log("rendering")
    }, [visitedLocation]);


    const setActiveCluster = () => {
        if (activeCluster) {
            const latlng = activeCluster?.route_to_next_cluster?.map?.((c) => c.lat + ',' + c.lng).join('|') ?? '';

            if (!latlng) return
            fetchSnapToRoad(latlng).then(roadData => {
                if (roadData) {
                    if (!olaMethodRef) return;
                    const points = roadData.snapped_points.map((l: { location: { lat: any; lng: any; }; }) => ([l.location.lat, l.location.lng]));
                    console.log({ points });
                    plotPath(points, olaMethodRef)
                }
            });
        }
    }

    const plotPath = (points: any, olaMethodRef:any) => {
        const routeId = points[0][0] + '-'+ points[points.length-1][1] + '-' + Date.now();
        (olaMethodRef as any).addSource(routeId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: points
                },
            },
        });
        (olaMethodRef as any).addLayer({
            id: routeId,
            type: 'line',
            source: routeId,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
                'line-color': 'red',
                'line-width': 8,
            },
        });
        console.log(olaMethodRef)
    }

    useEffect(() => {
        setActiveCluster()
    }, [activeCluster])

    const setVisitedLocation = (olaMaps: OlaMaps, map: any) => {
        visitedLocation?.filter(c => c.route_to_next_cluster.length < 1)?.forEach((c) => {
            olaMaps.addPopup({})
                .setLngLat([c.lng, c.lat])
                .setHTML(`
                    <div class="map-popup">
                      <h3 class="popup-title">${c.address}</h3>
                      <div class="popup-time-info">
                        <p><span class="time-label">Start:</span> ${c.start_time}</p>
                        <p><span class="time-label">End:</span> ${c.end_time}</p>
                      </div>
                    </div>
                  `)
                .addTo(map)
        })
    }
    const fetchSnapToRoad = async (latlng: string) => {
        try {
            const response = await fetch(
                `https://api.olamaps.io/routing/v1/snapToRoad?points=${encodeURIComponent(latlng)}&enhancePath=false&api_key=${OLA_KEY}`,
                {
                    method: 'GET',
                    headers: {
                        'X-Request-Id': String(Date.now())
                    }
                }
            );

            console.log(response)
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching snap to road data:', error);
            return null;
        }
    };



    return <div ref={mapElementRef} style={{ width: '100%', height: '100%' }} />;
};

export default OlaMap;
