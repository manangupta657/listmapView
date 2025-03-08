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
    let stoppageIndex = 1;
    newData.forEach(o => {
        if (o.route_to_next_cluster.length == 0) {
            o.stoppageIndex = stoppageIndex;
            stoppageIndex = stoppageIndex + (o.route_to_next_cluster.length == 0 ? 1 : 0);
        }
    })
    return newData
}