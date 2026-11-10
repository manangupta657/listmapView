import { Clusters } from "../types"

/**
 * Splits each cluster into a stop + a "Travel 🚗" row for its route.
 * `clean: true` (used after cleanDay) never promotes a single route reading to a
 * stop — cleanDay already decided what is a stop — and times each drive from
 * leaving one stop to arriving at the next.
 */
export const transformClusterData = (data: Clusters, { clean = false } = {}): Clusters => {
    const newData: Clusters = [];
    for (let i = 0; i < data.length; i++) {
        const { route_to_next_cluster } = data[i];
        const next = data[i + 1];
        newData.push(data[i]);
        data[i].route_to_next_cluster = []

        if (route_to_next_cluster.length === 1 && !clean) {
            newData.push({
                ...route_to_next_cluster[0],
                route_to_next_cluster: [],
                start_time: route_to_next_cluster[0].datetime1,
                end_time: route_to_next_cluster[0].datetime1
            });
        } else if (route_to_next_cluster.length > 1 || (clean && route_to_next_cluster.length > 0)) {
            const last = route_to_next_cluster[route_to_next_cluster.length - 1];
            newData.push({
                "address": "Travel 🚗",
                "lat": route_to_next_cluster[0].lat,
                "lng": route_to_next_cluster[0].lng,
                "start_time": clean ? data[i].end_time : route_to_next_cluster[0].datetime1,
                "end_time": clean ? next?.start_time ?? last.datetime1 : last.datetime1,
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
