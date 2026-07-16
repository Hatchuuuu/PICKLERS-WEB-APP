import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


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
          id, name, surface, price, status, occupied_by, occupied_until,
          facilities(name)
        `);

      if (error) {
        console.error("Supabase fetch failed", error);
        return []; 
      }

      if (data && data.length > 0) {
        // Map Supabase data to LiveCourt format
        return data.map((d: Record<string, unknown>) => {
          let remaining = 0;
          if (d.occupied_until) {
            const end = new Date(String(d.occupied_until)).getTime();
            remaining = Math.max(0, Math.floor((end - Date.now()) / 60000));
          }
          if (remaining === 0 && d.status === "occupied") {
            // If time is up but still occupied, we might want to flag it or just show 0
          }
          return {
            id: Number(d.id),
            name: String(d.name),
            status: String(d.status || "available"),
            player: d.occupied_by ? String(d.occupied_by) : null,
            remaining,
            maxTime: 60
          };
        });
      }

      return [];
    },
    staleTime: 1000 * 60, // 1 minute stale time
    initialData: [], 
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
        throw new Error(parsed.error.issues[0].message);
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
          facility_id: parsed.data.facility_id,
          court_name: parsed.data.court_name,
          date: parsed.data.date,
          time: parsed.data.time,
          duration: parsed.data.duration,
          price: parsed.data.price,
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
    mutationFn: async (courtUpdates: { id: string | number, status: string, player?: string, remaining?: number }) => {
      const { error } = await supabase
        .from('courts')
        .update({ 
          status: courtUpdates.status, 
          occupied_by: courtUpdates.player || null, 
          occupied_until: courtUpdates.remaining ? new Date(Date.now() + courtUpdates.remaining * 60000).toISOString() : null 
        })
        .eq('id', courtUpdates.id);
      if (error) throw error;
      return courtUpdates;
    },
    onMutate: async (newCourt) => {
      await queryClient.cancelQueries({ queryKey: ['liveCourts'] });
      const prevCourts = queryClient.getQueryData(['liveCourts']);

      // Optimistically patch
      queryClient.setQueryData<typeof newCourt[]>(['liveCourts'], (old) =>
        old ? old.map((c: typeof newCourt) => c.id === newCourt.id ? { ...c, ...newCourt } : c) : []
      );

      return { prevCourts };
    },
    onError: (_err, _newCourt, context) => {
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
      const { data, error } = await supabase.from('booking_requests').select('*');
      if (error) {
        console.error("Fetch booking_requests failed", error);
        return [];
      }
      return data || [];
    },
    initialData: [],
  });
}

export function useResolveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('booking_requests').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['bookingRequests'] });
      const prevReqs = queryClient.getQueryData<Record<string, unknown>[]>(['bookingRequests']);
      queryClient.setQueryData<Record<string, unknown>[]>(['bookingRequests'], (old) =>
        old ? old.filter((r: Record<string, unknown>) => r.id !== id) : []
      );
      return { prevReqs };
    },
    onError: (_err, _id, context) => {
      if (context?.prevReqs) {
        queryClient.setQueryData(['bookingRequests'], context.prevReqs);
      }
    }
  });
}
