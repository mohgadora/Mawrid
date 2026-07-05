CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "address" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"label" text DEFAULT 'Home' NOT NULL,
	"fullName" text NOT NULL,
	"phone" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"region" text,
	"country" text DEFAULT 'SA' NOT NULL,
	"postalCode" text,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entityId" text,
	"diff" jsonb,
	"ip" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"nameAr" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text,
	"parentId" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "country" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"nameAr" text NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "country_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "delivery_zone" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"nameAr" text,
	"country" text DEFAULT 'SA' NOT NULL,
	"shippingFee" numeric(12, 2) DEFAULT '0' NOT NULL,
	"freeOverAmount" numeric(12, 2),
	"estimatedDays" integer DEFAULT 3 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "driver" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"vehicle" text NOT NULL,
	"vehiclePlate" text,
	"status" text DEFAULT 'offline' NOT NULL,
	"lat" numeric(10, 7),
	"lng" numeric(10, 7),
	"currentOrderId" text,
	"userId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorite" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"productId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_approval" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text DEFAULT 'merchant' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"crNumber" text,
	"vatNumber" text,
	"documents" jsonb DEFAULT '[]' NOT NULL,
	"reviewedBy" text,
	"reviewNote" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"ref" text NOT NULL,
	"userId" text NOT NULL,
	"supplierId" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"addressId" text,
	"shippingAddress" jsonb,
	"paymentMethod" text DEFAULT 'cod' NOT NULL,
	"paymentStatus" text DEFAULT 'unpaid' NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"shippingFee" numeric(12, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"estimatedDelivery" date,
	"deliveredAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "order_event" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"status" text NOT NULL,
	"note" text,
	"createdBy" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_line" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"productId" text,
	"productName" text NOT NULL,
	"productImage" text,
	"sku" text,
	"qty" integer NOT NULL,
	"unitPrice" numeric(12, 2) NOT NULL,
	"cartonQty" integer DEFAULT 1 NOT NULL,
	"unitsPerCarton" integer DEFAULT 1 NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_template" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"items" jsonb DEFAULT '[]' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout" (
	"id" text PRIMARY KEY NOT NULL,
	"supplierId" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reference" text,
	"bankAccount" jsonb,
	"processedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_tier" (
	"id" text PRIMARY KEY NOT NULL,
	"productId" text NOT NULL,
	"minQty" integer NOT NULL,
	"maxQty" integer,
	"price" numeric(12, 2) NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"sku" text,
	"name" text NOT NULL,
	"nameAr" text,
	"description" text,
	"descriptionAr" text,
	"categoryId" text,
	"supplierId" text,
	"imageUrl" text,
	"images" jsonb DEFAULT '[]' NOT NULL,
	"unitsPerCarton" integer DEFAULT 1 NOT NULL,
	"weight" numeric(8, 3),
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"marketAvgPrice" numeric(12, 2),
	"stock" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "supplier" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"nameAr" text,
	"logo" text,
	"country" text DEFAULT 'SA' NOT NULL,
	"city" text,
	"rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"reviewCount" integer DEFAULT 0 NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"responseTime" text,
	"minOrder" integer DEFAULT 1 NOT NULL,
	"userId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_ticket" (
	"id" text PRIMARY KEY NOT NULL,
	"ref" text NOT NULL,
	"userId" text NOT NULL,
	"orderId" text,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"assignedTo" text,
	"resolvedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_ticket_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "ticket_message" (
	"id" text PRIMARY KEY NOT NULL,
	"ticketId" text NOT NULL,
	"userId" text NOT NULL,
	"body" text NOT NULL,
	"isStaff" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"orderId" text,
	"type" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"gateway" text,
	"reference" text,
	"meta" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'consumer' NOT NULL,
	"phone" text,
	"company" text,
	"vatNumber" text,
	"country" text DEFAULT 'SA',
	"banned" boolean DEFAULT false,
	"banReason" text,
	"banExpires" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver" ADD CONSTRAINT "driver_currentOrderId_order_id_fk" FOREIGN KEY ("currentOrderId") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver" ADD CONSTRAINT "driver_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_productId_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_supplierId_supplier_id_fk" FOREIGN KEY ("supplierId") REFERENCES "public"."supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_addressId_address_id_fk" FOREIGN KEY ("addressId") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_event" ADD CONSTRAINT "order_event_orderId_order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line" ADD CONSTRAINT "order_line_orderId_order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line" ADD CONSTRAINT "order_line_productId_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "payout_supplierId_supplier_id_fk" FOREIGN KEY ("supplierId") REFERENCES "public"."supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_tier" ADD CONSTRAINT "price_tier_productId_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_supplierId_supplier_id_fk" FOREIGN KEY ("supplierId") REFERENCES "public"."supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_orderId_order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_message" ADD CONSTRAINT "ticket_message_ticketId_support_ticket_id_fk" FOREIGN KEY ("ticketId") REFERENCES "public"."support_ticket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_orderId_order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;