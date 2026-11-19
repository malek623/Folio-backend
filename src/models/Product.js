import mongoose from "mongoose";

// Core fields required by the lab: name, description, price, category, imageUrl, stock.
// Extra fields (author, oldPrice, rating, year, pages) come from the Folio React app.
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "name is required"], trim: true },
    description: { type: String, required: [true, "description is required"], trim: true },
    price: { type: Number, required: [true, "price is required"], min: [0, "price must be >= 0"] },
    category: { type: String, required: [true, "category is required"], trim: true },
    imageUrl: { type: String, trim: true, default: "" },
    stock: { type: Number, required: [true, "stock is required"], min: [0, "stock must be >= 0"], validate: { validator: Number.isInteger, message: "stock must be an integer" } },

    author: { type: String, trim: true, default: "" },
    oldPrice: { type: Number, min: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    year: { type: Number },
    pages: { type: Number, min: 1 },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
