export const MAP_PAN_TO_EVENT = 'map-pan-to';

export interface MapPanToDetail {
  lat: number;
  lng: number;
  boundingBox: [south: number, north: number, west: number, east: number];
}
