import "leaflet";

declare module "leaflet" {
  interface IconOptions {
    iconRetinaUrl?: string;
    iconUrl?: string;
    shadowUrl?: string;
  }
}