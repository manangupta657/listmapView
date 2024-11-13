import axios from "axios"
import { colors } from "../constants";

export interface NewCluster {
    lat: number
    lng: number
    address: string
    start_time: string
    type: "halt"
    color: string
    id: number
    image: string
    comment: string
    label: string
    isAttendence: boolean
    isDayEnd: boolean
    automatic_tracking: 0 | 1
}

type Clusters = NewCluster[];
type Cluster = NewCluster;

export type LocationData = {
    id: number;
    fk_org: number;
    fk_creator: number;
    entity: string;
    state: string;
    lat: number;
    lng: number;
    recorded_at: string; // assuming a timestamp in string format
    label: string;
    dvfga_formatted_address: string;
    comment: string;
    dvfga_locality: string;
    image1: string; // URL to image
    user_actions: any[]; // assuming an array of actions, adjust if there's a specific structure
    lat_formatted: number;
    lng_formatted: number;
    automatic_tracking: 0 | 1;
    route_to_next_cluster: any[]; // assuming an array, adjust if there's a specific structure
};

export type FlattenedData = {
    lat: number;
    lng: number;
    address: string;
    color: string;
    isAttendence: boolean;
    isDayEnd: boolean;
  } & ({
    type: "halt",
    start_time: string;
    id: number
  })

export function getFlattenedData(locationData: Clusters){
    const flattenedData: FlattenedData[] = locationData.reduce((accumulator, currentLocation, index) => {

      const flatHalt: FlattenedData = {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          address: currentLocation.address,
          type: "halt",
          color: colors[index],
          start_time: currentLocation.start_time,
          id: index + 1,
          isAttendence: currentLocation.isAttendence,
          isDayEnd: currentLocation.isDayEnd
      }
          
    
      return [...accumulator, flatHalt]
    }, [] as FlattenedData[]);
  
    return flattenedData
  }

export async function getClusters(date: string, searchParams: URLSearchParams) {
    const id = searchParams.get("id")
    const token = searchParams.get("token")
    const url = searchParams.get("url");
    const saoParams = searchParams.get("sao"); 

    if (!id) {
        alert("No Id Provided")
        return
    }

    let newUrl = "";

    if(url) {
        const isEndsWithSlash = url.endsWith("/");
        if(isEndsWithSlash) {
            newUrl = url + "cards"
        } else {
            newUrl = url + "/cards"
        }
    }

    let requestUrl = `${newUrl || 'https://gg.platform.simplifii.com/api/v1/cards'}?type=Location&sort_by=+datetime1${saoParams !== "y" ?"&equalto___automatic_tracking=0" : ""}&items_per_page=500&creator=${id}&dateis___recorded_at=${date}&show_columns=string1%2Cstring5%2Cstring6%2Cstring9%2Ctext1%2Cdatetime1%2Cfloat1%2Cfloat2%2Cbool3`;
    if (token) {
        requestUrl += `&token=${token}`
    }

    const response = await axios.get(requestUrl);

    return response?.data
}

export const transformClusterData = (data: LocationData[]): Clusters => {
    const newData: Clusters = [];
    let idCount = 0;
    let colorCount = 0;

    for (let i = 0; i < data.length; i++) {
        // const { route_to_next_cluster } = data[i];
        const current_data = data[i];

        const new_format: Cluster = {
            address: current_data.dvfga_formatted_address || current_data.dvfga_locality,
            lat: current_data.lat,
            lng: current_data.lng,
            start_time: current_data.recorded_at,
            type: "halt",
            color: colors[colorCount],
            id: current_data.automatic_tracking === 0 ? idCount + 1 : 0,
            comment: current_data.comment,
            label: current_data.label,
            image: current_data.image1,
            isAttendence: ((current_data.dvfga_formatted_address || current_data.dvfga_locality) + current_data.label ).toLocaleLowerCase().includes("attendance"),
            isDayEnd: ((current_data.dvfga_formatted_address || current_data.dvfga_locality) + current_data.label).toLocaleLowerCase().includes("day end"),
            automatic_tracking: current_data.automatic_tracking
        }

        if(current_data.automatic_tracking === 0) {
            idCount++;
            colorCount++;
        }

        newData.push(new_format);
    }
    return newData
}