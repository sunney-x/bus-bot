import type { ArrivalInfo, Stop } from "ttc-api/lib/types";
import ttc from "ttc-api";

export let stops: Stop[] = [];

const _users: { [key: number]: number } = {};

export const users = {
  add: (id?: number) => {
    if (typeof id === "undefined") return 0;
    _users[id] = _users[id] + 100;
    return _users[id];
  },
  sub: (id?: number) => {
    if (typeof id === "undefined") return 0;
    _users[id] = _users[id] - 100;
    return _users[id];
  },
  get: (id?: number) => {
    if (typeof id === "undefined") return 0;
    _users[id] = _users[id] || 500;
    return _users[id];
  },
};

export type StopWithDistance = Stop & { distance: number };
export type BusWithStopID = ArrivalInfo & { stopID: string };

export const busStops = async (): Promise<Stop[]> => {
  if (stops.length > 0) return stops;

  stops = await ttc.stops();

  return stops;
};

export const getArrivalTime = async (busId: string, stopId: string) => {
  const arrivalTimes = await ttc.stopArrivalTimes(stopId);

  const bus = arrivalTimes.find((b) => b.RouteNumber === busId);

  if (!bus) {
    return;
  }

  const arrivalTime = bus.ArrivalTime;

  return arrivalTime;
};

export const searchNearbyBusStops = async (
  radius: number,
  lat: number,
  lon: number
): Promise<StopWithDistance[]> => {
  const s = performance.now();
  const stops = await busStops();
  console.log(`stops: ${performance.now() - s}`);

  return stops
    .reduce((acc, stop) => {
      const distance = distanceBetweenTwoPoints(lat, lon, stop.lat, stop.lon);

      if (distance <= radius) {
        acc.push({
          ...stop,
          distance,
        });
      }

      return acc;
    }, [] as StopWithDistance[])
    .sort((a, b) => a.distance - b.distance);
};

export const fetchTimeTables = async (busStops: Stop[]) => {
  const timeTables = await Promise.all(
    busStops.map(async (busStop) => {
      const arrivalTimes = await ttc.stopArrivalTimes(busStop.id.split(":")[1]);

      return {
        ...busStop,
        arrivalTimes,
      };
    })
  );

  return timeTables;
};

export const isBusForward = async (busNumber: string, stopId: string): Promise<boolean> => {
  const yes = await ttc.busRouteInfo(busNumber, true);

  return yes.RouteStops.some((stop) => stop.StopId === stopId);
};

export const distanceBetweenTwoPoints = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.floor(R * c);
};
