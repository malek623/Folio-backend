import { Router } from "express";
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from "../controllers/productController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// Public
router.get("/", asyncHandler(getProducts));
router.get("/:id", asyncHandler(getProduct));

// Protected (JWT or OAuth2 access token)
router.post("/", requireAuth, asyncHandler(createProduct));
router.put("/:id", requireAuth, asyncHandler(updateProduct));
router.delete("/:id", requireAuth, asyncHandler(deleteProduct));

export default router;
