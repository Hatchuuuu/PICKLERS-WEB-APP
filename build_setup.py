import os
import glob

def build_setup_all():
    migration_dir = "web/supabase/migrations"
    setup_file = "web/supabase/setup_all.sql"
    
    # Get all migration files sorted by name
    migration_files = sorted(glob.glob(os.path.join(migration_dir, "*.sql")))
    
    header = """-- =============================================================
-- PICKLERS WEB APP — COMPLETE DATABASE SETUP
-- Copy & paste this entire file into the Supabase SQL Editor
-- =============================================================


-- =====================================================================
-- STEP 1: SAFETY — DROP EVERYTHING IN CORRECT DEPENDENCY ORDER
-- =====================================================================
DROP TABLE IF EXISTS public.booking_requests CASCADE;
DROP TABLE IF EXISTS public.tournament_matches CASCADE;
DROP TABLE IF EXISTS public.tournament_teams CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.player_profiles CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.courts CASCADE;
DROP TABLE IF EXISTS public.facilities CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;
DROP TABLE IF EXISTS public.match_games CASCADE;
DROP TABLE IF EXISTS public.facility_applications CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.search_tournaments(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.search_facilities(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.delete_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_tournament_games(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.submit_match_score(uuid, jsonb, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.increment_wallet_balance(INTEGER, UUID) CASCADE;

-- =====================================================================
-- STEP 2: EXTENSIONS
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

"""

    with open(setup_file, "w", encoding="utf-8") as f:
        f.write(header)
        for i, mf in enumerate(migration_files):
            f.write(f"\n-- {'='*69}\n")
            f.write(f"-- MIGRATION: {os.path.basename(mf)}\n")
            f.write(f"-- {'='*69}\n")
            with open(mf, "r", encoding="utf-8") as inf:
                f.write(inf.read())
            f.write("\n")

    print(f"Successfully wrote {len(migration_files)} migrations to {setup_file}")

if __name__ == "__main__":
    build_setup_all()
