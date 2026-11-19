import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "name is required"], trim: true },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true, // unique index -> prevents duplicate accounts
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "email is not valid"],
    },
    // bcrypt hash only. select:false => never returned by queries unless asked explicitly.
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

// Never leak the hash if a document is serialized
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
