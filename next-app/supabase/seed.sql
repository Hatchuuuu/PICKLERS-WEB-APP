-- Seed initial profiles
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'owner@picklers.com'),
  ('00000000-0000-0000-0000-000000000002', 'player@picklers.com')
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test Owner', 'owner'),
  ('00000000-0000-0000-0000-000000000002', 'Test Player', 'player')
ON CONFLICT DO NOTHING;

-- Seed initial facilities
INSERT INTO public.facilities (id, owner_id, name, location, type, rating, base_price, operating_hours, image_url) VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'SM Southmall Picklepark', 'Las Piñas City', 'Indoor', 4.9, 500, '6am – 10pm', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&h=400&fit=crop&auto=format'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 'BGC Pickleball Hub', 'Bonifacio Global City, Taguig', 'Outdoor', 4.8, 400, '5am – 11pm', 'https://images.unsplash.com/photo-1622279486466-1e9b7c60d7c1?w=600&h=400&fit=crop&auto=format'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Ayala Center Cebu Courts', 'Cebu City, Cebu', 'Indoor/Outdoor', 4.7, 350, '7am – 9pm', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop&auto=format'),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000002', 'Robinsons Dumaguete Sports', 'Dumaguete City', 'Indoor', 4.6, 300, '8am – 8pm', 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&h=400&fit=crop&auto=format')
ON CONFLICT DO NOTHING;
