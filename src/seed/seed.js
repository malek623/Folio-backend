import "dotenv/config";
import fs from "node:fs";
import mongoose from "mongoose";
import Product from "../models/Product.js";

const products = JSON.parse(fs.readFileSync(new URL("./products.json", import.meta.url), "utf8"));

try {
  await mongoose.connect(process.env.MONGODB_URI);
  await Product.deleteMany({});
  const created = await Product.insertMany(products);
  console.log(`Seeded ${created.length} products`);
} catch (err) {
  console.error("Seeding failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
