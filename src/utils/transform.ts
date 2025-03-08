import { Clusters } from "../types"

export const transformClusterData = (data: Clusters): Clusters => {
    const newData: Clusters = [];
    for (let i = 0; i < data.length; i++) {
        const { route_to_next_cluster } = data[i];
        newData.push(data[i]);
        data[i].route_to_next_cluster = []

        if (route_to_next_cluster.length === 1) {
            newData.push({
                ...route_to_next_cluster[0],
                route_to_next_cluster: [],
                start_time: route_to_next_cluster[0].datetime1,
                end_time: route_to_next_cluster[0].datetime1
            });
        } else if (route_to_next_cluster.length > 1) {
            newData.push({
                "address": "Travel 🚗",
                "lat": route_to_next_cluster[0].lat,
                "lng": route_to_next_cluster[0].lng,
                "start_time": route_to_next_cluster[0].datetime1,
                "end_time": route_to_next_cluster[route_to_next_cluster.length - 1].datetime1,
                route_to_next_cluster
            });
        }
    }
    return newData
}

export const OLA_KEY = "gqf2EX4lAe2bHlQRmGa0J1H65Qtuwwh3CdEPyx6S"
