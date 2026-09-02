-- CreateTable
CREATE TABLE IF NOT EXISTS "Coupon" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "discount_percent" INTEGER,
    "discount_flat" DECIMAL(65,30),
    "min_order_value" DECIMAL(65,30) DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "usage_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");
