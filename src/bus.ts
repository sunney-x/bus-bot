import axios from "axios";

interface BusStopArrivalTimes {
  ArrivalTime: ArrivalTime[];
}

interface ArrivalTime {
  RouteNumber: string;
  DestinationStopName: string;
  ArrivalTime: number;
}

interface BusStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  code: string;
  locationType: number;
  wheelchairBoarding: number;
  vehicleType: number;
  vehicleTypeSet: boolean;
}

export async function fetchBusStopCoordinates(busStop: string) {
  try {
    const resp = await axios.get<BusStop>(
      `http://transfer.ttc.com.ge:8080/otp/routers/ttc/index/stops/1:${busStop}`
    );

    return {
      lat: resp.data.lat,
      lon: resp.data.lon,
    };
  } catch (e) {
    console.log(e);
  }
}

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
): Promise<number> {
  const arrivalTimes = await fetchBusArrivalTimes(busStopId);

  return (
    arrivalTimes.find((arrivalTime) => arrivalTime.busNumber === busNumber)
      ?.arrivalTime ?? -1
  );
}
