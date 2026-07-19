-- =============================================
-- COMMUNITY TABLES MIGRATION
-- Created: 2026-07-19
-- =============================================

-- -----------------------------------------------
-- 1. CLUBS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS clubs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  banner_url  text,
  admin_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  member_count int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Anyone can read clubs
CREATE POLICY "clubs_select_all" ON clubs
  FOR SELECT USING (true);

-- Only authenticated users can create clubs
CREATE POLICY "clubs_insert_auth" ON clubs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only the club admin can update/delete
CREATE POLICY "clubs_update_admin" ON clubs
  FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY "clubs_delete_admin" ON clubs
  FOR DELETE USING (auth.uid() = admin_id);

-- -----------------------------------------------
-- 2. CLUB MEMBERS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS club_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id    uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'member', 'admin')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

-- Anyone can read memberships (to show member counts, etc)
CREATE POLICY "club_members_select_all" ON club_members
  FOR SELECT USING (true);

-- Authenticated users can insert their own membership row
CREATE POLICY "club_members_insert_self" ON club_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Club admins can update membership status (accept/reject)
CREATE POLICY "club_members_update_admin" ON club_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'admin'
    )
  );

-- Users can delete their own membership (leave club), admins can remove members
CREATE POLICY "club_members_delete" ON club_members
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'admin'
    )
  );

-- Trigger to keep member_count accurate on clubs
CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'member' THEN
    UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status <> 'member' AND NEW.status = 'member' THEN
      UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
    ELSIF OLD.status = 'member' AND NEW.status <> 'member' THEN
      UPDATE clubs SET member_count = GREATEST(0, member_count - 1) WHERE id = NEW.club_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'member' THEN
    UPDATE clubs SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.club_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_club_member_count ON club_members;
CREATE TRIGGER trg_club_member_count
  AFTER INSERT OR UPDATE OR DELETE ON club_members
  FOR EACH ROW EXECUTE FUNCTION update_club_member_count();

-- -----------------------------------------------
-- 3. DIRECT MESSAGES
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS direct_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text NOT NULL,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can only read messages where they are the sender or receiver
CREATE POLICY "dm_select_participants" ON direct_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Users can only send messages as themselves
CREATE POLICY "dm_insert_sender" ON direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can mark messages as read if they are the receiver
CREATE POLICY "dm_update_receiver" ON direct_messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- -----------------------------------------------
-- 4. PLAYER LIKES
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS player_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (liker_id, liked_id)
);

ALTER TABLE player_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can see likes (for like counts)
CREATE POLICY "player_likes_select_all" ON player_likes
  FOR SELECT USING (true);

-- Users can only insert their own likes
CREATE POLICY "player_likes_insert_self" ON player_likes
  FOR INSERT WITH CHECK (auth.uid() = liker_id);

-- Users can only delete their own likes
CREATE POLICY "player_likes_delete_self" ON player_likes
  FOR DELETE USING (auth.uid() = liker_id);

-- Enable realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
