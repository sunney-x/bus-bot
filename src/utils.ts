import ttc from "ttc-api";

export const getArrivalTime = async (busId: string, stopId: string) => {
  const arrivalTimes = await ttc.stopArrivalTimes(stopId);

  const bus = arrivalTimes.find((b) => b.RouteNumber === busId);

  if (!bus) {
    return;
  }

  const arrivalTime = bus.ArrivalTime;

  return arrivalTime;
};
