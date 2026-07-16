import { z } from 'zod';

export const BookingSchema = z.object({
  facility_id: z.number(),
  court_name: z.string(),
  date: z.string(),
  time: z.string(),
  duration: z.string(),
  price: z.number(),
});

export type BookingPayload = z.infer<typeof BookingSchema>;
