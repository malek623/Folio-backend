import mongoose from "mongoose";
import Product from "../models/Product.js";
import { HttpError } from "../utils/httpError.js";

// Only these fields can be set by clients (prevents mass-assignment of _id, timestamps...)
const FIELDS = ["name", "description", "price", "category", "imageUrl", "stock", "author", "oldPrice", "rating", "year", "pages"];
const pick = (body = {}) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

function checkId(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, `Invalid product id: ${id}`);
}

export async function getProducts(req, res) {
  const filter = {};
  if (req.query.category) filter.category = String(req.query.category);
  const products = await Product.find(filter).sort({ createdAt: 1, _id: 1 });
  res.status(200).json(products);
}

export async function getProduct(req, res) {
  checkId(req.params.id);
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, "Product not found");
  res.status(200).json(product);
}

export async function createProduct(req, res) {
  const data = pick(req.body);
  if (Object.keys(data).length === 0) throw new HttpError(400, "Request body is empty or invalid");
  const product = await Product.create(data); // schema validation -> 400 on bad data
  res.status(201).json(product);
}

export async function updateProduct(req, res) {
  checkId(req.params.id);
  const data = pick(req.body);
  if (Object.keys(data).length === 0) throw new HttpError(400, "No valid fields to update");
  const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!product) throw new HttpError(404, "Product not found");
  res.status(200).json(product);
}

export async function deleteProduct(req, res) {
  checkId(req.params.id);
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new HttpError(404, "Product not found");
  res.status(200).json({ message: "Product deleted successfully", id: product.id });
}
