-- Dorika core schema
-- Postgres + PostGIS, designed to stay portable across managed or self-hosted Postgres.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  legal_name TEXT,
  primary_color TEXT DEFAULT '#22A98A',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  kind TEXT NOT NULL DEFAULT 'image' CHECK (kind IN ('image', 'video', 'document')),
  width INTEGER,
  height INTEGER,
  storage_provider TEXT NOT NULL DEFAULT 'vercel_blob',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE dorika_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('business', 'place', 'route', 'product')),
  accent_color TEXT NOT NULL DEFAULT '#22A98A',
  icon_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE dorika_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  category_id UUID REFERENCES dorika_categories(id) ON DELETE SET NULL,
  cover_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT,
  city TEXT NOT NULL DEFAULT 'Ocaña',
  region TEXT,
  address TEXT,
  location_label TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  geo GEOGRAPHY(Point, 4326),
  map_x NUMERIC(5, 2) DEFAULT 50,
  map_y NUMERIC(5, 2) DEFAULT 50,
  best_time TEXT,
  visit_tip TEXT,
  estimated_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'hidden')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX dorika_places_status_idx ON dorika_places(status);
CREATE INDEX dorika_places_category_idx ON dorika_places(category_id);
CREATE INDEX dorika_places_geo_idx ON dorika_places USING GIST (geo);

CREATE TABLE dorika_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  category_id UUID REFERENCES dorika_categories(id) ON DELETE SET NULL,
  cover_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'dorika' CHECK (source IN ('dorika', 'klicor')),
  external_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  city TEXT NOT NULL DEFAULT 'Ocaña',
  address TEXT,
  location_label TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  geo GEOGRAPHY(Point, 4326),
  public_url TEXT,
  whatsapp_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'review', 'published', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

CREATE INDEX dorika_businesses_status_idx ON dorika_businesses(status);
CREATE INDEX dorika_businesses_geo_idx ON dorika_businesses USING GIST (geo);

CREATE TABLE dorika_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES dorika_businesses(id) ON DELETE CASCADE,
  cover_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'dorika' CHECK (source IN ('dorika', 'klicor')),
  external_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'COP',
  public_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'review', 'published', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

CREATE INDEX dorika_products_business_idx ON dorika_products(business_id);
CREATE INDEX dorika_products_status_idx ON dorika_products(status);

CREATE TABLE dorika_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES dorika_categories(id) ON DELETE SET NULL,
  cover_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  emotional_summary TEXT,
  description TEXT,
  city TEXT NOT NULL DEFAULT 'Ocaña',
  duration_label TEXT,
  estimated_minutes INTEGER,
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  route_type TEXT NOT NULL DEFAULT 'walk' CHECK (route_type IN ('walk', 'bike', 'car', 'mixed')),
  badge_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'hidden')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX dorika_routes_status_idx ON dorika_routes(status);
CREATE INDEX dorika_routes_category_idx ON dorika_routes(category_id);

CREATE TABLE dorika_route_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES dorika_routes(id) ON DELETE CASCADE,
  place_id UUID REFERENCES dorika_places(id) ON DELETE SET NULL,
  cover_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  category_label TEXT,
  short_description TEXT,
  description TEXT,
  location_label TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  geo GEOGRAPHY(Point, 4326),
  map_x NUMERIC(5, 2) DEFAULT 50,
  map_y NUMERIC(5, 2) DEFAULT 50,
  estimated_minutes INTEGER,
  visit_tip TEXT,
  best_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX dorika_route_points_route_idx ON dorika_route_points(route_id, sort_order);
CREATE INDEX dorika_route_points_geo_idx ON dorika_route_points USING GIST (geo);

CREATE TABLE dorika_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_key TEXT UNIQUE,
  email TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE dorika_route_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES dorika_visitors(id) ON DELETE CASCADE,
  anonymous_key TEXT,
  route_id UUID NOT NULL REFERENCES dorika_routes(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (visitor_id, route_id),
  UNIQUE (anonymous_key, route_id)
);

CREATE INDEX dorika_route_progress_route_idx ON dorika_route_progress(route_id);

CREATE TABLE dorika_route_point_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_id UUID NOT NULL REFERENCES dorika_route_progress(id) ON DELETE CASCADE,
  route_point_id UUID NOT NULL REFERENCES dorika_route_points(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'visited')),
  visited_at TIMESTAMPTZ,
  UNIQUE (progress_id, route_point_id)
);

CREATE TABLE dorika_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES dorika_visitors(id) ON DELETE CASCADE,
  anonymous_key TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('route', 'place', 'business', 'product')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX dorika_favorites_visitor_idx ON dorika_favorites(visitor_id);
CREATE INDEX dorika_favorites_anonymous_idx ON dorika_favorites(anonymous_key);

CREATE TABLE dorika_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon_key TEXT,
  accent_color TEXT NOT NULL DEFAULT '#22A98A',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE dorika_visitor_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES dorika_visitors(id) ON DELETE CASCADE,
  anonymous_key TEXT,
  badge_id UUID NOT NULL REFERENCES dorika_badges(id) ON DELETE CASCADE,
  route_id UUID REFERENCES dorika_routes(id) ON DELETE SET NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (visitor_id, badge_id, route_id),
  UNIQUE (anonymous_key, badge_id, route_id)
);

INSERT INTO dorika_categories (slug, name, kind, accent_color, icon_key, sort_order)
VALUES
  ('historicas', 'Históricas', 'route', '#E07A5F', 'landmark', 10),
  ('religiosas', 'Religiosas', 'route', '#C99A2E', 'church', 20),
  ('ecologicas', 'Ecológicas', 'route', '#22A98A', 'leaf', 30),
  ('restaurantes', 'Restaurantes', 'business', '#F4A261', 'utensils', 40),
  ('tiendas', 'Tiendas', 'business', '#A8A29E', 'shopping-bag', 50),
  ('hoteles', 'Hoteles', 'business', '#8AB6D6', 'bed', 60)
ON CONFLICT (slug) DO NOTHING;
