import { z } from 'zod';

export const BookingSchema = z.object({
  court_id: z.string().uuid("Invalid court ID"),
  start_time: z.string().datetime("Invalid start time"),
  end_time: z.string().datetime("Invalid end time"),
  total_amount: z.number().positive("Amount must be greater than 0"),
}).refine(data => new Date(data.start_time) < new Date(data.end_time), {
  message: "End time must be after start time",
  path: ["end_time"]
});

export type BookingPayload = z.infer<typeof BookingSchema>;
