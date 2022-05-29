import type { InlineQueryResult } from "telegraf/typings/core/types/typegram";
import { Telegraf } from "telegraf";
import { createClient } from "redis";
import dotenv from "dotenv";
import {
  searchBusStopsForBusNumber,
  searchNearbyBusStops,
  distanceBetweenTwoPoints,
} from "./bus";

dotenv.config();

if (!process.env.TELEGRAM_TOKEN || !process.env.REDIS_URL) {
  throw new Error("Missing TELEGRAM_TOKEN or REDIS_URL");
}

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.connect();

bot.on("inline_query", async (ctx) => {
  const { query } = ctx.inlineQuery;

  const location = ctx.inlineQuery.location;

  if (!location) {
    return ctx.answerInlineQuery(
      [
        {
          thumb_url:
            "https://media0.giphy.com/media/lSLJ9JCXVzItWCz3WG/giphy.gif?cid=ecf05e471cp8wzq8rcbfom4z017kxre2nbas7m5gssh0y1o5&rid=giphy.gif&ct=g",
          id: "1",
          type: "gif",
          gif_url:
            "https://media0.giphy.com/media/lSLJ9JCXVzItWCz3WG/giphy.gif?cid=ecf05e471cp8wzq8rcbfom4z017kxre2nbas7m5gssh0y1o5&rid=giphy.gif&ct=g",
          gif_file_id: "lSLJ9JCXVzItWCz3WG",
          title: "waiting for location",
          caption: "waiting for location",
        },
      ],
      {
        cache_time: 0,
      }
    );
  }

  const nearbyBusStops = searchNearbyBusStops(
    location.latitude,
    location.longitude
  );

  const timeTables = (
    await searchBusStopsForBusNumber(nearbyBusStops, query)
  ).sort((a, b) => a.distance - b.distance);

  const results = timeTables.map(
    (timeTable): InlineQueryResult => ({
      id: timeTable.code,
      type: "venue",
      address: `[${query}] ${timeTable.arrivalInfo.destination} ${
        timeTable.arrivalInfo.arrivalTime
      }წთ - ${distanceBetweenTwoPoints(
        location.latitude,
        location.longitude,
        timeTable.lat,
        timeTable.lon
      )}m`,
      title: `${timeTable.name}`,
      latitude: timeTable.lat,
      longitude: timeTable.lon,
    })
  );
  ctx.answerInlineQuery(results, {
    cache_time: 0,
  });
});

bot.launch();
