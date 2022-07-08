import { Markup, Telegraf } from "telegraf";
import { createClient } from "redis";
import dotenv from "dotenv";
import ttc from "ttc-api";
import { getArrivalTime } from "./utils";

dotenv.config();

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("Missing TELEGRAM_TOKEN or REDIS_URL");
}

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.command("start", (ctx) =>
  ctx.reply(
    "პრივეტ",
    Markup.keyboard([
      Markup.button.text("ჩემი გაჩერებების ნახვა"),
      Markup.button.text("ახალი გაჩერების დამატება"),
    ]).resize()
  )
);

bot.hears("ჩემი გაჩერებების ნახვა", (ctx) => ctx.reply(":)"));

bot.launch();
