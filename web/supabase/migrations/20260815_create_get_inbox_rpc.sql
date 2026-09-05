-- =====================================================================
-- Migration: Create get_inbox RPC function (20260815)
-- Performs efficient in-database aggregation of conversation partners,
-- latest message, and unread counts for direct messaging inbox.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_inbox(p_user_id uuid)
RETURNS TABLE (
  user_id         uuid,
  name            text,
  avatar_url      text,
  level           text,
  online          boolean,
  last_message    text,
  last_at         timestamptz,
  unread_count    bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH conv_partners AS (
    SELECT DISTINCT
      CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END AS partner_id
    FROM public.direct_messages
    WHERE sender_id = p_user_id OR receiver_id = p_user_id
  ),
  latest_messages AS (
    SELECT DISTINCT ON (cp.partner_id)
      cp.partner_id,
      dm.content AS last_message,
      dm.created_at AS last_at
    FROM conv_partners cp
    CROSS JOIN LATERAL (
      SELECT content, created_at
      FROM public.direct_messages
      WHERE (sender_id = p_user_id AND receiver_id = cp.partner_id)
         OR (sender_id = cp.partner_id AND receiver_id = p_user_id)
      ORDER BY created_at DESC
      LIMIT 1
    ) dm
    ORDER BY cp.partner_id, dm.created_at DESC
  ),
  unreads AS (
    SELECT
      sender_id AS partner_id,
      COUNT(*)::bigint AS unread_count
    FROM public.direct_messages
    WHERE receiver_id = p_user_id AND read = false
    GROUP BY sender_id
  )
  SELECT
    pp.id AS user_id,
    COALESCE(pp.name, 'Unknown Player')::text AS name,
    pp.avatar_url::text AS avatar_url,
    COALESCE(pp.level, '2.5')::text AS level,
    COALESCE(pp.online, false) AS online,
    COALESCE(lm.last_message, '')::text AS last_message,
    lm.last_at,
    COALESCE(u.unread_count, 0)::bigint AS unread_count
  FROM latest_messages lm
  JOIN public.player_profiles pp ON pp.id = lm.partner_id
  LEFT JOIN unreads u ON u.partner_id = lm.partner_id
  ORDER BY lm.last_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
