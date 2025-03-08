export type Clusters = Cluster[]

export interface Cluster {
  lat: number
  lng: number
  address: string
  start_time: string
  stoppageIndex?: number,
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
  stoppageIndex: any,
  lng: number;
  address: string;
  color: string;
} & ({
  type: "halt",
  stoppageIndex: any,
  start_time: string;
  end_time: string;
  id: number
} | {
  stoppageIndex: any,
  type: "route",
  datetime: string;
}
)