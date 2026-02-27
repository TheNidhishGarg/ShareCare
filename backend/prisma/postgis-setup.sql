-- PostGIS Setup Script
-- Run this AFTER "npx prisma migrate dev" to add spatial columns, indexes, and triggers.
-- Usage: node prisma/run-postgis-setup.js

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add location column to listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'location'
  ) THEN
    ALTER TABLE listings ADD COLUMN location geography(POINT, 4326);
  END IF;
END $$;

-- Add location column to user_addresses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_addresses' AND column_name = 'location'
  ) THEN
    ALTER TABLE user_addresses ADD COLUMN location geography(POINT, 4326);
  END IF;
END $$;

-- Spatial index on listings
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings USING GIST(location);

-- Spatial index on user_addresses
CREATE INDEX IF NOT EXISTS idx_user_addresses_location ON user_addresses USING GIST(location);

-- Trigger to auto-populate location on listings
CREATE OR REPLACE FUNCTION update_listing_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude::float, NEW.latitude::float), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_listings_location ON listings;
CREATE TRIGGER trg_listings_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_location();

-- Trigger to auto-populate location on user_addresses
CREATE OR REPLACE FUNCTION update_address_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude::float, NEW.latitude::float), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_address_location ON user_addresses;
CREATE TRIGGER trg_address_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_address_location();
