-- =====================================================================
-- DES-02: منصة تجارة الجملة — مخطط قاعدة البيانات PostgreSQL 16
-- القواعد الحاكمة (من SRS القسم 2):
--   * المال Numeric حصراً — يمنع Float
--   * الترجمة بجدول translations — لا أعمدة لغوية
--   * حذف منطقي وتدقيق للكيانات الحساسة
--   * country_id في كل الكيانات السوقية (تدويل من اليوم الأول)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- الأنواع ----------
CREATE TYPE user_role        AS ENUM ('consumer','merchant','supplier','driver','operator','admin');
CREATE TYPE account_status   AS ENUM ('pending','active','suspended','rejected');
CREATE TYPE kyc_status       AS ENUM ('draft','under_review','approved','rejected');
CREATE TYPE unit_type        AS ENUM ('carton','piece','pallet','sack');
CREATE TYPE order_status     AS ENUM ('new','confirmed','preparing','ready','out_for_delivery','delivered','cancelled','returned');
CREATE TYPE pod_type         AS ENUM ('signature','photo','otp');
CREATE TYPE wallet_direction AS ENUM ('credit','debit');
CREATE TYPE wallet_ref       AS ENUM ('order','refund','topup','payout','adjustment');
CREATE TYPE market_source    AS ENUM ('official','field','internal','crowd');
CREATE TYPE confidence_level AS ENUM ('low','medium','high');

-- ---------- الدول والعملات (SRS-INT) ----------
CREATE TABLE countries (
  id           smallserial PRIMARY KEY,
  code         char(2)  NOT NULL UNIQUE,          -- ISO 3166-1
  currency     char(3)  NOT NULL,                 -- ISO 4217
  vat_rate     numeric(5,4) NOT NULL DEFAULT 0.15,
  decimals     smallint NOT NULL DEFAULT 2,       -- KWD = 3
  is_active    boolean  NOT NULL DEFAULT true
);

CREATE TABLE fx_rates (
  currency     char(3) NOT NULL,
  rate_to_usd  numeric(18,8) NOT NULL CHECK (rate_to_usd > 0),
  rate_date    date    NOT NULL,
  PRIMARY KEY (currency, rate_date)
);

-- ---------- الترجمة المركزية (SRS-INT-03) ----------
CREATE TABLE translations (
  entity_type  text    NOT NULL,                  -- 'product','category',...
  entity_id    bigint  NOT NULL,
  locale       char(2) NOT NULL,                  -- 'ar','en'
  field        text    NOT NULL,                  -- 'name','description'
  value        text    NOT NULL,
  PRIMARY KEY (entity_type, entity_id, locale, field)
);

-- ---------- الهوية (SRS-AUT) ----------
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone         text NOT NULL UNIQUE,
  email         citext UNIQUE,
  password_hash text,
  role          user_role      NOT NULL,
  status        account_status NOT NULL DEFAULT 'pending',
  country_id    smallint NOT NULL REFERENCES countries(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz                        -- حذف منطقي
);

CREATE TABLE merchants (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id     uuid NOT NULL REFERENCES users(id),
  cr_number    text NOT NULL,
  vat_number   text CHECK (vat_number ~ '^3\d{13}3$'),  -- صيغة السعودية؛ لكل دولة قاعدة
  kyc          kyc_status NOT NULL DEFAULT 'draft',
  verified_at  timestamptz,
  UNIQUE (cr_number)
);

CREATE TABLE merchant_members (                     -- SRS-AUT-04
  merchant_id  uuid NOT NULL REFERENCES merchants(id),
  user_id      uuid NOT NULL REFERENCES users(id),
  member_role  text NOT NULL CHECK (member_role IN ('owner','buyer','accountant')),
  PRIMARY KEY (merchant_id, user_id)
);

