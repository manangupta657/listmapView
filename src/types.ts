export type Clusters = Cluster[]

export interface Cluster {
  lat: number
  lng: number
  address: string
  start_time: string
  end_time: string
  route_to_next_cluster: RouteToNextCluster[]
}

export interface RouteToNextCluster {
  datetime1: string
  lat: number
  lng: number
  address: string
}

export type FlattenedData = {
  lat: number;
  lng: number;
  address: string;
  color: string;
} & ({
  type: "halt",
  start_time: string;
  end_time: string;
  id: number
} | {
  type: "route",
  datetime: string;
}
)