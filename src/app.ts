import { Telegraf } from "telegraf";
import { fetchBusArrivalTime, fetchBusStopCoordinates } from "./bus";
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.TELEGRAM_TOKEN || !process.env.REDIS_URL) {
  throw new Error("Missing TELEGRAM_TOKEN or REDIS_URL");
}

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.connect();

bot.command("save", async (ctx) => {
  const [_, alias, busStopId] = ctx.message.text.split(" ");
  const coordinates = await fetchBusStopCoordinates(busStopId);

  if (!coordinates) {
    await ctx.reply("Bus stop not found");
    return;
  }

  await redis.set(`${alias}:${ctx.message.from.id}`, busStopId);
  await ctx.reply(`Saved "${alias}"`);
});

bot.command("bus", async (ctx) => {
  const [_, busStopIdOrAlias, busNumber] = ctx.message.text.split(" ");

  if (!busStopIdOrAlias || !busNumber) {
    return await ctx.reply("Invalid command");
  }

  const busStop = isNaN(+busStopIdOrAlias)
    ? await redis.get(`${busStopIdOrAlias}:${ctx.message.from.id}`)
    : busStopIdOrAlias;

  if (!busStop) {
    return await ctx.reply("Bus stop not found");
  }

  const lastArrivalTime = await fetchBusArrivalTime(busNumber, busStop);

  if (!lastArrivalTime) {
    return await ctx.reply("No bus found");
  }

  await ctx.reply(`${busNumber} bus is arriving in ${lastArrivalTime}`);
});

bot.launch();
