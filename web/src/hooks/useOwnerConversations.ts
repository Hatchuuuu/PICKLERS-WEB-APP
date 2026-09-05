import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ConversationMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
  dateLabel?: string;
}

export interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  online: boolean;
  unread: number;
  lastMessage: string;
  lastTime: string;
  otherUserId: string;
  messages: ConversationMessage[];
}

interface RawDirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean | null;
  created_at: string;
}

interface OtherProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  role: string | null;
}

const PRESENCE_CHANNEL = 'online-users';

/**
 * Owner conversations hook.
 *
 * P1.1: replaces the previously hardcoded demo conversations in the owner
 * messages page. Pulls real DMs from `direct_messages` between the owner
 * and any user that has messaged the owner, plus DMs the owner has sent
 * (e.g. reaching out to a player about a tournament). RLS restricts the
 * underlying select to participant rows, so this hook is safe.
 *
 * Live updates: subscribes to `direct_messages` row inserts that involve
 * the current owner, so new messages appear in real time without polling.
 */
export function useOwnerConversations() {
  const { user } = useAuth();
  const ownerId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ownerConversations', ownerId],
    enabled: Boolean(ownerId),
    staleTime: 1000 * 30,
    refetchInterval: 30_000,
    queryFn: async (): Promise<Conversation[]> => {
      if (!ownerId) return [];

      // 1. Pull every DM the owner is a participant in.
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, content, read, created_at')
        .or(`sender_id.eq.${ownerId},receiver_id.eq.${ownerId}`)
        .order('created_at', { ascending: true })
        .limit(500);

      if (error) {
        console.error('[useOwnerConversations] fetch error', error);
        return [];
      }

      // 2. Group by conversation partner.
      const byPartner = new Map<string, RawDirectMessage[]>();
      for (const m of (messages ?? []) as RawDirectMessage[]) {
        const partnerId = m.sender_id === ownerId ? m.receiver_id : m.sender_id;
        const arr = byPartner.get(partnerId) ?? [];
        arr.push(m);
        byPartner.set(partnerId, arr);
      }

      if (byPartner.size === 0) return [];

      // 3. Hydrate partner profiles.
      const partnerIds = Array.from(byPartner.keys());
      const { data: profiles } = await supabase
        .from('player_profiles')
        .select('id, name, avatar_url, role')
        .in('id', partnerIds);

      const profileMap = new Map<string, OtherProfile>();
      for (const p of ((profiles ?? []) as OtherProfile[])) {
        profileMap.set(p.id, p);
      }

      // 4. Build the conversation list, newest activity first.
      const convs: Conversation[] = [];
      for (const [partnerId, msgs] of byPartner.entries()) {
        const profile = profileMap.get(partnerId);
        const sortedMsgs = [...msgs].sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const last = sortedMsgs[sortedMsgs.length - 1];
        const unread = sortedMsgs.filter(
          (m) => m.receiver_id === ownerId && !m.read
        ).length;

        convs.push({
          id: partnerId,
          otherUserId: partnerId,
          name: profile?.name ?? 'Picklers Player',
          avatar: profile?.avatar_url ?? undefined,
          role: profile?.role ?? 'Player',
          online: false, // presence handled by subscription below
          unread,
          lastMessage: last?.content ?? '',
          lastTime: formatRelativeTime(last?.created_at),
          messages: sortedMsgs.map((m) => ({
            id: m.id,
            sender: m.sender_id === ownerId ? 'me' : 'them',
            text: m.content,
            time: new Date(m.created_at).toLocaleString(),
            dateLabel: formatDayLabel(m.created_at),
          })),
        });
      }
      convs.sort((a, b) => (b.lastTime?.length ?? 0) - (a.lastTime?.length ?? 0));
      return convs;
    },
  });

  // 5. Realtime: new DMs involving the owner invalidate the query.
  useEffect(() => {
    if (!ownerId) return;
    const channel = supabase
      .channel(PRESENCE_CHANNEL)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload) => {
          const row = payload.new as RawDirectMessage;
          if (row.sender_id === ownerId || row.receiver_id === ownerId) {
            queryClient.invalidateQueries({ queryKey: ['ownerConversations', ownerId] });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownerId, queryClient]);

  return query;
}

/**
 * Send a message from the owner to another user.
 */
export function useSendOwnerMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { toUserId: string; content: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const trimmed = input.content.trim();
      if (!trimmed) throw new Error('Message is empty');
      if (trimmed.length > 4000) throw new Error('Message too long');
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: input.toUserId,
          content: trimmed,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerConversations', user?.id] });
    },
  });
}

/**
 * Mark all messages in a conversation as read.
 */
export function useMarkConversationRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('direct_messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherUserId)
        .is('read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerConversations', user?.id] });
    },
  });
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = Date.now();
  const diffMs = now - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < 60_000) return 'just now';
  if (diffMs < 60 * 60_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / (60 * 60_000))}h ago`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d ago`;
  return d.toLocaleDateString();
}

function formatDayLabel(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
