import type { BusWithStopID } from "./utils";
import { Markup, Telegraf } from "telegraf";
import dotenv from "dotenv";
import * as utils from "./utils";
import ttc from "ttc-api";

dotenv.config();

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("Missing TELEGRAM_TOKEN or REDIS_URL");
}

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const { users } = utils;

bot.start((ctx) =>
  ctx.reply(
    "TTC ๐",
    Markup.keyboard([
      Markup.button.locationRequest("แแแขแแแฃแกแแแแก แแแฎแแ ๐"),
      Markup.button.text("แซแแแแแก แ แแแแฃแกแแก แจแแชแแแ โ๏ธ"),
    ]).resize()
  )
);

bot.hears("แซแแแแแก แ แแแแฃแกแแก แจแแชแแแ โ๏ธ", (ctx) => {
  ctx.reply(
    `แแแฃแแแขแ แแ แแแฃแแแ แซแแแแแก แ แแแแฃแกแก ๐\nแแแแแแแแแแแ แ แแแแฃแกแ: ${users.get(
      ctx.from.id
    )}`,
    Markup.inlineKeyboard([
      Markup.button.callback("แแแฃแแแขแ", "add-radius"),
      Markup.button.callback("แแแฃแแแ", "sub-radius"),
    ])
  );
});

bot.action("add-radius", async (ctx) => {
  ctx.from && users.add(ctx.from?.id);
  await ctx.editMessageText(
    `แแแฃแแแขแ แแ แแแฃแแแ แซแแแแแก แ แแแแฃแกแก ๐\nแแแแแแแแแแแ แ แแแแฃแกแ: ${users.get(
      ctx.from?.id
    )}`,
    Markup.inlineKeyboard([
      Markup.button.callback("แแแฃแแแขแ", "add-radius"),
      Markup.button.callback("แแแฃแแแ", "sub-radius"),
    ])
  );
});

bot.action("sub-radius", async (ctx) => {
  ctx.from && users.sub(ctx.from?.id);
  await ctx.editMessageText(
    `แแแฃแแแขแ แแ แแแฃแแแ แซแแแแแก แ แแแแฃแกแก ๐\nแแแแแแแแแแแ แ แแแแฃแกแ: ${users.get(
      ctx.from?.id
    )}`,
    Markup.inlineKeyboard([
      Markup.button.callback("แแแฃแแแขแ", "add-radius"),
      Markup.button.callback("แแแฃแแแ", "sub-radius"),
    ])
  );
});

bot.on("location", async (ctx) => {
  const location = ctx.message.location;
  const lat = location.latitude;
  const lng = location.longitude;
  const radius = users.get(ctx.from?.id);

  const nearbyStops = await utils.searchNearbyBusStops(radius, lat, lng);
  const timeTables = await utils.fetchTimeTables(nearbyStops);

  const busList = timeTables
    .filter((bus) => bus.code !== undefined)
    .map((busStop) =>
      busStop.arrivalTimes.map((at) => ({
        ...at,
        stopID: busStop.code!,
      }))
    )
    .flat();

  const busListWithDistance = Object.values(
    busList.reduce(
      (
        acc: {
          [key: string]: BusWithStopID;
        },
        bus
      ) => {
        if (!acc[bus.DestinationStopName]) {
          acc[bus.DestinationStopName] = bus;
        }

        return acc;
      },
      {}
    )
  );

  ctx.reply(
    `แแแขแแแฃแกแแแ ${radius} แแแขแ แแก แ แแแแฃแกแจแ`,
    Markup.inlineKeyboard(
      busListWithDistance.map((bus) =>
        Markup.button.callback(
          bus.DestinationStopName,
          `${bus.RouteNumber}:${bus.stopID}`
        )
      ),
      {
        columns: 2,
      }
    )
  );
});

bot.action(/(.*):(.*)/, async (ctx) => {
  if (!ctx.callbackQuery.data) return ctx.reply("แแแแแชแแแ แแแ  แแแแซแแแแ ๐ข");

  const [busNumber, stopId] = ctx.callbackQuery.data.split(":");

  const stops = await utils.busStops();

  const isForward = await utils.isBusForward(busNumber, stopId);
  const busStop = stops.find((stop) => stop.code === stopId);

  const loc = ttc.busLiveLocations(busNumber, isForward);

  // ctx.replyWithLocation(busStop.location, {
});

bot.launch();
