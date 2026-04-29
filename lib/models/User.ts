import mongoose, { Schema, models, model } from "mongoose";

/* ===================== USER SCHEMA ===================== */
const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "dosen", "mahasiswa"],
      default: "mahasiswa",
    },

    status: {
      type: String,
      enum: ["aktif", "nonaktif"],
      default: "aktif",
    },
  },
  {
    timestamps: true, // createdAt & updatedAt otomatis
  }
);

/* ===================== FIX HOT RELOAD ===================== */
const User = models.User || model("User", UserSchema);

export default User;