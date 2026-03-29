// Run: node utils/seedDB.js
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const Product = require("./productModel");
const mockData = require("../../database/mockData.json");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    await Product.deleteMany({});
    console.log("🗑️  Cleared existing products");

    const inserted = await Product.insertMany(mockData);
    console.log(`🌱 Seeded ${inserted.length} products`);

    await mongoose.disconnect();
    console.log("✅ Done. Database seeded.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
