const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true },
    category: { type: String, required: true, lowercase: true },
    gender: {
      type: String,
      enum: ["male", "female", "neutral"],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    keywords: [{ type: String, lowercase: true }],
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

// Text index for search
productSchema.index({ name: "text", brand: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
