import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { createServer } from "http";
import { bot } from "../src/bot";
import { beforeAll, afterAll, test, expect } from '@jest/globals';

config();

const client = new MongoClient(process.env.MONGODB_URI as string);
const server = createServer();

beforeAll(async () => {
  await client.connect();
  await bot.start();
  server.listen(process.env.PORT || 3000);
});

afterAll(async () => {
  await bot.stop();
  await client.close();
  server.close();
});

test("Bot runs without crashing", () => {
  expect(true).toBe(true);
});

