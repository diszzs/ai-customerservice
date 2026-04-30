import { Schema, models, model } from "mongoose";

const SessionSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "dosen", "mahasiswa"],
      required: true,
    },
    name: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-delete expired sessions via MongoDB TTL index
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = models.Session || model("Session", SessionSchema);
export default Session;