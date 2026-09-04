-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "reset_otp" TEXT,
    "reset_otp_expiry" TIMESTAMP(3),
    "last_login" TIMESTAMP(3),
    "last_active_at" TIMESTAMP(3),
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category_id" INTEGER,
    "sub_category" TEXT,
    "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "size_stock" JSONB DEFAULT '{}',
    "low_stock_alert" INTEGER NOT NULL DEFAULT 2,
    "whatsapp_inquiry" BOOLEAN NOT NULL DEFAULT false,
    "mrp_price" DECIMAL(65,30),
    "discount_percent" INTEGER,
    "is_on_sale" BOOLEAN NOT NULL DEFAULT false,
    "promo_label" TEXT,
    "fabric" TEXT,
    "embroidery" TEXT,
    "wash_care" TEXT,
    "fit_notes" TEXT,
    "dispatch_info" TEXT,
    "highlights" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProductVariant" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "size" TEXT NOT NULL,
    "color" TEXT DEFAULT 'Default',
    "price" DECIMAL(65,30) NOT NULL,
    "mrp_price" DECIMAL(65,30),
    "cost_price" DECIMAL(65,30) DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reserved_stock" INTEGER NOT NULL DEFAULT 0,
    "low_stock_alert" INTEGER NOT NULL DEFAULT 2,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "InventoryMovement" (
    "id" SERIAL NOT NULL,
    "variant_id" INTEGER,
    "product_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stock_before" INTEGER NOT NULL,
    "stock_after" INTEGER NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "note" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CartItem" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "variant_id" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "size" TEXT,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Order" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "cancel_reason" TEXT,
    "payment_id" TEXT,
    "razorpay_order_id" TEXT,
    "shipping_name" TEXT,
    "shipping_phone" TEXT,
    "shipping_address" TEXT,
    "shipping_city" TEXT,
    "shipping_state" TEXT,
    "shipping_pincode" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "variant_id" INTEGER,
    "sku_snapshot" TEXT,
    "quantity" INTEGER NOT NULL,
    "size" TEXT,
    "price_at_purchase" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER,
    "sale_id" INTEGER,
    "gateway" TEXT NOT NULL,
    "gateway_order_id" TEXT,
    "gateway_payment_id" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Sale" (
    "id" SERIAL NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "staff_id" INTEGER,
    "staff_name" TEXT DEFAULT 'Store Staff',
    "customer_id" INTEGER,
    "customer_name" TEXT DEFAULT 'Walk-in Customer',
    "customer_phone" TEXT,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'cash',
    "amount_received" DECIMAL(65,30),
    "change_amount" DECIMAL(65,30) DEFAULT 0,
    "payment_ref" TEXT,
    "payment_reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SaleItem" (
    "id" SERIAL NOT NULL,
    "sale_id" INTEGER NOT NULL,
    "variant_id" INTEGER,
    "product_id" INTEGER NOT NULL,
    "product_name" TEXT,
    "product_name_snapshot" TEXT,
    "sku_snapshot" TEXT,
    "size" TEXT DEFAULT 'M',
    "size_snapshot" TEXT,
    "color_snapshot" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price_at_sale" DECIMAL(65,30) NOT NULL,
    "total_price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReturnRequest" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER,
    "sale_id" INTEGER,
    "variant_id" INTEGER,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RETURN',
    "exchange_variant_id" INTEGER,
    "exchange_quantity" INTEGER,
    "condition" TEXT DEFAULT 'RESTOCKABLE',
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "customer_email" TEXT,
    "price_difference" DECIMAL(65,30) DEFAULT 0,
    "refund_amount" DECIMAL(65,30) DEFAULT 0,
    "refund_status" TEXT DEFAULT 'PENDING',
    "staff_notes" TEXT,
    "created_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "inventory_restored" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "InvoiceCounter" (
    "id" SERIAL NOT NULL,
    "prefix" TEXT NOT NULL,
    "current_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Address" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "line1" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "phone" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Wishlist" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE IF NOT EXISTS "Review" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "product_id" INTEGER NOT NULL,
    "customer_name" TEXT DEFAULT 'Verified Customer',
    "customer_city" TEXT,
    "title" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "occasion" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StockNotification" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "email" TEXT NOT NULL,
    "product_id" INTEGER NOT NULL,
    "size" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "gstin" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Purchase" (
    "id" SERIAL NOT NULL,
    "purchase_number" TEXT NOT NULL,
    "supplier_id" INTEGER,
    "invoice_number" TEXT,
    "purchase_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PurchaseItem" (
    "id" SERIAL NOT NULL,
    "purchase_id" INTEGER NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cost_price" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
    "id" SERIAL NOT NULL,
    "actor_id" INTEGER,
    "actor_email" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "InventoryReservation" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "session_id" TEXT,
    "razorpay_order_id" TEXT NOT NULL,
    "coupon_code" TEXT,
    "items" JSONB NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StoreSettings" (
    "id" SERIAL NOT NULL,
    "store_online" BOOLEAN NOT NULL DEFAULT true,
    "online_payments" BOOLEAN NOT NULL DEFAULT true,
    "cod_enabled" BOOLEAN NOT NULL DEFAULT true,
    "new_orders_enabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsapp_number" TEXT NOT NULL DEFAULT '+919271218156',
    "support_phone" TEXT NOT NULL DEFAULT '+919271218156',
    "support_email" TEXT NOT NULL DEFAULT 'mirayaofficial.in@gmail.com',
    "atelier_address" TEXT NOT NULL DEFAULT 'Shop no. UG/5, Jagat Plaza, Mouze Pandharabodi, Law College Square, Amravati Rd, Nagpur, Maharashtra 440033',
    "instagram_url" TEXT NOT NULL DEFAULT 'https://www.instagram.com/miraya_official.in/',
    "facebook_url" TEXT NOT NULL DEFAULT 'https://www.facebook.com/profile.php?id=61591287333326',
    "google_review_url" TEXT DEFAULT 'https://g.page/r/miraya-nagpur',
    "announcement_text" TEXT,
    "announcement_active" BOOLEAN NOT NULL DEFAULT false,
    "exchange_enabled" BOOLEAN NOT NULL DEFAULT true,
    "exchange_window_days" INTEGER NOT NULL DEFAULT 7,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PromotionCampaign" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "discount_type" TEXT NOT NULL,
    "discount_value" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "markup_value" DECIMAL(65,30) DEFAULT 0,
    "target_type" TEXT NOT NULL,
    "target_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "backup_prices" JSONB,

    CONSTRAINT "PromotionCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_last_login_idx" ON "User"("last_login");
CREATE INDEX IF NOT EXISTS "User_last_active_at_idx" ON "User"("last_active_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_category_id_idx" ON "Product"("category_id");
CREATE INDEX IF NOT EXISTS "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_barcode_key" ON "ProductVariant"("barcode");
CREATE INDEX IF NOT EXISTS "ProductVariant_product_id_idx" ON "ProductVariant"("product_id");
CREATE INDEX IF NOT EXISTS "ProductVariant_barcode_idx" ON "ProductVariant"("barcode");
CREATE INDEX IF NOT EXISTS "ProductVariant_size_idx" ON "ProductVariant"("size");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InventoryMovement_variant_id_idx" ON "InventoryMovement"("variant_id");
CREATE INDEX IF NOT EXISTS "InventoryMovement_product_id_idx" ON "InventoryMovement"("product_id");
CREATE INDEX IF NOT EXISTS "InventoryMovement_type_idx" ON "InventoryMovement"("type");
CREATE INDEX IF NOT EXISTS "InventoryMovement_reference_id_idx" ON "InventoryMovement"("reference_id");
CREATE INDEX IF NOT EXISTS "InventoryMovement_created_at_idx" ON "InventoryMovement"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CartItem_user_id_idx" ON "CartItem"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_user_id_idx" ON "Order"("user_id");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "Order_created_at_idx" ON "Order"("created_at");
CREATE INDEX IF NOT EXISTS "Order_razorpay_order_id_idx" ON "Order"("razorpay_order_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderItem_order_id_idx" ON "OrderItem"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_gateway_payment_id_key" ON "Payment"("gateway_payment_id");
CREATE INDEX IF NOT EXISTS "Payment_gateway_payment_id_idx" ON "Payment"("gateway_payment_id");
CREATE INDEX IF NOT EXISTS "Payment_gateway_order_id_idx" ON "Payment"("gateway_order_id");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Sale_invoice_number_key" ON "Sale"("invoice_number");
CREATE INDEX IF NOT EXISTS "Sale_created_at_idx" ON "Sale"("created_at");
CREATE INDEX IF NOT EXISTS "Sale_status_idx" ON "Sale"("status");
CREATE INDEX IF NOT EXISTS "Sale_staff_id_idx" ON "Sale"("staff_id");
CREATE INDEX IF NOT EXISTS "Sale_customer_phone_idx" ON "Sale"("customer_phone");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SaleItem_sale_id_idx" ON "SaleItem"("sale_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReturnRequest_status_idx" ON "ReturnRequest"("status");
CREATE INDEX IF NOT EXISTS "ReturnRequest_order_id_idx" ON "ReturnRequest"("order_id");
CREATE INDEX IF NOT EXISTS "ReturnRequest_sale_id_idx" ON "ReturnRequest"("sale_id");
CREATE INDEX IF NOT EXISTS "ReturnRequest_variant_id_idx" ON "ReturnRequest"("variant_id");
CREATE INDEX IF NOT EXISTS "ReturnRequest_exchange_variant_id_idx" ON "ReturnRequest"("exchange_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "InvoiceCounter_prefix_key" ON "InvoiceCounter"("prefix");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Address_user_id_idx" ON "Address"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Wishlist_user_id_product_id_key" ON "Wishlist"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Review_product_id_idx" ON "Review"("product_id");
CREATE INDEX IF NOT EXISTS "Review_rating_idx" ON "Review"("rating");
CREATE INDEX IF NOT EXISTS "Review_is_approved_idx" ON "Review"("is_approved");
CREATE INDEX IF NOT EXISTS "Review_created_at_idx" ON "Review"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StockNotification_product_id_idx" ON "StockNotification"("product_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Purchase_purchase_number_key" ON "Purchase"("purchase_number");
CREATE INDEX IF NOT EXISTS "Purchase_supplier_id_idx" ON "Purchase"("supplier_id");
CREATE INDEX IF NOT EXISTS "Purchase_status_idx" ON "Purchase"("status");
CREATE INDEX IF NOT EXISTS "Purchase_created_at_idx" ON "Purchase"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PurchaseItem_purchase_id_idx" ON "PurchaseItem"("purchase_id");
CREATE INDEX IF NOT EXISTS "PurchaseItem_variant_id_idx" ON "PurchaseItem"("variant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdminAuditLog_actor_id_idx" ON "AdminAuditLog"("actor_id");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_entity_idx" ON "AdminAuditLog"("entity");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_created_at_idx" ON "AdminAuditLog"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryReservation_razorpay_order_id_key" ON "InventoryReservation"("razorpay_order_id");
CREATE INDEX IF NOT EXISTS "InventoryReservation_razorpay_order_id_idx" ON "InventoryReservation"("razorpay_order_id");
CREATE INDEX IF NOT EXISTS "InventoryReservation_status_idx" ON "InventoryReservation"("status");
CREATE INDEX IF NOT EXISTS "InventoryReservation_expires_at_idx" ON "InventoryReservation"("expires_at");

-- AddForeignKey (with do block or alter table)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Product_category_id_fkey') THEN
        ALTER TABLE "Product" ADD CONSTRAINT "Product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductVariant_product_id_fkey') THEN
        ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryMovement_variant_id_fkey') THEN
        ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InventoryMovement_product_id_fkey') THEN
        ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CartItem_user_id_fkey') THEN
        ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CartItem_product_id_fkey') THEN
        ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CartItem_variant_id_fkey') THEN
        ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_user_id_fkey') THEN
        ALTER TABLE "Order" ADD CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_order_id_fkey') THEN
        ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_product_id_fkey') THEN
        ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_variant_id_fkey') THEN
        ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_order_id_fkey') THEN
        ALTER TABLE "Payment" ADD CONSTRAINT "Payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_sale_id_fkey') THEN
        ALTER TABLE "Payment" ADD CONSTRAINT "Payment_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Sale_staff_id_fkey') THEN
        ALTER TABLE "Sale" ADD CONSTRAINT "Sale_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SaleItem_sale_id_fkey') THEN
        ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SaleItem_product_id_fkey') THEN
        ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SaleItem_variant_id_fkey') THEN
        ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReturnRequest_product_id_fkey') THEN
        ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReturnRequest_order_id_fkey') THEN
        ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReturnRequest_sale_id_fkey') THEN
        ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReturnRequest_variant_id_fkey') THEN
        ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReturnRequest_exchange_variant_id_fkey') THEN
        ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_exchange_variant_id_fkey" FOREIGN KEY ("exchange_variant_id") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Address_user_id_fkey') THEN
        ALTER TABLE "Address" ADD CONSTRAINT "Address_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Wishlist_user_id_fkey') THEN
        ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Wishlist_product_id_fkey') THEN
        ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Review_user_id_fkey') THEN
        ALTER TABLE "Review" ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Review_product_id_fkey') THEN
        ALTER TABLE "Review" ADD CONSTRAINT "Review_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockNotification_user_id_fkey') THEN
        ALTER TABLE "StockNotification" ADD CONSTRAINT "StockNotification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockNotification_product_id_fkey') THEN
        ALTER TABLE "StockNotification" ADD CONSTRAINT "StockNotification_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Purchase_supplier_id_fkey') THEN
        ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PurchaseItem_purchase_id_fkey') THEN
        ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PurchaseItem_variant_id_fkey') THEN
        ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdminAuditLog_actor_id_fkey') THEN
        ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
