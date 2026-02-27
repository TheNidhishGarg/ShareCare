-- Enable PostGIS (must come before any geography column definitions)
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "UserMode" AS ENUM ('receiver', 'donor');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('new_item', 'like_new', 'good', 'fair');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('active', 'reserved', 'completed', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "PickupMode" AS ENUM ('self_pickup', 'doorstep', 'both');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'accepted', 'otp_sent', 'completed', 'cancelled', 'rejected');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('awaiting_pickup', 'picked_up', 'in_transit', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('delivery_charge', 'sponsored_listing', 'advertisement');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'paid', 'refunded', 'failed');

-- CreateEnum
CREATE TYPE "SponsoredEntityType" AS ENUM ('ngo', 'listing', 'advertisement');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('auth', 'pickup_verify', 'delivery_verify');

-- CreateEnum
CREATE TYPE "AiTriggerType" AS ENUM ('seasonal', 'spike', 'shortage');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone" VARCHAR(15),
    "email" VARCHAR(255),
    "name" VARCHAR(255),
    "profile_photo" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "role" VARCHAR(20) NOT NULL DEFAULT 'user',
    "default_mode" "UserMode" NOT NULL DEFAULT 'receiver',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "label" VARCHAR(100),
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "pincode" VARCHAR(10),
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "location" geography(Point,4326),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "icon_url" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "donor_id" UUID NOT NULL,
    "category_id" UUID,
    "title" VARCHAR(255),
    "description" TEXT,
    "condition" "ItemCondition" NOT NULL DEFAULT 'good',
    "image_urls" TEXT[],
    "status" "ListingStatus" NOT NULL DEFAULT 'active',
    "pickup_mode" "PickupMode" NOT NULL DEFAULT 'both',
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "location" geography(Point,4326),
    "address_display" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "is_sponsored" BOOLEAN NOT NULL DEFAULT false,
    "sponsored_until" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "donor_id" UUID NOT NULL,
    "delivery_mode" "PickupMode" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "receiver_otp" VARCHAR(255),
    "otp_expires_at" TIMESTAMP(3),
    "otp_verified_at" TIMESTAMP(3),
    "delivery_otp" VARCHAR(255),
    "delivery_otp_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "request_id" UUID NOT NULL,
    "receiver_address_id" UUID,
    "delivery_address" JSONB,
    "logistics_partner" VARCHAR(100),
    "logistics_order_id" VARCHAR(255),
    "qr_code_token" VARCHAR(255),
    "qr_scanned_at" TIMESTAMP(3),
    "pickup_confirmed_at" TIMESTAMP(3),
    "dispatched_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "delivery_charge_partner" DECIMAL(10,2),
    "delivery_charge_user" DECIMAL(10,2),
    "platform_margin" DECIMAL(10,2),
    "status" "DeliveryStatus" NOT NULL DEFAULT 'awaiting_pickup',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "request_id" UUID,
    "delivery_id" UUID,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(5) NOT NULL DEFAULT 'INR',
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "payment_gateway" VARCHAR(100),
    "gateway_txn_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_demand_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "region_key" VARCHAR(100) NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "listing_count" INTEGER NOT NULL DEFAULT 0,
    "demand_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "snapshot_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_demand_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_suggestions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "region_key" VARCHAR(100) NOT NULL,
    "message" TEXT,
    "trigger_type" "AiTriggerType" NOT NULL,
    "valid_from" DATE,
    "valid_until" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsored_slots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" "SponsoredEntityType" NOT NULL,
    "entity_id" UUID,
    "entity_name" VARCHAR(255),
    "logo_url" TEXT,
    "link_url" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "region_key" VARCHAR(100),
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "amount_paid" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sponsored_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" VARCHAR(100),
    "title" VARCHAR(255),
    "body" TEXT,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "phone" VARCHAR(15),
    "otp_hash" VARCHAR(255) NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_qr_code_token_key" ON "deliveries"("qr_code_token");

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_receiver_address_id_fkey" FOREIGN KEY ("receiver_address_id") REFERENCES "user_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_demand_snapshots" ADD CONSTRAINT "ai_demand_snapshots_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_logs" ADD CONSTRAINT "otp_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- PostGIS spatial indexes
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings USING GIST(location);
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
