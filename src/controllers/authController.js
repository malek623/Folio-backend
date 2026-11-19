import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { HttpError } from "../utils/httpError.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isStr = (v) => typeof v === "string" && v.trim() !== "";

export async function register(req, res) {
  const { name, email, password } = req.body || {};

  const errors = [];
  if (!isStr(name)) errors.push("name is required");
  if (!isStr(email) || !EMAIL_RE.test(email.trim())) errors.push("a valid email is required");
  if (!isStr(password) || password.length < 6) errors.push("password is required (min 6 characters)");
  if (errors.length) throw new HttpError(400, "Validation failed", errors);

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    throw new HttpError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: normalizedEmail, passwordHash });

  res.status(201).json({ message: "User registered successfully", user });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!isStr(email) || !isStr(password)) {
    throw new HttpError(400, "email and password are required");
  }

  // passwordHash is select:false, so we ask for it explicitly
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  // same message for unknown email / wrong password: do not reveal which one failed
  if (!ok) throw new HttpError(401, "Invalid email or password");

  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    subject: user.id,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });

  res.status(200).json({ message: "Login successful", token, user });
}
