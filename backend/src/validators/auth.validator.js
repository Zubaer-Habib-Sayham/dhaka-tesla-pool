import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(100),
  role: z.enum(["PASSENGER", "DRIVER"]).default("PASSENGER"),
  teslaName: z.string().trim().min(1).max(100).optional(),
  capacity: z.coerce.number().int().min(1).max(3).optional(),
}).superRefine((data, context) => {
  if (data.role === "DRIVER") {
    if (!data.teslaName) context.addIssue({ code: "custom", path: ["teslaName"], message: "Enter your rickshaw name." });
    if (!data.capacity) context.addIssue({ code: "custom", path: ["capacity"], message: "Choose a seat capacity from 1 to 3." });
  }
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(100),
});
