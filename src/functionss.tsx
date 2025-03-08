import { Clusters, FlattenedData } from "./types";

import axios from "axios";
import { colors } from "./constants";
import dayjs from "dayjs";

export function formatDate(date: string) {
  const formatedDate = dayjs(date).format("hh:mm a")
  return formatedDate;
}

export function formatDuration(start_time: string, end_time: string) {
  const date1 = dayjs(start_time).format("hh:mm a");
  const date2 = dayjs(end_time).format("hh:mm a");

  if (date1 === date2){
    return date1
  }
  else{
    return `${date1} - ${date2}`
  }
}

export async function getClusters(date: string, searchParams: URLSearchParams, v2 = false) {
  const id = searchParams.get("id")
  const token = searchParams.get("token")
  const url = searchParams.get("url")
  const name = searchParams.get("name")
  const startFromAttendance = searchParams.get("startFromAttendance")

  if (!id) {
    alert("No Id Provided")
    return
  } 

  let requestUrl = `https://be.platform.simplifii.com/api/v1/custom/${v2 ? 'locationClusterV2' : 'locationCluster'}?creator=${id}&date=${date}`;
  if (token){
    requestUrl += `&token=${token}`
  }
  if (url){
    requestUrl += `&url=${url}`
  }
  if (name){
    requestUrl += `&name=${name}`
  }
  if (startFromAttendance){
    requestUrl += `&startFromAttendance=${startFromAttendance}`
  }

  const response = await axios.get(requestUrl);
  return response?.data
}

//2023-07-24

export function getFlattenedData(locationData: Clusters){
  const flattenedData: FlattenedData[] = locationData.reduce((accumulator, currentLocation, index) => {
    const flatRouteData: FlattenedData[] = currentLocation.route_to_next_cluster.map(
      (step) => ({
        lat: step.lat,
        lng: step.lng,
        address: step.address,
        type: "route",
        color: colors[index],
        datetime: step.datetime1,
      })
    );
  
    const flatHalt: FlattenedData = {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        address: currentLocation.address,
        type: "halt",
        color: colors[index],
        start_time: currentLocation.start_time,
        end_time: currentLocation.end_time,
        id: index + 1
    }
        
  
    return [...accumulator, flatHalt, ...flatRouteData]
  }, [] as FlattenedData[]);

  return flattenedData
}

export function getPolylinesData(data: FlattenedData[]){
  return data.map(item => ( { lat: item.lat, lng: item.lng }))
}


export function getDuration(start_time: string, end_time: string) {
  const date1 = dayjs(start_time);
  const date2 = dayjs(end_time);
  let duration = ""
  if (date2.diff(date1, "hours")){
    duration =  date2.diff(date1, "hours", true).toFixed(2).toString() + " hrs"
  } else{
    if (date2.diff(date1, "minutes", true) < 1){
      return date1.format("hh:mm a")
    }
    else{
      duration =  date2.diff(date1, "minutes", true).toFixed(0).toString() + " mins"
    }
  }

  return `${duration} (${date1.format("hh:mm a")} - ${date2.format("hh:mm a")})`

  // return formatedDate;

}