CREATE TABLE suppliers (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id     uuid NOT NULL REFERENCES users(id),
  cr_number    text NOT NULL UNIQUE,
  vat_number   text,
  iban         text,
  kyc          kyc_status NOT NULL DEFAULT 'draft',
  rating       numeric(3,2) CHECK (rating BETWEEN 0 AND 5),
  verified_at  timestamptz
);

CREATE TABLE drivers (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL UNIQUE REFERENCES users(id),
  vehicle_ref  text,
  is_active    boolean NOT NULL DEFAULT true
);

-- ---------- الكتالوج (SRS-CAT) ----------
CREATE TABLE categories (
  id           bigserial PRIMARY KEY,
  parent_id    bigint REFERENCES categories(id),
  country_id   smallint NOT NULL REFERENCES countries(id),
  sort_order   int NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true
);

CREATE TABLE products (
  id              bigserial PRIMARY KEY,
  category_id     bigint NOT NULL REFERENCES categories(id),
  gtin            text UNIQUE,                    -- تحقق Checksum في طبقة الخدمة
  unit            unit_type NOT NULL DEFAULT 'carton',
  units_per_carton int NOT NULL DEFAULT 1 CHECK (units_per_carton > 0),
  image_url       text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ربط المنتج بالمورد: السعر والمخزون هنا (SRS-CAT-01)
CREATE TABLE supplier_products (
  id            bigserial PRIMARY KEY,
  product_id    bigint NOT NULL REFERENCES products(id),
  supplier_id   uuid   NOT NULL REFERENCES suppliers(id),
  country_id    smallint NOT NULL REFERENCES countries(id),
  wholesale_price numeric(12,2) NOT NULL CHECK (wholesale_price > 0),
  retail_price    numeric(12,2) NOT NULL CHECK (retail_price > 0),
  old_price       numeric(12,2),
  stock         int NOT NULL DEFAULT 0 CHECK (stock >= 0),  -- يضمن عدم البيع الزائد مع الخصم الذري
  moq           int NOT NULL DEFAULT 1 CHECK (moq > 0),
  is_active     boolean NOT NULL DEFAULT true,
  UNIQUE (product_id, supplier_id, country_id)
);

CREATE TABLE price_tiers (                          -- SRS-PRC-01
  id                  bigserial PRIMARY KEY,
  supplier_product_id bigint NOT NULL REFERENCES supplier_products(id) ON DELETE CASCADE,
  min_qty             int NOT NULL CHECK (min_qty > 0),
  price               numeric(12,2) NOT NULL CHECK (price > 0),
  UNIQUE (supplier_product_id, min_qty)
);

-- ---------- الطلبات (SRS-ORD) ----------
CREATE TABLE orders (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref           text NOT NULL UNIQUE,              -- مرجع موحد للمشتري
  parent_id     uuid REFERENCES orders(id),        -- الطلبات الفرعية عند التقسيم
  buyer_id      uuid NOT NULL REFERENCES users(id),
  supplier_id   uuid REFERENCES suppliers(id),     -- للطلب الفرعي
  country_id    smallint NOT NULL REFERENCES countries(id),
  status        order_status NOT NULL DEFAULT 'new',
  subtotal      numeric(12,2) NOT NULL,
  vat_amount    numeric(12,2) NOT NULL,
  delivery_fee  numeric(12,2) NOT NULL DEFAULT 0,
  total         numeric(12,2) NOT NULL,
  payment_ref   text,
  address       jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id                  bigserial PRIMARY KEY,
  order_id            uuid   NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  supplier_product_id bigint NOT NULL REFERENCES supplier_products(id),
  qty                 int NOT NULL CHECK (qty > 0),
  unit_price          numeric(12,2) NOT NULL,      -- مجمّد وقت التأكيد (SRS-PRC-01)
  tier_min_qty        int,                          -- لقطة الشريحة المطبقة
  market_price_at_order numeric(12,2)               -- لقطة مؤشر السوق (لسطر التوفير)
);

CREATE TABLE order_status_log (                     -- SRS-ORD-01
  id         bigserial PRIMARY KEY,
  order_id   uuid NOT NULL REFERENCES orders(id),
  from_status order_status,
  to_status   order_status NOT NULL,
  actor_id    uuid REFERENCES users(id),
  at          timestamptz NOT NULL DEFAULT now()
);

-- ---------- التوصيل (SRS-DLV) ----------
CREATE TABLE delivery_zones (
  id          bigserial PRIMARY KEY,
  country_id  smallint NOT NULL REFERENCES countries(id),
  city        text NOT NULL,
  polygon     jsonb NOT NULL,                      -- GeoJSON (ترقية PostGIS لاحقاً)
  fee         numeric(12,2) NOT NULL,
  min_order   numeric(12,2) NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true
);

CREATE TABLE shipments (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     uuid NOT NULL REFERENCES orders(id),
  driver_id    uuid REFERENCES drivers(id),
  status       order_status NOT NULL DEFAULT 'ready',
  pod          pod_type,
  pod_ref      text,                               -- مسار الصورة/التوقيع أو رمز التحقق
  cod_amount   numeric(12,2) DEFAULT 0,
  delivered_at timestamptz
);

-- ---------- المحفظة: دفتر قيود مزدوج (SRS-PAY-02) ----------
CREATE TABLE wallet_entries (
  id         bigserial PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id),
  direction  wallet_direction NOT NULL,
  amount     numeric(12,2) NOT NULL CHECK (amount > 0),
  currency   char(3) NOT NULL,
  ref_type   wallet_ref NOT NULL,
  ref_id     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- الرصيد = SUM(credit) - SUM(debit) — لا حقل رصيد يعدل مباشرة

-- ---------- محرك مقارنة الأسعار (SRS-MKT) ----------
CREATE TABLE market_price_snapshots (
  id          bigserial PRIMARY KEY,
  product_id  bigint NOT NULL REFERENCES products(id),
  country_id  smallint NOT NULL REFERENCES countries(id),
  source      market_source NOT NULL,
  price       numeric(12,2) NOT NULL CHECK (price > 0),
  captured_at timestamptz NOT NULL DEFAULT now(),
  meta        jsonb                                 -- المصدر التفصيلي، المدخل، الموقع
);
CREATE INDEX idx_snapshots_calc ON market_price_snapshots (product_id, country_id, captured_at DESC);

CREATE TABLE market_price_index (                   -- ناتج المهمة الليلية
  product_id    bigint  NOT NULL REFERENCES products(id),
  country_id    smallint NOT NULL REFERENCES countries(id),
  index_date    date    NOT NULL,
  avg_price     numeric(12,2) NOT NULL,
  sources_count int     NOT NULL,
  confidence    confidence_level NOT NULL,
  PRIMARY KEY (product_id, country_id, index_date)
);

-- ---------- التدقيق (SRS-ADM-02) ----------
CREATE TABLE audit_log (
  id         bigserial PRIMARY KEY,
  actor_id   uuid,
  action     text NOT NULL,
  entity     text NOT NULL,
  entity_id  text NOT NULL,
  before     jsonb,
  after      jsonb,
  at         timestamptz NOT NULL DEFAULT now()
);

-- ---------- فهارس الأداء الرئيسية ----------
CREATE INDEX idx_sp_lookup      ON supplier_products (product_id, country_id) WHERE is_active;
CREATE INDEX idx_orders_buyer   ON orders (buyer_id, created_at DESC);
CREATE INDEX idx_orders_supplier ON orders (supplier_id, status);
CREATE INDEX idx_users_phone    ON users (phone) WHERE deleted_at IS NULL;

-- ---------- الخصم الذري للمخزون (SRS-ORD-02) — نمط الاستخدام ----------
-- UPDATE supplier_products SET stock = stock - :qty
--   WHERE id = :id AND stock >= :qty;
-- ROW_COUNT = 0  =>  نفاد المخزون: أفشل إنشاء الطلب داخل نفس المعاملة
