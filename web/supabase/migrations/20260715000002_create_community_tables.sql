    -- Migration: 20260715000002_create_community_tables.sql
    -- Description: Creates the notifications and player_profiles tables with RLS policies.

    CREATE TABLE IF NOT EXISTS public.player_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        level TEXT DEFAULT '2.5',
        gold_medals INTEGER DEFAULT 0,
        silver_medals INTEGER DEFAULT 0,
        bronze_medals INTEGER DEFAULT 0,
        online BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Profiles are viewable by everyone" ON public.player_profiles
        FOR SELECT USING (true);

    CREATE POLICY "Users can insert their own profile" ON public.player_profiles
        FOR INSERT WITH CHECK (auth.uid() = id);

    CREATE POLICY "Users can update own profile" ON public.player_profiles
        FOR UPDATE USING (auth.uid() = id);

    -- Notifications Table
    CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('booking', 'community', 'system')),
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view own notifications" ON public.notifications
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can update own notifications" ON public.notifications
        FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "System can insert notifications for users" ON public.notifications
        FOR INSERT WITH CHECK (true); -- Usually restricted to authenticated trigger or admin service key

    -- Function to handle new user signup
    CREATE OR REPLACE FUNCTION public.handle_new_user() 
    RETURNS TRIGGER AS $$
    BEGIN
    INSERT INTO public.player_profiles (id, name, level)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        '2.5'
    );
    RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Trigger to automatically create a profile for new users
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
