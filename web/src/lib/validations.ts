import { z } from 'zod';

export const BookingSchema = z.object({
  facility_id: z.number().int().positive("Invalid facility ID"),
  court_name: z.string().min(1, "Court name is required").max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  time: z.string().min(1, "Time is required"),
  duration: z.string().min(1, "Duration is required"),
  price: z.number().min(0, "Price cannot be negative"),
});

export type BookingPayload = z.infer<typeof BookingSchema>;
