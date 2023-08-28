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
