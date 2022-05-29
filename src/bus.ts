import axios from "axios";
import stops from "./stops.json";

interface BusStopArrivalTimes {
  ArrivalTime: ArrivalTime[];
}

interface ArrivalTime {
  RouteNumber: string;
  DestinationStopName: string;
  ArrivalTime: number;
}

export interface BusStop {
  id: string;
  code: string;
  name: string;
  lat: number;
  lon: number;
}

type BusStopWithDistance = BusStop & { distance: number };

export async function fetchBusArrivalTimes(busStopId: string): Promise<
  {
    busNumber: string;
    arrivalTime: number;
    destination: string;
  }[]
> {
  const resp = await axios.get<BusStopArrivalTimes>(
    `http://transfer.ttc.com.ge:8080/otp/routers/ttc/stopArrivalTimes?stopId=${busStopId}`
  );

  return resp.data.ArrivalTime.map((arrivalTime: ArrivalTime) => ({
    busNumber: arrivalTime.RouteNumber,
    arrivalTime: arrivalTime.ArrivalTime,
    destination: arrivalTime.DestinationStopName,
  }));
}

export async function fetchBusArrivalTime(
  busNumber: string,
  busStopId: string
): Promise<{
  arrivalTime: number;
  destination: string;
}> {
  const arrivalTimes = await fetchBusArrivalTimes(busStopId);

  const timeTable = arrivalTimes.find(
    (arrivalTime) => arrivalTime.busNumber === busNumber
  );

  if (!timeTable) {
    return { arrivalTime: -1, destination: "" };
  }

  return {
    arrivalTime: timeTable.arrivalTime,
    destination: timeTable.destination,
  };
}

export const searchNearbyBusStops = (
  lat: number,
  lon: number
): BusStopWithDistance[] =>
  stops
    .filter(
      (busStop: BusStop) =>
        Math.abs(busStop.lat - lat) < 0.01 && Math.abs(busStop.lon - lon) < 0.01
    )
    .map((busStop: BusStop) => ({
      ...busStop,
      distance: distanceBetweenTwoPoints(lat, lon, busStop.lat, busStop.lon),
    }));

export const searchBusStopsForBusNumber = async (
  busStops: BusStopWithDistance[],
  busNumber: string
) => {
  const timeTables = await Promise.all(
    busStops.map(async (busStop) => {
      const arrivalInfo = await fetchBusArrivalTime(busNumber, busStop.code);

      return {
        ...busStop,
        arrivalInfo,
        busNumber,
      };
    })
  );

  return timeTables
    .filter(
      (timeTable) =>
        timeTable.arrivalInfo.arrivalTime !== -1 &&
        timeTable.busNumber === busNumber
    )
    .sort((a, b) => a.arrivalInfo.arrivalTime - b.arrivalInfo.arrivalTime);
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
