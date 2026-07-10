import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LIVE_COURTS, BOOKING_REQUESTS, BOOKINGS } from '@/data/mockData';

// Simulated API latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

import { supabase } from '@/lib/supabase';
import { BookingSchema, BookingPayload } from '@/lib/validations';

// --- Live Courts Queries & Mutations ---

export function useLiveCourts() {
  return useQuery({
    queryKey: ['liveCourts'],
    queryFn: async () => {
      // First try to fetch from Supabase
      const { data, error } = await supabase
        .from('courts')
        .select(`
          id, name, surface, hourly_rate,
          facilities(name)
        `);

      if (error) {
        console.error("Supabase fetch failed, falling back to mock data:", error);
        return [...LIVE_COURTS]; // Fallback to mock data if DB is empty or fails
      }
      
      // If we have data from Supabase, return it. If empty, maybe fallback to mock for now so the UI doesn't look broken.
      if (data && data.length > 0) {
        return data;
      }
      
      return [...LIVE_COURTS];
    },
    staleTime: 1000 * 60, // 1 minute stale time
    initialData: [...LIVE_COURTS], // Seed with mock data immediately for smooth initial render
  });
}

/**
 * SECURE BOOKING MUTATION
 */
export function useBookCourt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BookingPayload) => {
      // 1. Client-Side Validation Defense
      const parsed = BookingSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(parsed.error.errors[0].message);
      }

      // 2. Fetch Active Session
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        throw new Error("You must be logged in to book a court.");
      }

      // 3. Direct Secure Database Insert
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: session.user.id,
          court_id: parsed.data.court_id,
          start_time: parsed.data.start_time,
          end_time: parsed.data.end_time,
          total_amount: parsed.data.total_amount,
        })
        .select('id')
        .single();

      // 4. Graceful Race-Condition Error Handling
      if (error) {
        if (error.code === '23P01') { // Postgres EXCLUDE USING gist violation
          throw new Error("This court was just booked by someone else! Please select another time.");
        }
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      // Instantly refresh the UI state for courts
      queryClient.invalidateQueries({ queryKey: ['liveCourts'] });
    }
  });
}

export function useUpdateCourt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (courtUpdates: any) => {
      await delay(500); // simulate latency
      // Actually mutate the mock backend so refetches persist the state
      const idx = LIVE_COURTS.findIndex(c => c.id === courtUpdates.id);
      if (idx !== -1) {
        LIVE_COURTS[idx] = { ...LIVE_COURTS[idx], ...courtUpdates };
      }
      return courtUpdates;
    },
    onMutate: async (newCourt) => {
      await queryClient.cancelQueries({ queryKey: ['liveCourts'] });
      const prevCourts = queryClient.getQueryData(['liveCourts']);
      
      // Optimistically patch
      queryClient.setQueryData(['liveCourts'], (old: any) => 
        old.map((c: any) => c.id === newCourt.id ? { ...c, ...newCourt } : c)
      );
      
      return { prevCourts };
    },
    onError: (err, newCourt, context) => {
      if (context?.prevCourts) {
        queryClient.setQueryData(['liveCourts'], context.prevCourts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['liveCourts'] });
    }
  });
}

// --- Requests Queries & Mutations ---

export function useBookingRequests() {
  return useQuery({
    queryKey: ['bookingRequests'],
    queryFn: async () => {
      await delay(800);
      return [...BOOKING_REQUESTS];
    },
    initialData: [...BOOKING_REQUESTS],
  });
}

export function useResolveRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await delay(400);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['bookingRequests'] });
      const prevReqs = queryClient.getQueryData(['bookingRequests']);
      queryClient.setQueryData(['bookingRequests'], (old: any) => 
        old.filter((r: any) => r.id !== id)
      );
      return { prevReqs };
    },
    onError: (err, id, context) => {
      if (context?.prevReqs) {
        queryClient.setQueryData(['bookingRequests'], context.prevReqs);
      }
    }
  });
}
