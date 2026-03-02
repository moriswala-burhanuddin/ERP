const Database = require("better-sqlite3")
const path = require("path")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const { app } = require('electron')

// Centralized database path in its own data directory
const dbPath = app
  ? path.join(app.getPath('userData'), 'storeflow.db')
  : path.join(__dirname, 'storeflow.db')

console.log('[DB] Connecting to:', dbPath)
const db = new Database(dbPath)

// Create tables with sync_status and updated_at everywhere
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    branch TEXT,
    address TEXT,
    phone TEXT,
    device_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    password TEXT,
    role TEXT CHECK(role IN ('admin', 'user', 'staff', 'super_admin', 'hr_manager', 'sales_manager', 'inventory_manager', 'accountant', 'employee')) NOT NULL,
    is_staff INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    store_id TEXT,
    avatar TEXT,
    device_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    category TEXT,
    selling_price REAL NOT NULL,
    purchase_price REAL NOT NULL,
    quantity INTEGER DEFAULT 0,
    store_id TEXT NOT NULL,
    last_used TEXT,
    unit TEXT,
    brand TEXT,
    barcode TEXT,
    min_stock INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    device_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    area TEXT,
    credit_balance REAL DEFAULT 0,
    total_purchases REAL DEFAULT 0,
    store_id TEXT NOT NULL,
    joined_at TEXT NOT NULL,
    device_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('cash', 'card', 'wallet')) NOT NULL,
    balance REAL DEFAULT 0,
    store_id TEXT NOT NULL,
    device_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS cheques (
    id TEXT PRIMARY KEY,
    party_type TEXT CHECK(party_type IN ('supplier', 'customer')) NOT NULL,
    party_id TEXT NOT NULL,
    party_name TEXT NOT NULL,
    cheque_number TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    amount REAL NOT NULL,
    issue_date TEXT NOT NULL,
    clearing_date TEXT,
    status TEXT CHECK(status IN ('pending', 'cleared', 'bounced', 'cancelled')) DEFAULT 'pending',
    store_id TEXT NOT NULL,
    notes TEXT,
    device_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    type TEXT CHECK(type IN ('retail', 'cash', 'credit')) NOT NULL,
    items TEXT NOT NULL,
    total_amount REAL NOT NULL,
    profit REAL NOT NULL,
    payment_mode TEXT CHECK(payment_mode IN ('cash', 'card', 'wallet')) NOT NULL,
    account_id TEXT NOT NULL,
    customer_id TEXT,
    store_id TEXT NOT NULL,
    date TEXT NOT NULL,
    quotation_id TEXT,
    device_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS quotations (
    id TEXT PRIMARY KEY,
    quotation_number TEXT UNIQUE NOT NULL,
    items TEXT NOT NULL,
    total_amount REAL NOT NULL,
    customer_id TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    store_id TEXT NOT NULL,
    date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'converted', 'expired', 'cancelled')) DEFAULT 'pending',
    notes TEXT,
    device_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    supplier TEXT NOT NULL,
    type TEXT CHECK(type IN ('cash', 'credit')) NOT NULL,
    items TEXT NOT NULL,
    total_amount REAL NOT NULL,
    store_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    date TEXT NOT NULL,
    device_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT CHECK(type IN ('cash_in', 'cash_out', 'expense', 'sale_return')) NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    customer_id TEXT,
    customer_name TEXT,
    store_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    date TEXT NOT NULL,
    device_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );

  CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
  CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
  CREATE INDEX IF NOT EXISTS idx_sales_store ON sales(store_id);
  CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id);

  CREATE TABLE IF NOT EXISTS stock_logs (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name TEXT,
    store_id TEXT NOT NULL,
    quantity_change REAL NOT NULL,
    reason TEXT NOT NULL,
    reference_id TEXT,
    device_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS stock_transfers (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    from_store_id TEXT NOT NULL,
    to_store_id TEXT NOT NULL,
    quantity REAL NOT NULL,
    status TEXT CHECK(status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
    transferred_at TEXT,
    device_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (from_store_id) REFERENCES stores(id),
    FOREIGN KEY (to_store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS expense_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (parent_id) REFERENCES expense_categories(id)
  );

  CREATE TABLE IF NOT EXISTS tax_slabs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    percentage REAL NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS loyalty_points (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    points INTEGER NOT NULL,
    reason TEXT,
    sale_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (sale_id) REFERENCES sales(id)
  );

  CREATE TABLE IF NOT EXISTS commissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    sale_id TEXT NOT NULL,
    amount REAL NOT NULL,
    percentage REAL NOT NULL,
    status TEXT CHECK(status IN ('pending', 'paid')) DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (sale_id) REFERENCES sales(id)
  );

  CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    supplier TEXT NOT NULL,
    items TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT CHECK(status IN ('draft', 'sent', 'received', 'cancelled')) DEFAULT 'draft',
    store_id TEXT NOT NULL,
    date TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    check_in TEXT,
    check_out TEXT,
    status TEXT CHECK(status IN ('present', 'late', 'absent', 'half_day')) DEFAULT 'present',
    store_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS leaves (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    type TEXT CHECK(type IN ('sick', 'casual', 'earned', 'unpaid')) NOT NULL,
    reason TEXT,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    store_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    store_id TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    type TEXT CHECK(type IN ('morning', 'evening', 'full')) NOT NULL,
    status TEXT CHECK(status IN ('assigned', 'completed', 'cancelled')) DEFAULT 'assigned',
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL,
    status TEXT CHECK(status IN ('applied', 'interview', 'offer', 'hired', 'rejected')) DEFAULT 'applied',
    resume_text TEXT,
    score INTEGER DEFAULT 0,
    skills TEXT,
    store_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL,
    status TEXT CHECK(status IN ('applied', 'interview', 'offer', 'hired', 'rejected')) DEFAULT 'applied',
    resume_text TEXT,
    score INTEGER DEFAULT 0,
    skills TEXT,
    store_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    department TEXT,
    designation TEXT,
    salary REAL,
    joining_date TEXT,
    documents TEXT, -- JSON array of URLs
    store_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS item_kits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    selling_price REAL NOT NULL,
    store_id TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS kit_items (
    id TEXT PRIMARY KEY,
    kit_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity REAL NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (kit_id) REFERENCES item_kits(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS custom_fields (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    type TEXT CHECK(type IN ('text', 'number', 'date', 'select')) NOT NULL,
    options TEXT, -- JSON string for select options
    is_required INTEGER DEFAULT 0,
    show_on_receipt INTEGER DEFAULT 1,
    target_type TEXT CHECK(target_type IN ('product', 'client')) NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS product_custom_values (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    field_id TEXT NOT NULL,
    value TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (field_id) REFERENCES custom_fields(id)
  );

  CREATE TABLE IF NOT EXISTS payment_terms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    days INTEGER DEFAULT 0,
    store_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    supplier_code TEXT UNIQUE,
    company_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT,
    account_number TEXT,
    opening_balance REAL DEFAULT 0,
    payment_term_id TEXT,
    credit_limit REAL DEFAULT 0,
    tax_number TEXT,
    currency TEXT DEFAULT 'USD',
    current_balance REAL DEFAULT 0,
    internal_notes TEXT,
    comments TEXT,
    logo TEXT,
    documents TEXT,
    status TEXT CHECK(status IN ('active', 'disabled')) DEFAULT 'active',
    rating INTEGER DEFAULT 5,
    is_preferred INTEGER DEFAULT 0,
    is_blacklisted INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    deleted_at TEXT,
    store_id TEXT NOT NULL,
    device_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (payment_term_id) REFERENCES payment_terms(id)
  );

  CREATE TABLE IF NOT EXISTS supplier_documents (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
    store_id TEXT NOT NULL,
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS supplier_custom_fields (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    field_type TEXT NOT NULL,
    is_required INTEGER DEFAULT 0,
    show_on_receipt INTEGER DEFAULT 0,
    hide_label INTEGER DEFAULT 0,
    options TEXT,
    store_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS supplier_custom_values (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL,
    field_id TEXT NOT NULL,
    value TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (field_id) REFERENCES supplier_custom_fields(id)
  );

  CREATE TABLE IF NOT EXISTS supplier_transactions (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    balance_after REAL NOT NULL,
    date TEXT NOT NULL,
    reference_id TEXT,
    description TEXT,
    store_id TEXT NOT NULL,
    device_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  -- ── Receiving Module ──────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS receivings (
    id TEXT PRIMARY KEY,
    receiving_number TEXT UNIQUE NOT NULL,
    supplier_id TEXT NOT NULL,
    purchase_order_id TEXT,
    total_amount REAL DEFAULT 0,
    discount_total REAL DEFAULT 0,
    amount_paid REAL DEFAULT 0,
    amount_due REAL DEFAULT 0,
    account_id TEXT,
    status TEXT CHECK(status IN ('draft','suspended','completed','returned')) DEFAULT 'draft',
    notes TEXT,
    custom_fields TEXT,
    store_id TEXT NOT NULL,
    device_id TEXT,
    completed_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS receiving_items (
    id TEXT PRIMARY KEY,
    receiving_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    cost REAL NOT NULL,
    quantity REAL NOT NULL,
    discount_pct REAL DEFAULT 0,
    total REAL NOT NULL,
    batch_number TEXT,
    expiry_date TEXT,
    serial_number TEXT,
    location TEXT,
    selling_price REAL,
    upc TEXT,
    description TEXT,
    store_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (receiving_id) REFERENCES receivings(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS gift_cards (
    id TEXT PRIMARY KEY,
    card_number TEXT UNIQUE NOT NULL,
    value REAL NOT NULL,
    balance REAL NOT NULL,
    is_active INTEGER DEFAULT 1,
    customer_id TEXT,
    store_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS sale_payments (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    payment_mode TEXT NOT NULL,
    amount REAL NOT NULL,
    account_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS work_orders (
    id TEXT PRIMARY KEY,
    sale_id TEXT UNIQUE NOT NULL,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
    notes TEXT,
    store_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    sale_id TEXT UNIQUE NOT NULL,
    employee_id TEXT,
    address TEXT NOT NULL,
    delivery_charge REAL DEFAULT 0,
    is_cod INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('pending', 'dispatched', 'delivered')) DEFAULT 'pending',
    delivery_date TEXT,
    store_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (employee_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS delivery_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fee REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    store_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE INDEX IF NOT EXISTS idx_receivings_store ON receivings(store_id);
  CREATE INDEX IF NOT EXISTS idx_receivings_supplier ON receivings(supplier_id);
  CREATE INDEX IF NOT EXISTS idx_receiving_items_receiving ON receiving_items(receiving_id);
  CREATE INDEX IF NOT EXISTS idx_gift_cards_number ON gift_cards(card_number);
  CREATE INDEX IF NOT EXISTS idx_sale_payments_sale ON sale_payments(sale_id);
  CREATE INDEX IF NOT EXISTS idx_delivery_zones_store ON delivery_zones(store_id);
  CREATE INDEX IF NOT EXISTS idx_sales_date_store ON sales(store_id, date);
  CREATE INDEX IF NOT EXISTS idx_products_store_active ON products(store_id, is_deleted);
  CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id);

  -- ── Invoice Module ──────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    type TEXT CHECK(type IN ('customer', 'supplier')) NOT NULL,
    status TEXT CHECK(status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
    customer_id TEXT,
    supplier_id TEXT,
    date TEXT NOT NULL,
    due_date TEXT,
    subtotal REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    amount_paid REAL DEFAULT 0,
    amount_due REAL DEFAULT 0,
    notes TEXT,
    store_id TEXT NOT NULL,
    device_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    product_id TEXT,
    description TEXT,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    discount_amount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total REAL NOT NULL,
    store_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status INTEGER DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE INDEX IF NOT EXISTS idx_invoices_store ON invoices(store_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON invoices(supplier_id);
  CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
`)


// EXPLICIT MIGRATION CHECK ON STARTUP
try {
  // Users Role Migration (Phase 3 RBAC)
  const usersCols = db.prepare('PRAGMA table_info(users)').all();
  if (!usersCols.some(col => col.name === 'is_driver')) {
    db.prepare('ALTER TABLE users ADD COLUMN is_driver INTEGER DEFAULT 0').run();
  }

  // Sales migration
  const salesTableInfo = db.prepare('PRAGMA table_info(sales)').all();
  if (!salesTableInfo.some(col => col.name === 'status')) {
    db.prepare("ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'completed'").run();
  }
  if (!salesTableInfo.some(col => col.name === 'subtotal')) {
    db.prepare("ALTER TABLE sales ADD COLUMN subtotal REAL DEFAULT 0").run();
  }
  if (!salesTableInfo.some(col => col.name === 'discount_amount')) {
    db.prepare("ALTER TABLE sales ADD COLUMN discount_amount REAL DEFAULT 0").run();
  }
  if (!salesTableInfo.some(col => col.name === 'tax_amount')) {
    db.prepare("ALTER TABLE sales ADD COLUMN tax_amount REAL DEFAULT 0").run();
  }
  // Products migration
  const productsTableInfo = db.prepare('PRAGMA table_info(products)').all();
  const hasIsDeleted = productsTableInfo.some(col => col.name === 'is_deleted');
  if (!hasIsDeleted) {
    db.prepare('ALTER TABLE products ADD COLUMN is_deleted INTEGER DEFAULT 0').run();
  }

  const hasIsKit = productsTableInfo.some(col => col.name === 'is_kit');
  if (!hasIsKit) {
    db.prepare('ALTER TABLE products ADD COLUMN is_kit INTEGER DEFAULT 0').run();
  }

  const hasLimitedQty = productsTableInfo.some(col => col.name === 'limited_qty');
  if (!hasLimitedQty) {
    db.prepare('ALTER TABLE products ADD COLUMN limited_qty REAL').run();
  }

  const hasBarcodeEnabled = productsTableInfo.some(col => col.name === 'barcode_enabled');
  if (!hasBarcodeEnabled) {
    db.prepare('ALTER TABLE products ADD COLUMN barcode_enabled INTEGER DEFAULT 1').run();
  }

  // Individual column additions with error suppression to ensure idempotency
  const addColumn = (table, columnDef) => {
    try {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`).run();
      console.log(`[DB] Added column ${columnDef} to ${table}`);
    } catch (e) {
      if (!e.message.includes('duplicate column name')) {
        console.warn(`[DB] Could not add column ${columnDef} to ${table}:`, e.message);
      }
    }
  };

  const DEFAULT_TS = "'2026-01-01 00:00:00'";
  addColumn('kit_items', `updated_at TEXT NOT NULL DEFAULT ${DEFAULT_TS}`);
  addColumn('kit_items', 'sync_status INTEGER DEFAULT 0');
  addColumn('product_custom_values', `updated_at TEXT NOT NULL DEFAULT ${DEFAULT_TS}`);
  addColumn('product_custom_values', 'sync_status INTEGER DEFAULT 0');

  addColumn('stock_logs', `updated_at TEXT NOT NULL DEFAULT ${DEFAULT_TS}`);
  addColumn('loyalty_points', `updated_at TEXT NOT NULL DEFAULT ${DEFAULT_TS}`);
  addColumn('commissions', `updated_at TEXT NOT NULL DEFAULT ${DEFAULT_TS}`);
  addColumn('supplier_documents', `updated_at TEXT NOT NULL DEFAULT ${DEFAULT_TS}`);
  addColumn('supplier_transactions', `updated_at TEXT NOT NULL DEFAULT ${DEFAULT_TS}`);

  // Deliveries & Work Orders
  addColumn('deliveries', 'delivery_charge REAL DEFAULT 0');
  addColumn('deliveries', 'is_cod INTEGER DEFAULT 0');
  addColumn('deliveries', 'delivery_date TEXT');
  addColumn('work_orders', 'notes TEXT');

  // Invoices migration for existing installs
  const invoicesTableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invoices'").get();
  if (!invoicesTableInfo) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        type TEXT CHECK(type IN ('customer', 'supplier')) NOT NULL,
        status TEXT CHECK(status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
        customer_id TEXT,
        supplier_id TEXT,
        date TEXT NOT NULL,
        due_date TEXT,
        subtotal REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        total_amount REAL DEFAULT 0,
        amount_paid REAL DEFAULT 0,
        amount_due REAL DEFAULT 0,
        notes TEXT,
        store_id TEXT NOT NULL,
        device_id TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        sync_status INTEGER DEFAULT 0,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );
      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL,
        product_id TEXT,
        description TEXT,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        discount_amount REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        total REAL NOT NULL,
        store_id TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        sync_status INTEGER DEFAULT 0,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );
    `);
    console.log('[DB] Invoice tables created via migration.');
  }


  // Users Role Migration (Phase 3 RBAC)
  // Check if 'super_admin' is a valid role by trying to insert/check schema or just force update
  // Since we can't easily check check_constraints in sqlite seamlessly, we will recreate the table if needed.
  // We can check if a known user has a new role. If not, we might need to migrate.
  // Let's just do a schema migration pattern: rename table, create new, copy, drop old.
  // To avoid running this every time, we check a specific flag or just check if the schema matches.
  // Simplified: We will drop the check constraint by recreating the table.

  const userTableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get();
  if (userTableInfo && (!userTableInfo.sql.includes('super_admin') || !userTableInfo.sql.includes('accountant') || !userTableInfo.sql.includes('employee'))) {
    console.log('[DB] RE-SYNCING users table for RBAC...');

    try {
      db.exec('PRAGMA foreign_keys = OFF;');
      db.exec('DROP TABLE IF EXISTS users_new;');

      db.exec(`
          CREATE TABLE users_new (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE,
            first_name TEXT,
            last_name TEXT,
            password TEXT,
            role TEXT CHECK(role IN ('admin', 'user', 'staff', 'super_admin', 'hr_manager', 'sales_manager', 'inventory_manager', 'accountant', 'employee')) NOT NULL,
            is_staff INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            store_id TEXT,
            avatar TEXT,
            device_id TEXT,
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            sync_status INTEGER DEFAULT 0,
            FOREIGN KEY (store_id) REFERENCES stores(id)
          );
      `);

      db.exec('BEGIN TRANSACTION;');
      // Only copy columns that definitely exist or can be defaulted
      // Better-sqlite3 allows us to get PRAGMA table_info to be precise, but COALESCE is easier
      db.exec(`
          INSERT INTO users_new (
            id, name, email, username, first_name, last_name, password, role, 
            is_staff, is_active, store_id, avatar, device_id, updated_at, sync_status
          )
          SELECT 
            id, name, email, 
            COALESCE(username, email), 
            COALESCE(first_name, name), 
            COALESCE(last_name, ''), 
            password, role, 
            COALESCE(is_staff, 0), 
            COALESCE(is_active, 1), 
            store_id, avatar, device_id, updated_at, sync_status 
          FROM users;
      `);

      db.exec('DROP TABLE users;');
      db.exec('ALTER TABLE users_new RENAME TO users;');
      db.exec('COMMIT;');
      console.log('[DB] Users table migrated successfully.');
    } catch (migrateError) {
      try { db.exec('ROLLBACK;'); } catch (e) { }
      console.error('[DB] Users migration failed:', migrateError.message);
    } finally {
      db.exec('PRAGMA foreign_keys = ON;');
    }
  }

  // Force fix for null passwords locally just in case
  try {
    const nullPasswords = db.prepare("SELECT count(*) as count FROM users WHERE password IS NULL").get();
    if (nullPasswords && nullPasswords.count > 0) {
      console.log(`[DB] Found ${nullPasswords.count} users with missing passwords. Applying fix and forcing sync...`);
      db.prepare("UPDATE users SET password = 'ChangeMe123!', sync_status = 0 WHERE password IS NULL").run();
    }
  } catch (e) { }

  // Users migration for alignment
  const userInfo = db.prepare('PRAGMA table_info(users)').all();
  const missingUserFields = [];
  if (!userInfo.some(col => col.name === 'username')) missingUserFields.push('username TEXT');
  if (!userInfo.some(col => col.name === 'first_name')) missingUserFields.push('first_name TEXT');
  if (!userInfo.some(col => col.name === 'last_name')) missingUserFields.push('last_name TEXT');
  if (!userInfo.some(col => col.name === 'is_staff')) missingUserFields.push('is_staff INTEGER DEFAULT 0');
  if (!userInfo.some(col => col.name === 'is_active')) missingUserFields.push('is_active INTEGER DEFAULT 1');
  if (!userInfo.some(col => col.name === 'password')) missingUserFields.push('password TEXT');

  missingUserFields.forEach(fieldSql => {
    db.prepare(`ALTER TABLE users ADD COLUMN ${fieldSql}`).run();
  });

  // Additional product fields for tax
  const productsCols = db.prepare('PRAGMA table_info(products)').all();
  if (!productsCols.some(col => col.name === 'tax_slab_id')) {
    db.prepare('ALTER TABLE products ADD COLUMN tax_slab_id TEXT').run();
  }
  if (!productsCols.some(col => col.name === 'min_stock')) {
    db.prepare('ALTER TABLE products ADD COLUMN min_stock INTEGER DEFAULT 0').run();
  }
  if (!productsCols.some(col => col.name === 'reorder_quantity')) {
    db.prepare('ALTER TABLE products ADD COLUMN reorder_quantity INTEGER DEFAULT 0').run();
  }

  // Suppliers Migration
  const suppliersCols = db.prepare('PRAGMA table_info(suppliers)').all();
  if (!suppliersCols.some(col => col.name === 'supplier_code')) {
    db.prepare('ALTER TABLE suppliers ADD COLUMN supplier_code TEXT').run();
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(supplier_code)').run();
  }
  if (!suppliersCols.some(col => col.name === 'payment_term_id')) {
    db.prepare('ALTER TABLE suppliers ADD COLUMN payment_term_id TEXT').run();
  }

  // Receiving Module Migrations
  const receivingsCols = db.prepare('PRAGMA table_info(receivings)').all();
  if (receivingsCols.length > 0 && !receivingsCols.some(col => col.name === 'sync_status')) {
    console.log('[DB] Migrating receivings table: adding sync_status');
    db.prepare('ALTER TABLE receivings ADD COLUMN sync_status INTEGER DEFAULT 0').run();
  }

  const receivingItemsCols = db.prepare('PRAGMA table_info(receiving_items)').all();
  if (receivingItemsCols.length > 0 && !receivingItemsCols.some(col => col.name === 'sync_status')) {
    console.log('[DB] Migrating receiving_items table: adding sync_status');
    db.prepare('ALTER TABLE receiving_items ADD COLUMN sync_status INTEGER DEFAULT 0').run();
  }

  // Password Hashing Migration
  const usersToHash = db.prepare("SELECT id, password FROM users").all();
  for (const user of usersToHash) {
    // Check if it's already a bcrypt hash (starts with $2a$ or $2b$)
    if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      console.log(`[DB] Hashing plain-text password for user: ${user.id}`);
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, user.id);
    }
  }

  // Phase 6: Performance Indices (Ensure existing DBs get them)
  db.prepare('CREATE INDEX IF NOT EXISTS idx_sales_date_store ON sales(store_id, date)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_products_store_active ON products(store_id, is_deleted)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_stock_logs_product ON stock_logs(product_id)').run();
} catch (err) {
  console.error('[DB] Migration Error:', err);
}

// Initialize device_id if not present
let deviceId = db.prepare('SELECT value FROM settings WHERE key = ?').get('device_id')?.value
if (!deviceId) {
  deviceId = crypto.randomUUID()
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('device_id', deviceId)
  console.log(`Generated new device_id: ${deviceId}`)
} else {
  console.log(`Existing device_id: ${deviceId}`)
}

// Seed initial data if tables are empty
try {
  const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get().count
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count
  console.log(`Current DB status - Stores: ${storeCount}, Products: ${productCount}`)

  if (storeCount === 0 || productCount === 0) {
    console.log('Seeding initial data...')

    // Insert stores (only if missing)
    if (storeCount === 0) {
      db.prepare(`INSERT INTO stores (id, name, branch, address, phone, device_id) VALUES (?, ?, ?, ?, ?, ?)`).run(
        'store-1', 'Hardware Central', 'Main Branch', '123 Industrial Ave', '+1 555-0100', deviceId
      )
    }

    // Insert users
    db.prepare(`INSERT INTO users (id, name, email, role, store_id, device_id) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'user-1', 'John Admin', 'admin@hardware.com', 'admin', 'store-1', deviceId
    )

    // Insert accounts
    db.prepare(`INSERT INTO accounts (id, name, type, balance, store_id, device_id) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'acc-1', 'Main Cash', 'cash', 5000, 'store-1', deviceId
    )

    // Insert demo products with barcodes
    const products = [
      ['prod-1', 'Power Drill 18V', 'PWR-001', 'Power Tools', 89.99, 55.00, 24, 'store-1', 'Pcs', 'DeWalt', '12345678'],
      ['prod-2', 'Hammer Claw 16oz', 'HND-002', 'Hand Tools', 19.99, 8.50, 56, 'store-1', 'Pcs', 'Stanley', '87654321'],
      ['prod-3', 'Screwdriver Set 12pc', 'HND-003', 'Hand Tools', 29.99, 12.00, 38, 'store-1', 'Set', 'Craftsman', '11223344'],
    ]

    const insertProduct = db.prepare(`
      INSERT INTO products (id, name, sku, category, selling_price, purchase_price, quantity, store_id, unit, brand, barcode, device_id, last_used)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)

    products.forEach(p => {
      console.log(`Inserting product: ${p[1]}`)
      const params = [...p]
      params.splice(11, 0, deviceId) // Insert deviceId at correct position
      insertProduct.run(...params)
    })

    console.log('Initial data seeded successfully!')
  }

  // Seed Attendance & Leaves for AI Testing
  const attendanceCount = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='attendance'").get()
    ? db.prepare('SELECT COUNT(*) as count FROM attendance').get().count
    : 0;

  if (attendanceCount === 0) {
    // Only seed if user-1 exists (FK safety)
    const userExists = db.prepare("SELECT id FROM users WHERE id = 'user-1'").get()
    if (userExists) {
      console.log('Seeding initial attendance data...')
      const userId = 'user-1'
      const today = new Date()

      // Disable FK checks during seeding to avoid order issues
      db.pragma('foreign_keys = OFF')

      try {
        const insertAtt = db.prepare(`INSERT OR IGNORE INTO attendance (id, user_id, date, check_in, check_out, status, store_id, updated_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)`)

        for (let i = 30; i > 0; i--) {
          const d = new Date(today)
          d.setDate(d.getDate() - i)
          const dateStr = d.toISOString().split('T')[0]
          if (d.getDay() === 0) continue // Skip Sundays

          const isLate = d.getDay() === 1 || Math.random() < 0.2
          const checkInHour = isLate ? 10 : 9
          const checkInMin = Math.floor(Math.random() * 30)
          const checkInTime = new Date(d)
          checkInTime.setHours(checkInHour, checkInMin, 0)
          const checkOutTime = new Date(d)
          checkOutTime.setHours(18, 0, 0)

          insertAtt.run(
            `att-seed-${i}`, userId, dateStr,
            checkInTime.toISOString(), checkOutTime.toISOString(),
            isLate ? 'late' : 'present', 'store-1'
          )
        }

        // Seed Leaves (only if leaves table exists)
        const leavesExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='leaves'").get()
        if (leavesExists) {
          db.prepare(`INSERT OR IGNORE INTO leaves (id, user_id, start_date, end_date, type, reason, status, store_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
            .run('leave-seed-1', userId, '2023-11-10', '2023-11-11', 'sick', 'Fever', 'approved', 'store-1')
        }
      } finally {
        db.pragma('foreign_keys = ON')
      }
    } else {
      console.log('Skipping attendance seed: user-1 not found')
    }
  }

} catch (err) {
  console.error('Error during database initialization/seeding:', err.message)
}


// Helper to convert snake_case to camelCase
const toCamelCase = (obj) => {
  if (!obj) return obj
  const newObj = {}
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
    newObj[camelKey] = obj[key]
  }
  return newObj
}

// Database helper functions
const dbHelpers = {
  // Products
  getAllProducts: (storeId) => {
    const products = db.prepare('SELECT * FROM products WHERE store_id = ? AND is_deleted = 0 ORDER BY updated_at DESC').all(storeId)
    console.log(`getAllProducts for store ${storeId}: found ${products.length} products`)
    if (products.length > 0) {
      console.log(`Sample product from DB:`, JSON.stringify(toCamelCase(products[0])))
    }
    return products.map(toCamelCase)
  },

  getProductByBarcode: (barcode, storeId) => {
    const product = db.prepare('SELECT * FROM products WHERE barcode = ? AND store_id = ?').get(barcode, storeId)
    return product ? toCamelCase(product) : null
  },

  addProduct: (product) => {
    const stmt = db.prepare(`
      INSERT INTO products (id, name, sku, category, selling_price, purchase_price, quantity, store_id, last_used, unit, brand, barcode, min_stock, reorder_quantity, device_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    stmt.run(
      product.id, product.name, product.sku, product.category,
      product.sellingPrice, product.purchasePrice, product.quantity,
      product.storeId, product.lastUsed, product.unit, product.brand,
      product.barcode, product.minStock || 0, product.reorderQuantity || 0, deviceId
    )
    const result = db.prepare('SELECT * FROM products WHERE id = ?').get(product.id)
    return toCamelCase(result)
  },

  updateProduct: (id, updates) => {
    const fields = []
    const values = []

    const fieldMap = {
      name: 'name',
      sellingPrice: 'selling_price',
      purchasePrice: 'purchase_price',
      quantity: 'quantity',
      sku: 'sku',
      category: 'category',
      unit: 'unit',
      brand: 'brand',
      barcode: 'barcode',
      minStock: 'min_stock',
      reorderQuantity: 'reorder_quantity',
      lastUsed: 'last_used'
    }

    Object.keys(updates).forEach(key => {
      if (fieldMap[key]) {
        fields.push(`${fieldMap[key]} = ?`)
        values.push(updates[key])
      }
    })

    if (fields.length === 0) return null

    fields.push(`updated_at = datetime('now')`)
    fields.push(`sync_status = 0`) // Dirty flag
    values.push(id)

    const stmt = db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(...values)

    // Log Manual Stock Change if Quantity changed
    if (updates.quantity !== undefined) {
      // We need previous quantity to calculate change? 
      // Actually current updateProduct implementation doesn't fetch pre-state inside the transaction easily without extra query.
      // But we are in "updateProduct" which is generic.
      // Ideally we should calculate the diff.
      // Let's rely on the caller or just log "Manual Update".
      // BUT, to calculate shrinkage we need the INTENT.
      // If `quantity` is passed, we assume it's a manual adjustment (Audit).
      // We can fetch the product BEFORE update (which we didn't do here efficiently, but let's do it for safety).
      // Wait, the `updateProduct` function in `db.cjs` (lines 506-542) builds the query dynamically.
      // I should modify it to fetch the current product first if quantity is being updated.

      // NOTE: This might be slightly inefficient but required for audit.
      // Optimization: Only fetch if quantity is in updates.
    }

    const result = db.prepare('SELECT * FROM products WHERE id = ?').get(id)
    return toCamelCase(result)
  },

  updateProductWithLog: (id, updates, userId = 'system', reason = 'Manual Edit') => {
    // Wrapper to handle logging manually
    // First get current
    const current = db.prepare('SELECT quantity, store_id, name FROM products WHERE id = ?').get(id)

    const result = dbHelpers.updateProduct(id, updates)

    if (current && updates.quantity !== undefined && current.quantity !== updates.quantity) {
      const diff = updates.quantity - current.quantity
      db.prepare(`
            INSERT INTO stock_logs (id, product_id, product_name, store_id, quantity_change, reason, device_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).run(
        `log-${Date.now()}`,
        id,
        current.name,
        current.store_id,
        diff,
        reason,
        deviceId
      )
    }
    return result
  },

  deleteProduct: (id) => {
    // Soft Delete
    return db.prepare("UPDATE products SET is_deleted = 1, sync_status = 0, updated_at = datetime('now') WHERE id = ?").run(id)
  },

  // Customers
  getAllCustomers: (storeId) => {
    const customers = db.prepare('SELECT * FROM customers WHERE store_id = ? ORDER BY updated_at DESC').all(storeId)
    return customers.map(toCamelCase)
  },

  addCustomer: (customer) => {
    const stmt = db.prepare(`
      INSERT INTO customers (id, name, phone, email, area, credit_balance, total_purchases, store_id, joined_at, device_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    stmt.run(
      customer.id, customer.name, customer.phone, customer.email,
      customer.area, customer.creditBalance || 0, customer.totalPurchases || 0,
      customer.storeId, customer.joinedAt, deviceId
    )
    const result = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer.id)
    return toCamelCase(result)
  },

  updateCustomer: (id, updates) => {
    const fields = []
    const values = []

    const fieldMap = {
      name: 'name',
      phone: 'phone',
      email: 'email',
      area: 'area',
      creditBalance: 'credit_balance',
      totalPurchases: 'total_purchases'
    }

    Object.keys(updates).forEach(key => {
      if (fieldMap[key]) {
        fields.push(`${fieldMap[key]} = ?`)
        values.push(updates[key])
      }
    })

    if (fields.length === 0) return null

    fields.push(`updated_at = datetime('now')`)
    fields.push(`sync_status = 0`) // Dirty flag for sync
    values.push(id)

    const stmt = db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(...values)
    const result = db.prepare('SELECT * FROM customers WHERE id = ?').get(id)
    return toCamelCase(result)
  },

  // Sales
  updateAccountBalance: (accountId, amount) => {
    const stmt = db.prepare('UPDATE accounts SET balance = balance + ?, sync_status = 0, updated_at = datetime(\'now\') WHERE id = ?')
    stmt.run(amount, accountId)
  },

  getAllSales: (storeId) => {
    const sales = db.prepare('SELECT * FROM sales WHERE store_id = ? ORDER BY date DESC').all(storeId)
    return sales.map(sale => {
      const camelSale = toCamelCase(sale)
      return { ...camelSale, items: JSON.parse(camelSale.items) }
    })
  },

  processSale: (sale) => {
    const transaction = db.transaction(() => {
      // 1. Validate Stock & Credit Limit (INSIDE TRANSACTION)
      const items = sale.items
      for (const item of items) {
        const product = db.prepare('SELECT id, quantity, name, is_kit FROM products WHERE id = ?').get(item.productId)
        if (!product) throw new Error(`Product ${item.productName} not found via ID`)

        if (product.is_kit) {
          const components = db.prepare('SELECT product_id, quantity FROM kit_items WHERE kit_id = ?').all(item.productId)
          if (components.length === 0) throw new Error(`Kit ${product.name} has no components!`)

          for (const comp of components) {
            const compProduct = db.prepare('SELECT quantity, name FROM products WHERE id = ?').get(comp.product_id)
            const totalNeeded = comp.quantity * item.quantity
            if (!compProduct || compProduct.quantity < totalNeeded) {
              throw new Error(`Insufficient stock for kit component ${compProduct?.name || comp.product_id}. Available: ${compProduct?.quantity || 0}, Needed: ${totalNeeded}`)
            }
          }
        } else {
          if (product.quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`)
          }
        }
      }

      // Check Credit Limit if credit sale
      if (sale.type === 'credit' && sale.customerId) {
        const customer = db.prepare('SELECT credit_balance, credit_limit, name FROM customers WHERE id = ?').get(sale.customerId)
        if (customer && customer.credit_limit !== null) {
          const potentialBalance = customer.credit_balance + sale.totalAmount
          if (potentialBalance > customer.credit_limit) {
            throw new Error(`Credit Limit Exceeded for ${customer.name}. Limit: $${customer.credit_limit}, Potential: $${potentialBalance.toFixed(2)}`)
          }
        }
      }

      // 2. Insert Sale
      const saleStmt = db.prepare(`
        INSERT INTO sales (id, invoice_number, type, status, items, subtotal, discount_amount, tax_amount, total_amount, profit, payment_mode, account_id, customer_id, store_id, date, quotation_id, device_id, updated_at, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)
      `)
      saleStmt.run(
        sale.id, sale.invoiceNumber, sale.type, sale.status || 'completed', JSON.stringify(sale.items),
        sale.subtotal || 0, sale.discountAmount || 0, sale.taxAmount || 0,
        sale.totalAmount, sale.profit, sale.paymentMode || 'cash', sale.accountId || 'acc-cash',
        sale.customerId, sale.storeId, sale.date, sale.quotationId, deviceId
      )

      // 2a. Insert Payments (Always generate records for audit)
      if (sale.payments && Array.isArray(sale.payments) && sale.payments.length > 0) {
        const payStmt = db.prepare(`
          INSERT INTO sale_payments (id, sale_id, payment_mode, amount, account_id, sync_status, updated_at)
          VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
        `)
        for (const p of sale.payments) {
          payStmt.run(p.id || crypto.randomUUID(), sale.id, p.paymentMode, p.amount, p.accountId)
          dbHelpers.updateAccountBalance(p.accountId, p.amount)
        }
      } else if (sale.type !== 'credit') {
        // Fallback: Create single payment record if not credit
        const payId = crypto.randomUUID()
        db.prepare(`
          INSERT INTO sale_payments (id, sale_id, payment_mode, amount, account_id, sync_status, updated_at)
          VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
        `).run(payId, sale.id, sale.paymentMode || 'cash', sale.totalAmount, sale.accountId || 'acc-cash')

        dbHelpers.updateAccountBalance(sale.accountId || 'acc-cash', sale.totalAmount)
      }

      // 2b. Handle Work Order
      if (sale.status === 'work_order' || sale.workOrder) {
        const wo = sale.workOrder || {}
        db.prepare(`
          INSERT INTO work_orders (id, sale_id, status, notes, store_id, updated_at, sync_status)
          VALUES (?, ?, ?, ?, ?, datetime('now'), 0)
        `).run(wo.id || crypto.randomUUID(), sale.id, wo.status || 'pending', wo.notes || '', sale.storeId)
      }

      // 2c. Handle Delivery
      if (sale.status === 'delivery' || sale.delivery) {
        const del = sale.delivery || {}
        if (del.employeeId) {
          const driver = db.prepare('SELECT is_driver FROM users WHERE id = ?').get(del.employeeId)
          if (!driver || driver.is_driver !== 1) {
            throw new Error(`Assignment Failed: User ${del.employeeId} is not a registered driver.`)
          }
        }
        db.prepare(`
          INSERT INTO deliveries (id, sale_id, employee_id, address, delivery_charge, is_cod, status, delivery_date, store_id, updated_at, sync_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)
        `).run(
          del.id || crypto.randomUUID(), sale.id, del.employeeId, del.address || '',
          del.deliveryCharge || 0, del.isCod ? 1 : 0, del.status || 'pending',
          del.deliveryDate, sale.storeId
        )
      }

      // 3. Update Stock & Logs
      const updateStockStmt = db.prepare('UPDATE products SET quantity = quantity - ?, last_used = ?, updated_at = datetime(\'now\'), sync_status = 0 WHERE id = ?')
      const logStmt = db.prepare(`
        INSERT INTO stock_logs (id, product_id, product_name, store_id, quantity_change, reason, reference_id, device_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      for (const item of items) {
        const product = db.prepare('SELECT is_kit FROM products WHERE id = ?').get(item.productId)
        if (product && product.is_kit) {
          const components = db.prepare('SELECT k.product_id, k.quantity, p.name FROM kit_items k JOIN products p ON k.product_id = p.id WHERE k.kit_id = ?').all(item.productId)
          for (const comp of components) {
            const compNeeded = comp.quantity * item.quantity
            updateStockStmt.run(compNeeded, new Date().toISOString(), comp.product_id)
            logStmt.run(
              `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              comp.product_id, comp.name, sale.storeId, -compNeeded, 'KIT_SALE_PART',
              sale.invoiceNumber, deviceId
            )
          }
        } else {
          updateStockStmt.run(item.quantity, new Date().toISOString(), item.productId)
          logStmt.run(
            `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            item.productId, item.productName, sale.storeId, -item.quantity, 'SALE',
            sale.invoiceNumber, deviceId
          )
        }
      }

      // 5. Update Customer (if credit)
      if (sale.type === 'credit' && sale.customerId) {
        const updateCustomerStmt = db.prepare('UPDATE customers SET credit_balance = credit_balance + ?, total_purchases = total_purchases + ?, sync_status = 0, updated_at = datetime(\'now\') WHERE id = ?')
        updateCustomerStmt.run(sale.totalAmount, sale.totalAmount, sale.customerId)
      }
      else if (sale.customerId) {
        const updateCustomerPurchasesStmt = db.prepare('UPDATE customers SET total_purchases = total_purchases + ?, sync_status = 0, updated_at = datetime(\'now\') WHERE id = ?')
        updateCustomerPurchasesStmt.run(sale.totalAmount, sale.customerId)
      }

      // Feature 5: Sales Commission (If userId present)
      if (sale.userId) {
        const commissionPercentage = 2.0 // Configurable default
        const commissionAmount = (sale.totalAmount * commissionPercentage) / 100
        const commStmt = db.prepare(`
          INSERT INTO commissions (id, user_id, sale_id, amount, percentage, sync_status)
          VALUES (?, ?, ?, ?, ?, 0)
        `)
        commStmt.run(`${sale.id}-comm`, sale.userId, sale.id, commissionAmount, commissionPercentage)
      }

      // Feature 7: Loyalty Points
      if (sale.customerId) {
        const points = Math.floor(sale.totalAmount / 100) // 1 point per 100 rs
        if (points > 0) {
          dbHelpers.addLoyaltyPoints({
            id: `${sale.id}-lp`,
            customerId: sale.customerId,
            points: points,
            reason: `Sale ${sale.invoiceNumber}`,
            saleId: sale.id
          })
        }
      }

      // 6. Handle Quotation Conversion
      if (sale.quotationId) {
        db.prepare("UPDATE quotations SET status = 'converted', updated_at = datetime('now') WHERE id = ?").run(sale.quotationId)
      }
    })

    // Execute Transaction
    transaction()

    // Return the inserted sale to confirm
    const result = db.prepare('SELECT * FROM sales WHERE id = ?').get(sale.id)
    const camelSale = toCamelCase(result)
    return { ...camelSale, items: JSON.parse(camelSale.items) }
  },

  // Legacy fallback (should ideally use processSale)
  addSale: (sale) => {
    return dbHelpers.processSale(sale) // Redirect to new logic
  },

  // Generic getters
  getAllStores: () => db.prepare('SELECT * FROM stores').all().map(toCamelCase),
  getAllUsers: () => db.prepare('SELECT id, name, email, username, first_name, last_name, role, is_staff, is_active, store_id, avatar, password FROM users').all().map(toCamelCase),

  getDashboardMetrics: (storeId) => {
    const today = new Date().toISOString().split('T')[0]

    // 1. Sales Metrics
    const salesMetrics = db.prepare(`
      SELECT 
        SUM(total_amount) as total_revenue,
        SUM(profit) as total_profit,
        COUNT(*) as total_sales,
        SUM(CASE WHEN date >= ? THEN total_amount ELSE 0 END) as today_revenue,
        SUM(CASE WHEN date >= ? THEN profit ELSE 0 END) as today_profit
      FROM sales 
      WHERE store_id = ?
    `).get(today, today, storeId)

    // 2. Inventory Metrics
    const inventoryMetrics = db.prepare(`
      SELECT 
        SUM(quantity) as total_items,
        SUM(quantity * purchase_price) as inventory_value,
        COUNT(CASE WHEN quantity <= min_stock AND is_deleted = 0 THEN 1 END) as low_stock_count
      FROM products 
      WHERE store_id = ? AND is_deleted = 0
    `).get(storeId)

    // 3. Customers
    const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers WHERE store_id = ?').get(storeId).count

    // 4. Recent Activity (Last 5 Sales)
    const recentSales = db.prepare(`
      SELECT s.id, s.invoice_number, s.total_amount, s.date, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.store_id = ?
      ORDER BY s.date DESC
      LIMIT 5
    `).all(storeId).map(toCamelCase)

    // 5. Low Stock Items
    const lowStockItems = db.prepare(`
      SELECT id, name, quantity, min_stock, sku
      FROM products
      WHERE store_id = ? AND quantity <= min_stock AND is_deleted = 0
      ORDER BY quantity ASC
      LIMIT 5
    `).all(storeId).map(toCamelCase)

    return {
      revenue: salesMetrics.total_revenue || 0,
      todayRevenue: salesMetrics.today_revenue || 0,
      profit: salesMetrics.total_profit || 0,
      todayProfit: salesMetrics.today_profit || 0,
      totalSales: salesMetrics.total_sales || 0,
      inventoryValue: inventoryMetrics.inventory_value || 0,
      totalItems: inventoryMetrics.total_items || 0,
      lowStockCount: inventoryMetrics.low_stock_count || 0,
      customerCount,
      recentSales,
      lowStockItems
    }
  },

  addUser: (user) => {
    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, username, first_name, last_name, password, role, is_staff, is_active, store_id, avatar, device_id, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)
    `)
    const nameParts = (user.name || '').split(' ', 1)
    const firstName = user.firstName || nameParts[0] || ''
    const lastName = user.lastName || (user.name || '').split(' ').slice(1).join(' ') || ''

    // Hash password if present
    const password = user.password ? bcrypt.hashSync(user.password, 10) : null;

    stmt.run(
      user.id, user.name, user.email, user.username || user.email,
      firstName, lastName, password, user.role,
      user.isStaff ? 1 : (user.role === 'admin' ? 1 : 0),
      user.isActive !== false ? 1 : 0,  // Default to active
      user.storeId, user.avatar, deviceId
    )
    const result = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id)
    return toCamelCase(result)
  },

  updateUser: (id, updates) => {
    const fields = []
    const values = []
    const fieldMap = {
      name: 'name',
      email: 'email',
      username: 'username',
      firstName: 'first_name',
      lastName: 'last_name',
      role: 'role',
      isStaff: 'is_staff',
      isActive: 'is_active',
      storeId: 'store_id',
      avatar: 'avatar',
      password: 'password'
    }
    Object.keys(updates).forEach(key => {
      if (fieldMap[key]) {
        fields.push(`${fieldMap[key]} = ?`)
        let val = updates[key];
        if (key === 'password' && val) {
          val = bcrypt.hashSync(val, 10);
        }
        values.push(val)
      }
    })
    if (fields.length === 0) return dbHelpers.getAllUsers().find(u => u.id === id)
    values.push(id)
    db.prepare(`UPDATE users SET ${fields.join(', ')}, updated_at = datetime('now'), sync_status = 0 WHERE id = ?`).run(...values)
    const result = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    return toCamelCase(result)
  },

  verifyPassword: (id, password) => {
    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(id)
    if (!user || !user.password) return false
    return bcrypt.compareSync(password, user.password)
  },

  verifySupervisor: (code) => {
    const admins = db.prepare("SELECT id, password FROM users WHERE role IN ('admin', 'super_admin')").all();
    for (const admin of admins) {
      if (admin.password && bcrypt.compareSync(code, admin.password)) {
        return true;
      }
    }
    return false;
  },

  toggleDriverStatus: (userId, isDriver) => {
    db.prepare('UPDATE users SET is_driver = ?, updated_at = datetime(\'now\'), sync_status = 0 WHERE id = ?').run(isDriver ? 1 : 0, userId)
    return toCamelCase(db.prepare('SELECT * FROM users WHERE id = ?').get(userId))
  },

  // Suppliers
  getAllSuppliers: (storeId) => {
    const suppliers = db.prepare('SELECT * FROM suppliers WHERE store_id = ? AND is_deleted = 0 ORDER BY updated_at DESC').all(storeId)
    return suppliers.map(toCamelCase)
  },

  addSupplier: (supplier) => {
    const stmt = db.prepare(`
      INSERT INTO suppliers (
        id, supplier_code, company_name, first_name, last_name, email, phone, website,
        address_line1, address_line2, city, state, zip_code, country,
        account_number, opening_balance, payment_term_id, credit_limit, tax_number, currency,
        current_balance, internal_notes, comments, logo, documents, status, rating,
        is_preferred, is_blacklisted, store_id, device_id, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    stmt.run(
      supplier.id, supplier.supplierCode || null, supplier.companyName, supplier.firstName, supplier.lastName,
      supplier.email, supplier.phone, supplier.website, supplier.addressLine1,
      supplier.addressLine2, supplier.city, supplier.state, supplier.zipCode,
      supplier.country, supplier.accountNumber, supplier.openingBalance || 0,
      supplier.paymentTermId || null, supplier.creditLimit || 0, supplier.taxNumber,
      supplier.currency || 'USD', supplier.currentBalance || supplier.openingBalance || 0,
      supplier.internalNotes, supplier.comments, supplier.logo, supplier.documents,
      supplier.status || 'active', supplier.rating || 5, supplier.isPreferred ? 1 : 0,
      supplier.isBlacklisted ? 1 : 0, supplier.storeId, deviceId
    )
    const result = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(supplier.id)
    return toCamelCase(result)
  },

  updateSupplier: (id, updates) => {
    const fields = []
    const values = []

    const fieldMap = {
      companyName: 'company_name',
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      phone: 'phone',
      website: 'website',
      addressLine1: 'address_line1',
      addressLine2: 'address_line2',
      city: 'city',
      state: 'state',
      zipCode: 'zip_code',
      country: 'country',
      accountNumber: 'account_number',
      openingBalance: 'opening_balance',
      paymentTermId: 'payment_term_id',
      supplierCode: 'supplier_code',
      creditLimit: 'credit_limit',
      taxNumber: 'tax_number',
      currency: 'currency',
      currentBalance: 'current_balance',
      internalNotes: 'internal_notes',
      comments: 'comments',
      logo: 'logo',
      documents: 'documents',
      status: 'status',
      rating: 'rating',
      isPreferred: 'is_preferred',
      isBlacklisted: 'is_blacklisted'
    }

    Object.keys(updates).forEach(key => {
      if (fieldMap[key]) {
        fields.push(`${fieldMap[key]} = ?`)
        values.push(key.startsWith('is') ? (updates[key] ? 1 : 0) : updates[key])
      }
    })

    if (fields.length === 0) return null

    fields.push(`updated_at = datetime('now')`)
    fields.push(`sync_status = 0`)
    values.push(id)

    const stmt = db.prepare(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(...values)

    const result = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id)
    return toCamelCase(result)
  },

  deleteSupplier: (id) => {
    return db.prepare("UPDATE suppliers SET is_deleted = 1, sync_status = 0, updated_at = datetime('now'), deleted_at = datetime('now') WHERE id = ?").run(id)
  },

  // Supplier Transactions
  getSupplierTransactions: (supplierId) => {
    const transactions = db.prepare('SELECT * FROM supplier_transactions WHERE supplier_id = ? ORDER BY date DESC').all(supplierId)
    return transactions.map(toCamelCase)
  },

  addSupplierTransaction: (tx) => {
    const stmt = db.prepare(`
      INSERT INTO supplier_transactions (id, supplier_id, type, amount, balance_after, date, reference_id, description, store_id, device_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      tx.id, tx.supplierId, tx.type, tx.amount, tx.balanceAfter,
      tx.date, tx.referenceId, tx.description, tx.storeId, deviceId
    )

    // Update supplier current balance
    db.prepare('UPDATE suppliers SET current_balance = ?, sync_status = 0 WHERE id = ?').run(tx.balanceAfter, tx.supplierId)

    const result = db.prepare('SELECT * FROM supplier_transactions WHERE id = ?').get(tx.id)
    return toCamelCase(result)
  },

  getSupplierLedger: (supplierId) => {
    const supplier = db.prepare('SELECT company_name FROM suppliers WHERE id = ?').get(supplierId)
    if (!supplier) return []

    // Get all purchases for supplier
    const purchases = db.prepare(`
      SELECT 'PURCHASE' as type, invoice_number as reference, total_amount as debit, 0 as credit, date 
      FROM purchases WHERE supplier = ?
    `).all(supplier.company_name)

    // Get all payments (transactions) for supplier
    const txs = db.prepare(`
      SELECT 'PAYMENT' as type, reference_id as reference, 0 as debit, amount as credit, date 
      FROM supplier_transactions WHERE supplier_id = ?
    `).all(supplierId)

    // Combine and sort by date ascending for balance calculation
    const ledger = [...purchases, ...txs].sort((a, b) => new Date(a.date) - new Date(b.date))

    let balance = 0
    return ledger.map(row => {
      balance += (row.debit - row.credit)
      return { ...row, cumulative_balance: balance }
    }).reverse() // Reverse for descending view in UI
  },

  // Payment Terms
  getPaymentTerms: (storeId) => {
    return db.prepare('SELECT * FROM payment_terms WHERE store_id = ? ORDER BY days ASC').all(storeId).map(toCamelCase)
  },
  addPaymentTerm: (term) => {
    db.prepare('INSERT INTO payment_terms (id, name, days, store_id, updated_at) VALUES (?, ?, ?, ?, datetime(\'now\'))')
      .run(term.id, term.name, term.days, term.storeId)
    return toCamelCase(db.prepare('SELECT * FROM payment_terms WHERE id = ?').get(term.id))
  },

  // Supplier Documents
  getSupplierDocuments: (supplierId) => {
    return db.prepare('SELECT * FROM supplier_documents WHERE supplier_id = ? ORDER BY uploaded_at DESC').all(supplierId).map(toCamelCase)
  },
  addSupplierDocument: (doc) => {
    db.prepare('INSERT INTO supplier_documents (id, supplier_id, name, file_path, file_type, store_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(doc.id, doc.supplierId, doc.name, doc.filePath, doc.fileType, doc.storeId)
    return toCamelCase(db.prepare('SELECT * FROM supplier_documents WHERE id = ?').get(doc.id))
  },

  // Supplier Custom Fields
  getSupplierCustomFields: (storeId) => {
    const fields = db.prepare('SELECT * FROM supplier_custom_fields WHERE store_id = ? ORDER BY name ASC').all(storeId)
    return fields.map(toCamelCase)
  },

  addSupplierCustomField: (field) => {
    const stmt = db.prepare(`
      INSERT INTO supplier_custom_fields (id, name, field_type, is_required, show_on_receipt, hide_label, options, store_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    stmt.run(
      field.id, field.name, field.fieldType, field.isRequired ? 1 : 0,
      field.showOnReceipt ? 1 : 0, field.hideLabel ? 1 : 0, field.options, field.storeId
    )
    const result = db.prepare('SELECT * FROM supplier_custom_fields WHERE id = ?').get(field.id)
    return toCamelCase(result)
  },

  getSupplierCustomValues: (supplierId) => {
    const values = db.prepare('SELECT * FROM supplier_custom_values WHERE supplier_id = ?').all(supplierId)
    return values.map(toCamelCase)
  },

  saveSupplierCustomValue: (val) => {
    const stmt = db.prepare(`
      INSERT INTO supplier_custom_values (id, supplier_id, field_id, value, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `)
    stmt.run(val.id, val.supplierId, val.fieldId, val.value)
    return true
  },

  // ── Receiving Module ──────────────────────────────────────────
  getReceivings: (storeId) => {
    const receivings = db.prepare(`
      SELECT r.*, s.company_name as supplier_name 
      FROM receivings r 
      JOIN suppliers s ON r.supplier_id = s.id 
      WHERE r.store_id = ? 
      ORDER BY r.updated_at DESC
    `).all(storeId)
    return receivings.map(toCamelCase)
  },

  getReceivingById: (id) => {
    const stmt = db.prepare(`
      SELECT r.*, s.company_name as supplier_name 
      FROM receivings r 
      JOIN suppliers s ON r.supplier_id = s.id 
      WHERE r.id = ?
    `)
    const receiving = stmt.get(id)
    if (!receiving) return null

    const items = db.prepare('SELECT * FROM receiving_items WHERE receiving_id = ?').all(id)
    return {
      ...toCamelCase(receiving),
      items: items.map(toCamelCase)
    }
  },

  addReceiving: (receiving) => {
    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO receivings (
          id, receiving_number, supplier_id, purchase_order_id, total_amount, 
          discount_total, amount_paid, amount_due, account_id, status, notes, 
          custom_fields, store_id, device_id, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(
        receiving.id, receiving.receivingNumber, receiving.supplierId,
        receiving.purchaseOrderId || null, receiving.totalAmount,
        receiving.discountTotal || 0, receiving.amountPaid || 0,
        receiving.amountDue || receiving.totalAmount, receiving.accountId || null,
        receiving.status || 'draft', receiving.notes,
        receiving.customFields || null, receiving.storeId, deviceId
      )

      if (receiving.items && receiving.items.length > 0) {
        const itemStmt = db.prepare(`
          INSERT INTO receiving_items (
            id, receiving_id, product_id, product_name, cost, quantity, 
            discount_pct, total, batch_number, expiry_date, serial_number, 
            location, selling_price, upc, description, store_id, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `)

        for (const item of receiving.items) {
          itemStmt.run(
            item.id, receiving.id, item.productId, item.productName,
            item.cost, item.quantity, item.discountPct || 0, item.total,
            item.batchNumber, item.expiryDate, item.serialNumber,
            item.location, item.sellingPrice, item.upc, item.description,
            receiving.storeId
          )
        }
      }
    })

    transaction()
    return dbHelpers.getReceivingById(receiving.id)
  },

  updateReceiving: (id, updates) => {
    const fields = []
    const values = []
    const fieldMap = {
      status: 'status',
      notes: 'notes',
      customFields: 'custom_fields',
      amountPaid: 'amount_paid',
      amountDue: 'amount_due',
      accountId: 'account_id'
    }

    Object.keys(updates).forEach(key => {
      if (fieldMap[key]) {
        fields.push(`${fieldMap[key]} = ?`)
        values.push(updates[key])
      }
    })

    if (fields.length > 0) {
      fields.push(`updated_at = datetime('now')`)
      fields.push(`sync_status = 0`)
      values.push(id)
      db.prepare(`UPDATE receivings SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    }

    // Special case: update items if provided
    if (updates.items) {
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM receiving_items WHERE receiving_id = ?').run(id)
        const itemStmt = db.prepare(`
          INSERT INTO receiving_items (
            id, receiving_id, product_id, product_name, cost, quantity, 
            discount_pct, total, batch_number, expiry_date, serial_number, 
            location, selling_price, upc, description, store_id, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `)

        const receiving = db.prepare('SELECT store_id FROM receivings WHERE id = ?').get(id)
        for (const item of updates.items) {
          itemStmt.run(
            item.id, id, item.productId, item.productName,
            item.cost, item.quantity, item.discountPct || 0, item.total,
            item.batchNumber, item.expiryDate, item.serialNumber,
            item.location, item.sellingPrice, item.upc, item.description,
            receiving.store_id
          )
        }
      })
      transaction()
    }

    return dbHelpers.getReceivingById(id)
  },

  completeReceiving: (id, accountId, amountPaid) => {
    const transaction = db.transaction(() => {
      const receiving = dbHelpers.getReceivingById(id)
      if (!receiving || receiving.status === 'completed') return { success: false, error: 'Invalid or already completed' }

      // 1. Update Product Quantities & Purchase Prices
      const updateProdStmt = db.prepare('UPDATE products SET quantity = quantity + ?, purchase_price = ?, updated_at = datetime(\'now\'), sync_status = 0 WHERE id = ?')
      const logStmt = db.prepare(`
        INSERT INTO stock_logs (id, product_id, product_name, store_id, quantity_change, reason, reference_id, device_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      for (const item of receiving.items) {
        updateProdStmt.run(item.quantity, item.cost, item.productId)
        logStmt.run(`${id}-${item.productId}-log`, item.productId, item.productName, receiving.storeId, item.quantity, 'receiving', receiving.receivingNumber, deviceId)
      }

      // 2. Create Supplier Transaction (Purchase) & Update Balance
      const supplier = db.prepare('SELECT id, COALESCE(current_balance, 0) as current_balance FROM suppliers WHERE id = ?').get(receiving.supplierId)
      if (!supplier) throw new Error(`Supplier ${receiving.supplierId} not found`)

      const newBalance = supplier.current_balance + receiving.totalAmount

      // Atomic Balance Update
      db.prepare('UPDATE suppliers SET current_balance = ?, updated_at = datetime(\'now\'), sync_status = 0 WHERE id = ?').run(newBalance, receiving.supplierId)

      dbHelpers.addSupplierTransaction({
        id: `stx-${Date.now()}`,
        supplierId: receiving.supplierId,
        type: 'purchase',
        amount: receiving.totalAmount,
        balanceAfter: newBalance,
        date: new Date().toISOString(),
        referenceId: receiving.receivingNumber,
        description: `Receiving #${receiving.receivingNumber}`,
        storeId: receiving.storeId
      })

      // 3. Update Purchase Order Status if linked
      if (receiving.purchaseOrderId) {
        db.prepare("UPDATE purchase_orders SET status = 'received', updated_at = datetime('now'), sync_status = 0 WHERE id = ?").run(receiving.purchaseOrderId)
      }

      // 4. Update Receiving Header
      db.prepare(`
        UPDATE receivings 
        SET status = 'completed', amount_paid = ?, amount_due = ?, account_id = ?, 
            completed_at = datetime('now'), updated_at = datetime('now'), sync_status = 0 
        WHERE id = ?
      `).run(amountPaid, receiving.totalAmount - amountPaid, accountId || null, id)

      // 5. If payment made, create payment transaction
      if (amountPaid > 0) {
        const balanceAfterPayment = newBalance - amountPaid
        dbHelpers.addSupplierTransaction({
          id: `stx-${Date.now()}-pay`,
          supplierId: receiving.supplierId,
          type: 'payment',
          amount: amountPaid,
          balanceAfter: balanceAfterPayment,
          date: new Date().toISOString(),
          referenceId: receiving.receivingNumber,
          description: `Payment for Receiving #${receiving.receivingNumber}`,
          storeId: receiving.storeId
        })

        // Update account balance
        if (accountId) {
          dbHelpers.updateAccountBalance(accountId, -amountPaid)
        }
      }
    })

    transaction()
    return { success: true }
  },

  suspendReceiving: (id) => {
    db.prepare("UPDATE receivings SET status = 'suspended', updated_at = datetime('now'), sync_status = 0 WHERE id = ?").run(id)
    return { success: true }
  },

  addReceivingPayment: (id, amount, accountId) => {
    const transaction = db.transaction(() => {
      const receiving = db.prepare('SELECT * FROM receivings WHERE id = ?').get(id)
      if (!receiving) return { success: false, error: 'Not found' }

      const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(receiving.supplier_id)
      const newBalance = supplier.current_balance - amount

      dbHelpers.addSupplierTransaction({
        id: `stx-${Date.now()}`,
        supplierId: receiving.supplier_id,
        type: 'payment',
        amount: amount,
        balanceAfter: newBalance,
        date: new Date().toISOString(),
        referenceId: receiving.receiving_number,
        description: `Partial payment for #${receiving.receiving_number}`,
        storeId: receiving.store_id
      })

      db.prepare('UPDATE receivings SET amount_paid = amount_paid + ?, amount_due = amount_due - ?, account_id = ?, updated_at = datetime(\'now\'), sync_status = 0 WHERE id = ?')
        .run(amount, amount, accountId, id)

      if (accountId) {
        dbHelpers.updateAccountBalance(accountId, -amount)
      }
    })
    transaction()
    return { success: true }
  },

  deleteReceiving: (id) => {
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM receiving_items WHERE receiving_id = ?').run(id)
      db.prepare('DELETE FROM receivings WHERE id = ?').run(id)
    })
    transaction()
    return { success: true }
  },

  // ── Invoice Module ──────────────────────────────────────────
  getInvoices: (storeId) => {
    const invoices = db.prepare(`
      SELECT i.*, 
             c.name as customer_name,
             s.company_name as supplier_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.store_id = ?
      ORDER BY i.date DESC
    `).all(storeId)
    return invoices.map(toCamelCase)
  },

  getInvoiceById: (id) => {
    const invoice = db.prepare(`
      SELECT i.*, 
             c.name as customer_name,
             s.company_name as supplier_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.id = ?
    `).get(id)

    if (!invoice) return null

    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id)
    return {
      ...toCamelCase(invoice),
      items: items.map(toCamelCase)
    }
  },

  createInvoice: (invoice) => {
    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO invoices (
          id, invoice_number, type, status, customer_id, supplier_id,
          date, due_date, subtotal, discount_amount, tax_amount,
          total_amount, amount_paid, amount_due, notes, store_id,
          device_id, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(
        invoice.id, invoice.invoiceNumber, invoice.type, invoice.status || 'draft',
        invoice.customerId || null, invoice.supplierId || null, invoice.date,
        invoice.dueDate || null, invoice.subtotal || 0, invoice.discountAmount || 0,
        invoice.taxAmount || 0, invoice.totalAmount || 0, invoice.amountPaid || 0,
        invoice.amountDue || invoice.totalAmount, invoice.notes || null,
        invoice.storeId, deviceId
      )

      if (invoice.items && invoice.items.length > 0) {
        const itemStmt = db.prepare(`
          INSERT INTO invoice_items (
            id, invoice_id, product_id, description, quantity, unit_price,
            discount_amount, tax_amount, total, store_id, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `)

        for (const item of invoice.items) {
          itemStmt.run(
            item.id, invoice.id, item.productId || null, item.description || null,
            item.quantity, item.unitPrice, item.discountAmount || 0,
            item.taxAmount || 0, item.total, invoice.storeId
          )
        }
      }
    })

    transaction()
    return dbHelpers.getInvoiceById(invoice.id)
  },

  updateInvoice: (id, updates) => {
    const fields = []
    const values = []
    const fieldMap = {
      status: 'status',
      dueDate: 'due_date',
      amountPaid: 'amount_paid',
      amountDue: 'amount_due',
      notes: 'notes'
    }

    Object.keys(updates).forEach(key => {
      if (fieldMap[key]) {
        fields.push(`${fieldMap[key]} = ?`)
        values.push(updates[key])
      }
    })

    if (fields.length > 0) {
      fields.push(`updated_at = datetime('now')`)
      fields.push(`sync_status = 0`)
      values.push(id)
      db.prepare(`UPDATE invoices SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    }

    if (updates.items) {
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id)
        const itemStmt = db.prepare(`
          INSERT INTO invoice_items (
            id, invoice_id, product_id, description, quantity, unit_price,
            discount_amount, tax_amount, total, store_id, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `)

        const inv = db.prepare('SELECT store_id FROM invoices WHERE id = ?').get(id)
        for (const item of updates.items) {
          itemStmt.run(
            item.id, id, item.productId || null, item.description || null,
            item.quantity, item.unitPrice, item.discountAmount || 0,
            item.taxAmount || 0, item.total, inv.store_id
          )
        }
      })
      transaction()
    }

    return dbHelpers.getInvoiceById(id)
  },

  deleteInvoice: (id) => {
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id)
      db.prepare('DELETE FROM invoices WHERE id = ?').run(id)
    })
    transaction()
    return { success: true }
  },


  deleteUser: (id) => {
    // Delete all dependent records first
    db.prepare('DELETE FROM employees WHERE user_id = ?').run(id)
    db.prepare('DELETE FROM commissions WHERE user_id = ?').run(id)
    db.prepare('DELETE FROM attendance WHERE user_id = ?').run(id)
    db.prepare('DELETE FROM leaves WHERE user_id = ?').run(id)
    db.prepare('DELETE FROM shifts WHERE user_id = ?').run(id)

    return db.prepare('DELETE FROM users WHERE id = ?').run(id)
  },

  getAllAccounts: (storeId) => db.prepare('SELECT * FROM accounts WHERE store_id = ?').all(storeId).map(toCamelCase),
  getAllQuotations: (storeId) => {
    const quotations = db.prepare('SELECT * FROM quotations WHERE store_id = ? ORDER BY date DESC').all(storeId)
    return quotations.map(q => {
      const camelQ = toCamelCase(q)
      return { ...camelQ, items: JSON.parse(camelQ.items) }
    })
  },
  getAllPurchases: (storeId) => {
    const purchases = db.prepare('SELECT * FROM purchases WHERE store_id = ? ORDER BY date DESC').all(storeId)
    return purchases.map(p => {
      const camelP = toCamelCase(p)
      return { ...camelP, items: JSON.parse(camelP.items) }
    })
  },
  getAllTransactions: (storeId) => db.prepare('SELECT * FROM transactions WHERE store_id = ? ORDER BY date DESC').all(storeId).map(toCamelCase),

  addQuotation: (quotation) => {
    const stmt = db.prepare(`
      INSERT INTO quotations (id, quotation_number, items, total_amount, customer_id, customer_name, customer_phone, store_id, date, expiry_date, status, notes, device_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    return stmt.run(
      quotation.id, quotation.quotationNumber, JSON.stringify(quotation.items),
      quotation.totalAmount, quotation.customerId, quotation.customerName,
      quotation.customerPhone, quotation.storeId, quotation.date,
      quotation.expiryDate, quotation.status, quotation.notes, deviceId
    )
  },

  // Atomic Purchase Processing
  processPurchase: (purchase) => {
    const transaction = db.transaction(() => {
      // 1. Insert Purchase
      const stmt = db.prepare(`
        INSERT INTO purchases (id, invoice_number, supplier, type, items, total_amount, store_id, account_id, date, device_id, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      stmt.run(
        purchase.id, purchase.invoiceNumber, purchase.supplier, purchase.type,
        JSON.stringify(purchase.items), purchase.totalAmount, purchase.storeId,
        purchase.accountId, purchase.date, deviceId
      )

      // 2. Update Stock & Logs
      // Simplified: Just update quantity for now. Price strategy is complex (FIFO/LIFO/Avg). 
      // Let's assume we might want to update the product's purchase price to the latest one, or keep it.
      // For now: update quantity.
      const updateStockStmt = db.prepare('UPDATE products SET quantity = quantity + ?, updated_at = datetime(\'now\'), sync_status = 0 WHERE id = ?')

      const logStmt = db.prepare(`
        INSERT INTO stock_logs (id, product_id, product_name, store_id, quantity_change, reason, reference_id, device_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      for (const item of purchase.items) {
        updateStockStmt.run(item.quantity, item.productId)

        logStmt.run(
          `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          item.productId,
          item.productName,
          purchase.storeId,
          item.quantity, // Positive change
          'PURCHASE',
          purchase.invoiceNumber,
          deviceId
        )
      }

      // 3. Update Account Balance (Deduct Money)
      if (purchase.type === 'cash') {
        dbHelpers.updateAccountBalance(purchase.accountId, -purchase.totalAmount)
      }
    })

    transaction()
    return { success: true }
  },

  addPurchase: (purchase) => {
    return dbHelpers.processPurchase(purchase)
  },

  addTransaction: (transaction) => {
    const stmt = db.prepare(`
      INSERT INTO transactions (id, type, amount, description, customer_id, customer_name, store_id, account_id, date, device_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    stmt.run(
      transaction.id, transaction.type, transaction.amount, transaction.description,
      transaction.customerId, transaction.customerName, transaction.storeId,
      transaction.accountId, transaction.date, deviceId
    )

    // Update Account Balance
    const adjustment = transaction.type === 'cash_in' ? transaction.amount : -transaction.amount;
    dbHelpers.updateAccountBalance(transaction.accountId, adjustment)

    // Update Customer Balance if relevant
    if (transaction.customerId && transaction.type === 'cash_in') {
      const updateCustomerStmt = db.prepare('UPDATE customers SET credit_balance = credit_balance - ?, sync_status = 0, updated_at = datetime(\'now\') WHERE id = ?')
      updateCustomerStmt.run(transaction.amount, transaction.customerId)
    }

    return true
  },

  // Advanced ERP Features Phase 11
  // ... existing Phase 11 code ...

  // HR & Attendance Features (Phase 1)
  checkIn: (userId, storeId) => {
    const today = new Date().toISOString().split('T')[0]
    const existing = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(userId, today)

    if (existing) {
      throw new Error('User already checked in today.')
    }

    const stmt = db.prepare(`
      INSERT INTO attendance (id, user_id, date, check_in, status, store_id, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 0)
    `)

    const id = `att-${Date.now()}`
    const checkInTime = new Date().toISOString()
    // Simple logic: Late if after 9:30 AM
    const hour = new Date().getHours()
    const minute = new Date().getMinutes()
    let status = 'present'
    if (hour > 9 || (hour === 9 && minute > 30)) {
      status = 'late'
    }

    stmt.run(id, userId, today, checkInTime, status, storeId)
    return { success: true, checkInTime, status }
  },

  checkOut: (userId) => {
    const today = new Date().toISOString().split('T')[0]
    const existing = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(userId, today)

    if (!existing) {
      throw new Error('No check-in record found for today.')
    }

    const checkOutTime = new Date().toISOString()
    db.prepare('UPDATE attendance SET check_out = ?, updated_at = datetime(\'now\'), sync_status = 0 WHERE id = ?').run(checkOutTime, existing.id)
    return { success: true, checkOutTime }
  },

  getAttendance: (userId, startDate, endDate) => {
    // If no dates provided, get last 30 days
    if (!startDate) {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      startDate = d.toISOString().split('T')[0]
      endDate = new Date().toISOString().split('T')[0]
    }

    if (userId) {
      return db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC').all(userId, startDate, endDate).map(toCamelCase)
    } else {
      // Admin view: all users
      return db.prepare('SELECT a.*, u.name as user_name, u.avatar FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.date BETWEEN ? AND ? ORDER BY a.date DESC').all(startDate, endDate).map(toCamelCase)
    }
  },

  applyLeave: (leave) => {
    const stmt = db.prepare(`
        INSERT INTO leaves (id, user_id, start_date, end_date, type, reason, status, store_id, updated_at, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)
    `)
    const id = `leave-${Date.now()}`
    stmt.run(id, leave.userId, leave.startDate, leave.endDate, leave.type, leave.reason, 'pending', leave.storeId)
    return { success: true, id }
  },

  getLeaves: (storeId) => {
    return db.prepare(`
      SELECT l.*, u.name as user_name, u.role as user_role 
      FROM leaves l 
      JOIN users u ON l.user_id = u.id 
      WHERE l.store_id = ? 
      ORDER BY l.start_date DESC
    `).all(storeId).map(toCamelCase)
  },

  updateLeaveStatus: (id, status) => {
    return db.prepare("UPDATE leaves SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id)
  },

  // Shifts
  getShifts: (storeId, startDate, endDate) => {
    let query = `
      SELECT s.*, u.name as user_name, u.role as user_role 
      FROM shifts s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.store_id = ?
    `
    const params = [storeId]

    if (startDate && endDate) {
      query += ` AND s.start_time BETWEEN ? AND ?`
      params.push(startDate, endDate)
    }

    query += ` ORDER BY s.start_time ASC`

    return db.prepare(query).all(...params).map(toCamelCase)
  },

  assignShift: (shift) => {
    const stmt = db.prepare(`
      INSERT INTO shifts (id, user_id, store_id, start_time, end_time, type, status, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    stmt.run(
      shift.id, shift.userId, shift.storeId, shift.startTime,
      shift.endTime, shift.type, 'assigned'
    )
    return toCamelCase(db.prepare('SELECT * FROM shifts WHERE id = ?').get(shift.id))
  },

  deleteShift: (id) => {
    return db.prepare("DELETE FROM shifts WHERE id = ?").run(id)
  },

  // Performance & Risk
  getStaffPerformanceData: (storeId, startDate, endDate) => {
    // 1. Sales Performance (Total Sales, Count, Avg Value)
    // Simplified query focusing on sales attributed via commissions for now


    return db.prepare(`
        SELECT 
            u.id as user_id, 
            u.name, 
            COUNT(c.id) as sale_count, 
            COALESCE(SUM(c.amount), 0) / (COALESCE(c.percentage, 2.0)/100.0) as estimated_revenue -- Reverse calc if needed, or just sum sales.total_amount joined
        FROM users u
        LEFT JOIN commissions c ON u.id = c.user_id
        LEFT JOIN sales s ON c.sale_id = s.id
        WHERE u.store_id = ? AND s.date BETWEEN ? AND ?
        GROUP BY u.id
    `).all(storeId, startDate, endDate).map(toCamelCase)
    // Wait, let's look at the complexity.
    // If I want to verify "Sales", I should probably link Sales to Users. 
    // But since schema doesn't have it, I'll rely on Commissions for now as "Sales driven by user".
  },

  getInventoryShrinkage: (storeId, startDate, endDate) => {
    return db.prepare(`
        SELECT sl.*, p.name as product_name, p.sku
        FROM stock_logs sl
        JOIN products p ON sl.product_id = p.id
        WHERE sl.store_id = ? 
        AND sl.reason != 'SALE' -- Filter out normal sales
        AND sl.created_at BETWEEN ? AND ?
        ORDER BY sl.created_at DESC
    `).all(storeId, startDate, endDate).map(toCamelCase)
  },

  // 1. Stock Transfers
  processStockTransfer: (transfer) => {
    const transaction = db.transaction(() => {
      // Create transfer record
      const stmt = db.prepare(`
        INSERT INTO stock_transfers (id, product_id, from_store_id, to_store_id, quantity, status, device_id, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, datetime('now'))
      `)
      stmt.run(transfer.id, transfer.productId, transfer.fromStoreId, transfer.toStoreId, transfer.quantity, deviceId)

      // If status is completed, update stock in both stores
      // (Simplified: In this system, products are scoped to store_id. 
      // If we move across stores, we might need to find/create the product in the target store.)
      // Let's assume the product must exist in both stores with the same SKU or Barcode.
    })
    transaction()
    return { success: true }
  },
  getStockTransfers: (storeId) => {
    return db.prepare('SELECT * FROM stock_transfers WHERE from_store_id = ? OR to_store_id = ? ORDER BY updated_at DESC').all(storeId, storeId).map(toCamelCase)
  },

  // 4. Expense Categories
  getExpenseCategories: () => db.prepare('SELECT * FROM expense_categories').all().map(toCamelCase),
  addExpenseCategory: (cat) => {
    db.prepare("INSERT INTO expense_categories (id, name, parent_id, updated_at) VALUES (?, ?, ?, datetime('now'))")
      .run(cat.id, cat.name, cat.parentId)
    return db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(cat.id)
  },

  // 6. Tax Management
  getTaxSlabs: () => db.prepare('SELECT * FROM tax_slabs').all().map(toCamelCase),
  addTaxSlab: (slab) => {
    db.prepare("INSERT INTO tax_slabs (id, name, percentage, updated_at) VALUES (?, ?, ?, datetime('now'))")
      .run(slab.id, slab.name, slab.percentage)
    return db.prepare('SELECT * FROM tax_slabs WHERE id = ?').get(slab.id)
  },

  // 7. Loyalty Program
  addLoyaltyPoints: (points) => {
    db.prepare('INSERT INTO loyalty_points (id, customer_id, points, reason, sale_id) VALUES (?, ?, ?, ?, ?)')
      .run(points.id, points.customerId, points.points, points.reason, points.saleId)
    return true
  },
  getLoyaltyPoints: (customerId) => {
    return db.prepare('SELECT * FROM loyalty_points WHERE customer_id = ? ORDER BY updated_at DESC').all(customerId).map(toCamelCase)
  },

  // 3. Customer Ledger
  getCustomerLedger: (customerId) => {
    // Get all sales for customer
    const sales = db.prepare(`
      SELECT 'SALE' as type, invoice_number as reference, total_amount as debit, 0 as credit, date 
      FROM sales WHERE customer_id = ?
    `).all(customerId)

    // Get all payments (transactions) for customer
    const txs = db.prepare(`
      SELECT 'PAYMENT' as type, type as reference, 0 as debit, amount as credit, date 
      FROM transactions WHERE customer_id = ? AND type = 'cash_in'
    `).all(customerId)

    // Combine and sort by date ascending for balance calculation
    const ledger = [...sales, ...txs].sort((a, b) => new Date(a.date) - new Date(b.date))

    let balance = 0
    return ledger.map(row => {
      balance += (row.debit - row.credit)
      return { ...row, cumulative_balance: balance }
    }).reverse() // Reverse for descending view in UI
  },

  // 2. Purchase Orders
  getPurchaseOrders: (storeId) => db.prepare('SELECT * FROM purchase_orders WHERE store_id = ?').all(storeId).map(toCamelCase),
  addPurchaseOrder: (po) => {
    db.prepare('INSERT INTO purchase_orders (id, supplier, items, total_amount, status, store_id, date) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(po.id, po.supplier, JSON.stringify(po.items), po.totalAmount, po.status || 'draft', po.storeId, po.date)
    return true
  },

  // 8. Barcode Designer/Printer (Utility)
  generateBarcode: (sku) => {
    // Return a mock SVG as a data URI
    const barcodeText = `${sku}-${Date.now().toString().slice(-4)}`
    const bars = barcodeText.split('').map((c, i) => {
      const width = (c.charCodeAt(0) % 4) + 1
      return `<rect x="${i * 10}" y="0" width="${width}" height="40" fill="black"/>`
    }).join('')

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="250" height="80">
        <rect width="250" height="80" fill="white"/>
        <g transform="translate(10,10)">
          ${bars}
        </g>
        <text x="125" y="70" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle" fill="black">${barcodeText}</text>
      </svg>
    `
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  },

  // Stores
  addStore: (store) => {
    const stmt = db.prepare(`
      INSERT INTO stores (id, name, branch, address, phone, device_id, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 0)
    `)
    stmt.run(store.id, store.name, store.branch, store.address, store.phone, deviceId)
    return dbHelpers.getAllStores().find(s => s.id === store.id)
  },

  updateStore: (id, updates) => {
    const fields = []
    const values = []
    const fieldMap = {
      name: 'name',
      branch: 'branch',
      address: 'address',
      phone: 'phone'
    }
    Object.keys(updates).forEach(key => {
      if (fieldMap[key]) {
        fields.push(`${fieldMap[key]} = ?`)
        values.push(updates[key])
      }
    })
    if (fields.length === 0) return null
    fields.push(`updated_at = datetime('now')`)
    fields.push(`sync_status = 0`)
    values.push(id)
    db.prepare(`UPDATE stores SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return dbHelpers.getAllStores().find(s => s.id === id)
  },

  deleteStore: (id) => {
    // Only allow deletion if no dependencies exist (optional safety check)
    // For now, we'll just soft delete or hard delete. Let's do hard delete for simplicity in this MVP,
    // but ideally we should check for related records.
    // Given the user wants "add store", delete is also expected.

    db.prepare('DELETE FROM stores WHERE id = ?').run(id)
    return { success: true, id }
  },

  // Settings
  getSetting: (key) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
    return row ? row.value : null
  },

  setSetting: (key, value) => {
    return db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value))
  },

  // Candidates / Hiring
  getCandidates: (storeId) => {
    return db.prepare(`SELECT * FROM candidates WHERE store_id = ? ORDER BY updated_at DESC`).all(storeId).map(toCamelCase)
  },

  addCandidate: (candidate) => {
    const stmt = db.prepare(`
      INSERT INTO candidates (id, name, email, phone, role, status, resume_text, score, skills, store_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    stmt.run(
      candidate.id, candidate.name, candidate.email, candidate.phone,
      candidate.role, candidate.status || 'applied', candidate.resumeText,
      candidate.score || 0, candidate.skills, candidate.storeId
    )
    return toCamelCase(db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidate.id))
  },

  updateCandidateStatus: (id, status) => {
    return db.prepare("UPDATE candidates SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id)
  },

  getCommissions: (storeId) => {
    return db.prepare('SELECT * FROM commissions WHERE sale_id IN (SELECT id FROM sales WHERE store_id = ?)').all(storeId).map(toCamelCase)
  },

  getLoyaltyPoints: (customerId) => {
    return db.prepare('SELECT * FROM loyalty_points WHERE customer_id = ? ORDER BY created_at DESC').all(customerId).map(toCamelCase)
  },

  // Employees (HR)
  getEmployees: (storeId) => {
    return db.prepare(`
      SELECT e.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.store_id = ?
      ORDER BY e.updated_at DESC
    `).all(storeId).map(e => {
      const camelE = toCamelCase(e)
      // Ensure user name is normalized for the frontend item
      return {
        ...camelE,
        user: {
          name: e.user_name || e.user_email?.split('@')[0] || e.user_id?.split('-')[1] || 'Staff Member'
        },
        documents: JSON.parse(camelE.documents || '[]')
      }
    })
  },

  addEmployee: (employee) => {
    const stmt = db.prepare(`
      INSERT INTO employees (id, user_id, department, designation, salary, joining_date, documents, store_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    stmt.run(
      employee.id, employee.userId, employee.department, employee.designation,
      employee.salary, employee.joiningDate, JSON.stringify(employee.documents || []),
      employee.storeId
    )
    return toCamelCase(db.prepare('SELECT * FROM employees WHERE id = ?').get(employee.id))
  },

  // Item Kits CRUD
  getAllItemKits: (storeId) => {
    const kits = db.prepare('SELECT * FROM item_kits WHERE store_id = ? ORDER BY name').all(storeId).map(toCamelCase)
    return kits.map(kit => {
      const items = db.prepare('SELECT product_id, quantity FROM kit_items WHERE kit_id = ?').all(kit.id).map(toCamelCase)
      return { ...kit, items }
    })
  },

  addItemKit: (kit) => {
    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO item_kits (id, name, sku, category, selling_price, store_id, is_active, updated_at, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)
      `).run(kit.id, kit.name, kit.sku || null, kit.category, kit.sellingPrice, kit.storeId, kit.isActive ? 1 : 0)

      const itemStmt = db.prepare('INSERT INTO kit_items (id, kit_id, product_id, quantity) VALUES (?, ?, ?, ?)')
      for (const item of kit.items) {
        itemStmt.run(`${kit.id}-${item.productId}`, kit.id, item.productId, item.quantity)
      }
    })
    transaction()
    return dbHelpers.getAllItemKits(kit.storeId).find(k => k.id === kit.id)
  },

  updateItemKit: (id, updates) => {
    const transaction = db.transaction(() => {
      if (updates.name || updates.sku || updates.category || updates.sellingPrice !== undefined || updates.isActive !== undefined) {
        const fields = []
        const values = []
        const fieldMap = {
          name: 'name',
          sku: 'sku',
          category: 'category',
          sellingPrice: 'selling_price',
          isActive: 'is_active'
        }
        Object.keys(updates).forEach(key => {
          if (fieldMap[key] !== undefined) {
            fields.push(`${fieldMap[key]} = ?`)
            values.push(key === 'isActive' ? (updates[key] ? 1 : 0) : updates[key])
          }
        })
        if (fields.length > 0) {
          values.push(id)
          db.prepare(`UPDATE item_kits SET ${fields.join(', ')}, updated_at = datetime('now'), sync_status = 0 WHERE id = ?`).run(...values)
        }
      }

      if (updates.items) {
        db.prepare('DELETE FROM kit_items WHERE kit_id = ?').run(id)
        const itemStmt = db.prepare('INSERT INTO kit_items (id, kit_id, product_id, quantity) VALUES (?, ?, ?, ?)')
        for (const item of updates.items) {
          itemStmt.run(`${id}-${item.productId}`, id, item.productId, item.quantity)
        }
      }
    })
    transaction()
    const kit = db.prepare('SELECT * FROM item_kits WHERE id = ?').get(id)
    return kit ? dbHelpers.getAllItemKits(kit.store_id).find(k => k.id === id) : null
  },

  deleteItemKit: (id) => {
    db.prepare('DELETE FROM kit_items WHERE kit_id = ?').run(id)
    db.prepare('DELETE FROM item_kits WHERE id = ?').run(id)
    return { success: true }
  },

  // Custom Fields CRUD
  getAllCustomFields: () => {
    return db.prepare('SELECT * FROM custom_fields ORDER BY label').all().map(toCamelCase).map(f => ({
      ...f,
      options: f.options ? JSON.parse(f.options) : [],
      isRequired: !!f.isRequired,
      showOnReceipt: !!f.showOnReceipt
    }))
  },

  addCustomField: (field) => {
    db.prepare(`
      INSERT INTO custom_fields (id, label, type, options, is_required, show_on_receipt, target_type, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)
    `).run(
      field.id, field.label, field.type,
      JSON.stringify(field.options || []),
      field.isRequired ? 1 : 0,
      field.showOnReceipt ? 1 : 0,
      field.targetType
    )
    return dbHelpers.getAllCustomFields().find(f => f.id === field.id)
  },

  updateCustomField: (id, updates) => {
    const fields = []
    const values = []
    const fieldMap = {
      label: 'label',
      type: 'type',
      options: 'options',
      isRequired: 'is_required',
      showOnReceipt: 'show_on_receipt',
      targetType: 'target_type'
    }
    Object.keys(updates).forEach(key => {
      if (fieldMap[key]) {
        fields.push(`${fieldMap[key]} = ?`)
        let val = updates[key]
        if (key === 'options') val = JSON.stringify(val)
        if (key === 'isRequired' || key === 'showOnReceipt') val = val ? 1 : 0
        values.push(val)
      }
    })
    if (fields.length > 0) {
      values.push(id)
      db.prepare(`UPDATE custom_fields SET ${fields.join(', ')}, updated_at = datetime('now'), sync_status = 0 WHERE id = ?`).run(...values)
    }
    return dbHelpers.getAllCustomFields().find(f => f.id === id)
  },

  deleteCustomField: (id) => {
    db.prepare('DELETE FROM product_custom_values WHERE field_id = ?').run(id)
    db.prepare('DELETE FROM custom_fields WHERE id = ?').run(id)
    return { success: true }
  },

  getProductCustomValues: (productId) => {
    return db.prepare('SELECT field_id, value FROM product_custom_values WHERE product_id = ?').all(productId).map(toCamelCase)
  },

  getAllProductCustomValues: () => {
    return db.prepare('SELECT * FROM product_custom_values').all().map(toCamelCase)
  },

  updateProductCustomValues: (productId, values) => {
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM product_custom_values WHERE product_id = ?').run(productId)
      const stmt = db.prepare('INSERT INTO product_custom_values (id, product_id, field_id, value) VALUES (?, ?, ?, ?)')
      for (const val of values) {
        stmt.run(`${productId}-${val.fieldId}`, productId, val.fieldId, val.value)
      }
    })
    transaction()
    return dbHelpers.getProductCustomValues(productId)
  },

  // Bulk Product Actions
  bulkDeleteProducts: (ids) => {
    const placeholders = ids.map(() => '?').join(',')
    // Correctly handle stock logs and dependencies if needed, or just soft delete
    db.prepare(`UPDATE products SET is_deleted = 1, updated_at = datetime('now'), sync_status = 0 WHERE id IN (${placeholders})`).run(...ids)
    return { success: true, count: ids.length }
  },

  bulkUpdateProducts: (ids, updates) => {
    const fields = []
    const values = []
    const fieldMap = {
      category: 'category',
      sellingPrice: 'selling_price',
      purchasePrice: 'purchase_price',
      unit: 'unit',
      brand: 'brand',
      barcodeEnabled: 'barcode_enabled'
    }
    Object.keys(updates).forEach(key => {
      if (fieldMap[key]) {
        fields.push(`${fieldMap[key]} = ?`)
        values.push(key === 'barcodeEnabled' ? (updates[key] ? 1 : 0) : updates[key])
      }
    })

    if (fields.length > 0) {
      const placeholders = ids.map(() => '?').join(',')
      db.prepare(`UPDATE products SET ${fields.join(', ')}, updated_at = datetime('now'), sync_status = 0 WHERE id IN (${placeholders})`).run(...values, ...ids)
      return { success: true, count: ids.length }
    }
    return { success: false, message: 'No updates provided' }
  },

  updateSale: (id, updates) => {
    const fields = []
    const values = []
    const fieldMap = {
      status: 'status',
      type: 'type',
      totalAmount: 'total_amount',
      profit: 'profit',
      paymentMode: 'payment_mode',
      accountId: 'account_id',
      customerId: 'customer_id',
    }
    Object.keys(updates).forEach(key => {
      if (fieldMap[key]) {
        fields.push(`${fieldMap[key]} = ?`)
        values.push(updates[key])
      }
    })
    if (fields.length === 0) return null
    fields.push(`updated_at = datetime('now')`)
    fields.push(`sync_status = 0`)
    values.push(id)
    db.prepare(`UPDATE sales SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return dbHelpers.getAllSales().find(s => s.id === id)
  },

  getGiftCards: (storeId) => db.prepare('SELECT * FROM gift_cards WHERE store_id = ?').all(storeId).map(toCamelCase),
  addGiftCard: (gc) => {
    db.prepare(`
      INSERT INTO gift_cards (id, card_number, value, balance, is_active, customer_id, store_id, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)
    `).run(gc.id, gc.cardNumber, gc.value, gc.balance, gc.isActive ? 1 : 0, gc.customerId, gc.storeId)
    return toCamelCase(db.prepare('SELECT * FROM gift_cards WHERE id = ?').get(gc.id))
  },
  updateGiftCard: (id, updates) => {
    const fields = []
    const values = []
    const fieldMap = {
      balance: 'balance',
      isActive: 'is_active',
      customerId: 'customer_id'
    }
    Object.keys(updates).forEach(key => {
      if (fieldMap[key] !== undefined) {
        fields.push(`${fieldMap[key]} = ?`)
        values.push(key === 'isActive' ? (updates[key] ? 1 : 0) : updates[key])
      }
    })
    if (fields.length === 0) return null
    values.push(id)
    db.prepare(`UPDATE gift_cards SET ${fields.join(', ')}, updated_at = datetime('now'), sync_status = 0 WHERE id = ?`).run(...values)
    return toCamelCase(db.prepare('SELECT * FROM gift_cards WHERE id = ?').get(id))
  },

  getWorkOrders: (storeId) => db.prepare('SELECT * FROM work_orders WHERE store_id = ?').all(storeId).map(toCamelCase),
  updateWorkOrder: (id, updates) => {
    const fields = []
    const values = []
    const fieldMap = {
      status: 'status',
      notes: 'notes'
    }
    Object.keys(updates).forEach(key => {
      if (fieldMap[key]) {
        fields.push(`${fieldMap[key]} = ?`)
        values.push(updates[key])
      }
    })
    if (fields.length === 0) return null
    values.push(id)
    db.prepare(`UPDATE work_orders SET ${fields.join(', ')}, updated_at = datetime('now'), sync_status = 0 WHERE id = ?`).run(...values)
    return toCamelCase(db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id))
  },

  getDeliveries: (storeId) => db.prepare('SELECT * FROM deliveries WHERE store_id = ?').all(storeId).map(toCamelCase),
  updateDelivery: (id, updates) => {
    const fields = []
    const values = []
    const fieldMap = {
      employeeId: 'employee_id',
      address: 'address',
      status: 'status',
      deliveryDate: 'delivery_date'
    }
    Object.keys(updates).forEach(key => {
      if (fieldMap[key]) {
        if (key === 'employeeId' && updates[key]) {
          const driver = db.prepare('SELECT is_driver FROM users WHERE id = ?').get(updates[key])
          if (!driver || driver.is_driver !== 1) {
            throw new Error(`Invalid Assignment: User is not a registered driver.`)
          }
        }
        fields.push(`${fieldMap[key]} = ?`)
        values.push(updates[key])
      }
    })
    if (fields.length === 0) return null
    values.push(id)
    db.prepare(`UPDATE deliveries SET ${fields.join(', ')}, updated_at = datetime('now'), sync_status = 0 WHERE id = ?`).run(...values)
    return toCamelCase(db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id))
  },

  // Delivery Zones
  getDeliveryZones: (storeId) => db.prepare('SELECT * FROM delivery_zones WHERE store_id = ?').all(storeId).map(toCamelCase),
  addDeliveryZone: (zone) => {
    db.prepare(`
      INSERT INTO delivery_zones (id, name, fee, is_active, store_id, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, datetime('now'), 0)
    `).run(zone.id, zone.name, zone.fee, zone.isActive ? 1 : 0, zone.storeId)
    return toCamelCase(db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(zone.id))
  },
  updateDeliveryZone: (id, updates) => {
    const fields = []
    const values = []
    const fieldMap = {
      name: 'name',
      fee: 'fee',
      isActive: 'is_active'
    }
    Object.keys(updates).forEach(key => {
      if (fieldMap[key] !== undefined) {
        fields.push(`${fieldMap[key]} = ?`)
        values.push(key === 'isActive' ? (updates[key] ? 1 : 0) : updates[key])
      }
    })
    if (fields.length === 0) return null
    values.push(id)
    db.prepare(`UPDATE delivery_zones SET ${fields.join(', ')}, updated_at = datetime('now'), sync_status = 0 WHERE id = ?`).run(...values)
    return toCamelCase(db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(id))
  },
  deleteDeliveryZone: (id) => {
    db.prepare('DELETE FROM delivery_zones WHERE id = ?').run(id)
    return { success: true }
  },

  // Store Configuration
  saveStoreConfig: (storeId, configData) => {
    const key = `store_config_${storeId}`;
    const stmt = db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(key, JSON.stringify(configData));
    return { success: true };
  },
  getStoreConfig: (storeId) => {
    const key = `store_config_${storeId}`;
    const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    if (result && result.value) {
      try {
        return JSON.parse(result.value);
      } catch (e) {
        console.error('Error parsing store config:', e);
        return null;
      }
    }
    return null;
  },

  // Cheques
  getAllCheques(storeId) {
    const results = db.prepare('SELECT * FROM cheques WHERE store_id = ? ORDER BY issue_date DESC').all(storeId)
    return results.map(toCamelCase)
  },

  addCheque(cheque) {
    const stmt = db.prepare(`
      INSERT INTO cheques (
        id, party_type, party_id, party_name, cheque_number, bank_name,
        amount, issue_date, clearing_date, status, store_id, notes, device_id
      ) VALUES (
        @id, @partyType, @partyId, @partyName, @chequeNumber, @bankName,
        @amount, @issueDate, @clearingDate, @status, @storeId, @notes, @deviceId
      )
    `)
    return stmt.run({
      clearingDate: null,
      notes: '',
      ...cheque,
      deviceId
    })
  },

  updateCheque(id, updates) {
    const fields = Object.keys(updates).map(key => {
      // camelCase to snake_case
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      return `${snakeKey} = @${key}`
    }).join(', ')

    // Always update updated_at and reset sync_status
    const stmt = db.prepare(`
      UPDATE cheques 
      SET ${fields}, updated_at = datetime('now'), sync_status = 0 
      WHERE id = @id
    `)
    return stmt.run({ ...updates, id })
  },

  deleteCheque(id) {
    return db.prepare('DELETE FROM cheques WHERE id = ?').run(id)
  },

  backup(destinationPath) {
    return db.backup(destinationPath)
  },

  getReportData(type, storeId, dateFrom, dateTo) {
    let query = ''
    const params = { storeId }

    // Date filter clause
    const dateFilter = (dateField) => {
      let clause = ''
      if (dateFrom) {
        clause += ` AND ${dateField} >= @dateFrom`
        params.dateFrom = dateFrom
      }
      if (dateTo) {
        clause += ` AND ${dateField} <= @dateTo`
        params.dateTo = dateTo
      }
      return clause
    }

    switch (type) {
      case 'sales_summary':
        query = `
          SELECT date, COUNT(*) as count, SUM(total_amount) as total, SUM(profit) as profit
          FROM sales 
          WHERE store_id = @storeId ${dateFilter('date')}
          GROUP BY date ORDER BY date DESC
        `
        break;

      case 'sales_by_product':
        // We parse the items JSON in JS usually, but for a report we might need a more complex query 
        // if we had a sale_items table. Let's check if we have sale_items. 
        // Looking at the schema, sales.items is a JSON string.
        // For production, a sale_items table is better. 
        // For now, we'll fetch sales and process in JS or use SQLite JSON if available.
        // better-sqlite3 supports JSON.
        query = `
          SELECT p.name, p.sku, SUM(json_extract(item.value, '$.quantity')) as qty, SUM(json_extract(item.value, '$.price') * json_extract(item.value, '$.quantity')) as revenue
          FROM sales s, json_each(s.items) as item
          JOIN products p ON p.id = json_extract(item.value, '$.productId')
          WHERE s.store_id = @storeId ${dateFilter('s.date')}
          GROUP BY p.id ORDER BY revenue DESC
        `
        break;

      case 'inventory_status':
        query = `
          SELECT name, sku, category, quantity, purchase_price, (quantity * purchase_price) as value
          FROM products 
          WHERE store_id = @storeId AND is_deleted = 0
          ORDER BY quantity ASC
        `
        break;

      case 'profit_loss':
        query = `
          SELECT 
            (SELECT SUM(total_amount) FROM sales WHERE store_id = @storeId ${dateFilter('date')}) as revenue,
            (SELECT SUM(profit) FROM sales WHERE store_id = @storeId ${dateFilter('date')}) as gross_profit,
            (SELECT SUM(total_amount) FROM receivings WHERE store_id = @storeId ${dateFilter('completed_at')}) as purchases,
            (SELECT SUM(amount) FROM transactions WHERE store_id = @storeId AND type = 'expense' ${dateFilter('date')}) as expenses
        `
        break;

      case 'tax_report':
        query = `
          SELECT invoice_number, date, total_amount, (total_amount - profit) as taxable_value, (total_amount * 0.18) as tax_amount -- Sample 18% tax logic
          FROM sales 
          WHERE store_id = @storeId ${dateFilter('date')}
          ORDER BY date DESC
        `
        break;

      case 'cheque_report':
        query = `
          SELECT party_name, party_type, cheque_number, bank_name, amount, issue_date, status
          FROM cheques 
          WHERE store_id = @storeId ${dateFilter('issue_date')}
          ORDER BY issue_date DESC
        `
        break;

      case 'hr_attendance':
        query = `
          SELECT u.name, a.date, a.check_in, a.check_out, a.status
          FROM attendance a
          JOIN users u ON u.id = a.user_id
          WHERE a.store_id = @storeId ${dateFilter('a.date')}
          ORDER BY a.date DESC
        `
        break;

      case 'purchases_summary':
        query = `
          SELECT supplier_id, (SELECT name FROM suppliers WHERE id = supplier_id) as supplier_name, 
                 COUNT(*) as count, SUM(total_amount) as total
          FROM receivings
          WHERE store_id = @storeId ${dateFilter('completed_at')}
          GROUP BY supplier_id
        `
        break;

      default:
        return []
    }

    try {
      const results = db.prepare(query).all(params)
      return results.map(toCamelCase)
    } catch (err) {
      console.error(`[Report] Error generating ${type}:`, err)
      return []
    }
  }
}

module.exports = { db, dbHelpers, deviceId }
