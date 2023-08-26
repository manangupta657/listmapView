import axios from "axios";
import dayjs from "dayjs";
export function formatDate(date: string) {
  const formatedDate = dayjs(date).format("hh:mm a")
  return formatedDate;
}

export async function getClusters(date: string, searchParams: URLSearchParams) {
  const id = searchParams.get("id")
  const token = searchParams.get("token")
  const url = searchParams.get("url")
  const name = searchParams.get("name")
  const startFromAttendance = searchParams.get("startFromAttendance")

  if (!id) {
    alert("No Id Provided")
    return
  } 

  let requestUrl = `https://be.platform.simplifii.com/api/v1/custom/locationCluster?creator=${id}&date=${date}`;
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
  return response?.data?.response?.data
}

//2023-07-24