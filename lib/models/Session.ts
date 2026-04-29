import mongoose, { Schema, models, model } from "mongoose";

const SessionSchema = new Schema({
  token: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  name: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

const Session = models.Session || model("Session", SessionSchema);

export default Session;