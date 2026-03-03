// ERP Demo Data - Hardware Store
import { create } from 'zustand';

import { persist } from 'zustand/middleware';
import { API_URL } from './config';
import { BarcodeResponse, InventoryRow, ExcelUploadSummary, validateBarcode } from './inventory-utils';
import { dbAdapter } from './db-adapter';
import { isElectron } from './electron-helper';
import { useState, useEffect } from "react";
import { generateId, generateInvoice } from './utils';

// Types
export type Role = 'admin' | 'staff' | 'user' | 'hr_manager' | 'super_admin' | 'sales_manager' | 'inventory_manager' | 'accountant' | 'employee';

export interface User {
  id: string;
  name: string;  // Display name (first + last)
  email: string;
  username?: string;  // For Django compatibility
  firstName?: string;
  lastName?: string;
  role: Role;
  isStaff?: boolean;
  isActive?: boolean;
  storeId?: string;
  avatar?: string;
  isDriver?: boolean;
  deviceId?: string;
  updatedAt?: string;
  password?: string;
}

export interface Store {
  id: string;
  name: string;
  branch: string;
  address: string;
  phone: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  sellingPrice: number;
  purchasePrice: number;
  quantity: number;
  storeId: string;
  lastUsed: string;
  unit?: string;
  brand?: string;
  updatedAt: string;
  barcode?: string;
  minStock?: number;
  reorderQuantity?: number;
  isKit?: boolean;
  limitedQty?: number;
  barcodeEnabled?: boolean;
}

export interface Employee {
  id: string;
  userId: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  documents: string[];
  storeId: string;
  updatedAt?: string;
  user?: {
    name: string;
    email?: string;
    avatar?: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  area?: string;
  creditBalance: number;
  creditLimit?: number | null;
  totalPurchases: number;
  storeId: string;
  joinedAt: string;
  deviceId?: string;
  updatedAt?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  purchasePrice?: number;
  gst?: number;
  gstAmount?: number;
  discountPct?: number;
  discountAmount?: number;
}

export interface SalePayment {
  id: string;
  saleId: string;
  paymentMode: 'cash' | 'card' | 'upi' | 'store_credit' | 'gift_card';
  amount: number;
  accountId: string;
  giftCardId?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  status: 'completed' | 'suspended' | 'work_order' | 'delivery' | 'returned';
  type: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  profit: number;
  paymentMode: string; // Legacy
  payments?: SalePayment[];
  accountId: string;
  customerId?: string;
  storeId: string;
  date: string;
  quotationId?: string;
  deviceId?: string;
  updatedAt?: string;
  workOrder?: Partial<WorkOrder>;
  delivery?: Partial<Delivery>;
}

export interface GiftCard {
  id: string;
  cardNumber: string;
  value: number;
  balance: number;
  isActive: boolean;
  customerId?: string;
  storeId: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  saleId: string;
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
  assignedTo?: string; // Employee Name or ID
  storeId: string;
  updatedAt: string;
}

export interface Cheque {
  id: string;
  partyType: 'supplier' | 'customer';
  partyId: string;
  partyName: string;
  chequeNumber: string;
  bankName: string;
  amount: number;
  issueDate: string;
  clearingDate?: string | null;
  status: 'pending' | 'cleared' | 'bounced' | 'cancelled';
  storeId: string;
  notes?: string;
  deviceId?: string;
  updatedAt?: string;
  syncStatus?: number;
}

export interface Delivery {
  id: string;
  saleId: string;
  employeeId?: string;
  address: string;
  deliveryCharge: number;
  isCod: boolean;
  status: 'pending' | 'dispatched' | 'delivered' | 'cancelled';
  assignedTo?: string; // Employee Name or ID
  deliveryDate?: string;
  storeId: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  revenue: number;
  todayRevenue: number;
  profit: number;
  todayProfit: number;
  totalSales: number;
  inventoryValue: number;
  totalItems: number;
  lowStockCount: number;
  customerCount: number;
  recentSales: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    date: string;
    customerName: string;
  }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    quantity: number;
    minStock: number;
    sku: string;
  }>;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  totalAmount: number;
  date: string;
  status: 'active' | 'converted' | 'expired';
  storeId: string;
  customerId?: string;
  deviceId?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'sale_return' | 'purchase' | 'expense' | 'cash_in' | 'cash_out';
  amount: number;
  description: string;
  customerId?: string;
  customerName?: string;
  storeId: string;
  accountId: string;
  date: string;
  referenceId?: string;
  category?: string;
  deviceId?: string;
  updatedAt?: string;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplier: string;
  type: 'cash' | 'credit';
  items: SaleItem[];
  totalAmount: number;
  storeId: string;
  accountId: string;
  date: string;
  deviceId?: string;
  updatedAt?: string;
}

export interface PaymentTerm {
  id: string;
  name: string;
  days: number;
  storeId: string;
  updatedAt: string;
}

export interface SupplierDocument {
  id: string;
  supplierId: string;
  name: string;
  filePath: string;
  fileType?: string;
  uploadedAt: string;
  storeId: string;
}

export interface Supplier {
  id: string;
  supplierCode?: string;
  companyName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  accountNumber?: string;
  openingBalance: number;
  paymentTermId?: string;
  creditLimit: number;
  taxNumber?: string;
  currency: string;
  currentBalance: number;
  internalNotes?: string;
  comments?: string;
  logo?: string;
  documents?: string; // JSON string (legacy or fallback)
  status: 'active' | 'disabled';
  rating: number;
  isPreferred: boolean;
  isBlacklisted: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  storeId: string;
  deviceId?: string;
  updatedAt: string;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  type: 'purchase' | 'payment' | 'credit_note' | 'opening_balance';
  amount: number;
  balanceAfter: number;
  date: string;
  referenceId?: string;
  description?: string;
  storeId: string;
  deviceId?: string;
  createdAt: string;
}

export interface SupplierCustomField {
  id: string;
  name: string;
  fieldType: 'text' | 'number' | 'date' | 'dropdown';
  isRequired: boolean;
  showOnReceipt: boolean;
  hideLabel: boolean;
  options?: string; // JSON string
  storeId: string;
  updatedAt: string;
}

export interface SupplierCustomValue {
  id: string;
  supplierId: string;
  fieldId: string;
  value: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'wallet';
  balance: number;
  storeId: string;
}

export interface ReceivingItem {
  id?: string;
  receivingId?: string;
  productId: string;
  productName: string;
  cost: number;
  quantity: number;
  discountPct: number;
  total: number;
  batchNumber?: string;
  expiryDate?: string;
  serialNumber?: string;
  location?: string;
  sellingPrice?: number;
  upc?: string;
  description?: string;
  storeId: string;
  updatedAt?: string;
}

export interface Receiving {
  id: string;
  receivingNumber: string;
  supplierId: string;
  supplierName?: string; // Loaded via join
  purchaseOrderId?: string;
  totalAmount: number;
  discountTotal: number;
  amountPaid: number;
  amountDue: number;
  accountId?: string;
  status: 'draft' | 'suspended' | 'completed' | 'returned';
  notes?: string;
  customFields?: string; // JSON string
  storeId: string;
  deviceId?: string;
  completedAt?: string;
  updatedAt: string;
  items?: ReceivingItem[]; // Nested items
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId?: string;
  productName?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  storeId: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'customer' | 'supplier';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  customerId?: string;
  supplierId?: string;
  customerName?: string;
  supplierName?: string;
  date: string;
  dueDate?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  storeId: string;
  updatedAt: string;
  items?: InvoiceItem[];
}


// Initial Demo Data
const initialStores: Store[] = [
  { id: 'store-1', name: 'Hardware Central', branch: 'Main Branch', address: '123 Industrial Ave', phone: '+1 555-0100' },
  { id: 'store-2', name: 'Hardware Central', branch: 'East Side', address: '456 Commerce St', phone: '+1 555-0200' },
];

const initialUsers: User[] = [
  { id: 'user-1', name: 'Burhanuddin', email: 'admin@moriswala.com', role: 'admin', storeId: 'store-1' },
  { id: 'user-2', name: 'Sales Assistant', email: 'sales@moriswala.com', role: 'staff', storeId: 'store-1' },
  { id: 'user-3', name: 'John Delivery', email: 'john@moriswala.com', role: 'staff', storeId: 'store-1' },
  { id: 'user-4', name: 'Sarah Tech', email: 'sarah@moriswala.com', role: 'staff', storeId: 'store-1' },
  { id: 'user-5', name: 'Mike Sales', email: 'mike@hardware.com', role: 'staff', storeId: 'store-2' },
];

const initialProducts: Product[] = [
  { id: 'prod-1', name: 'Power Drill 18V', sku: 'PWR-001', category: 'Power Tools', sellingPrice: 89.99, purchasePrice: 55.00, quantity: 24, storeId: 'store-1', lastUsed: '2024-01-15', unit: 'Pcs', brand: 'DeWalt', updatedAt: '2024-01-10', barcode: '12345678' },
  { id: 'prod-2', name: 'Hammer Claw 16oz', sku: 'HND-002', category: 'Hand Tools', sellingPrice: 19.99, purchasePrice: 8.50, quantity: 56, storeId: 'store-1', lastUsed: '2024-01-14', unit: 'Pcs', brand: 'Stanley', updatedAt: '2023-12-05', barcode: '87654321' },
  { id: 'prod-3', name: 'Screwdriver Set 12pc', sku: 'HND-003', category: 'Hand Tools', sellingPrice: 29.99, purchasePrice: 12.00, quantity: 38, storeId: 'store-1', lastUsed: '2024-01-13', unit: 'Set', brand: 'Craftsman', updatedAt: '2023-11-20' },
  { id: 'prod-4', name: 'Paint Roller Kit', sku: 'PNT-001', category: 'Painting', sellingPrice: 24.99, purchasePrice: 10.00, quantity: 42, storeId: 'store-1', lastUsed: '2024-01-12', unit: 'Set', brand: 'Wagner', updatedAt: '2024-01-02' },
  { id: 'prod-5', name: 'PVC Pipe 2" x 10ft', sku: 'PLB-001', category: 'Plumbing', sellingPrice: 12.99, purchasePrice: 5.50, quantity: 120, storeId: 'store-1', lastUsed: '2024-01-11', unit: 'Length', brand: 'Generic', updatedAt: '2023-10-15' },
  { id: 'prod-6', name: 'LED Bulb 60W 4pk', sku: 'ELC-001', category: 'Electrical', sellingPrice: 15.99, purchasePrice: 7.00, quantity: 85, storeId: 'store-1', lastUsed: '2024-01-10', unit: 'Pack', brand: 'Philips', updatedAt: '2024-01-08' },
  { id: 'prod-7', name: 'Circular Saw 7.25"', sku: 'PWR-002', category: 'Power Tools', sellingPrice: 129.99, purchasePrice: 85.00, quantity: 12, storeId: 'store-1', lastUsed: '2024-01-09', unit: 'Pcs', brand: 'Makita', updatedAt: '2023-12-28' },
  { id: 'prod-8', name: 'Wood Screws Box 100ct', sku: 'FST-001', category: 'Fasteners', sellingPrice: 8.99, purchasePrice: 3.00, quantity: 200, storeId: 'store-1', lastUsed: '2024-01-08', unit: 'Box', brand: 'Hillman', updatedAt: '2023-11-12' },
  { id: 'prod-9', name: 'Safety Goggles', sku: 'SAF-001', category: 'Safety', sellingPrice: 12.99, purchasePrice: 4.50, quantity: 65, storeId: 'store-1', lastUsed: '2024-01-07', unit: 'Pair', brand: '3M', updatedAt: '2023-09-30' },
  { id: 'prod-10', name: 'Measuring Tape 25ft', sku: 'HND-004', category: 'Hand Tools', sellingPrice: 14.99, purchasePrice: 5.00, quantity: 48, storeId: 'store-1', lastUsed: '2024-01-06', unit: 'Pcs', brand: 'Stanley', updatedAt: '2023-12-10' },
  { id: 'prod-11', name: 'Angle Grinder 4.5"', sku: 'PWR-003', category: 'Power Tools', sellingPrice: 79.99, purchasePrice: 48.00, quantity: 18, storeId: 'store-2', lastUsed: '2024-01-15', unit: 'Pcs', brand: 'Bosch', updatedAt: '2024-01-12' },
  { id: 'prod-12', name: 'Wrench Set 10pc', sku: 'HND-005', category: 'Hand Tools', sellingPrice: 45.99, purchasePrice: 22.00, quantity: 32, storeId: 'store-2', lastUsed: '2024-01-14', unit: 'Set', brand: 'Husky', updatedAt: '2023-11-05' },
];

const initialCustomers: Customer[] = [
  { id: 'cust-1', name: 'ABC Construction', phone: '+1 555-1001', area: 'Downtown', creditBalance: 1250.00, totalPurchases: 8500.00, storeId: 'store-1', joinedAt: '2023-05-10' },
  { id: 'cust-2', name: 'Home Renovators Inc', phone: '+1 555-1002', area: 'Westside', creditBalance: 0, totalPurchases: 5200.00, storeId: 'store-1', joinedAt: '2023-06-15' },
  { id: 'cust-3', name: 'Quick Fix Plumbing', phone: '+1 555-1003', area: 'East End', creditBalance: 450.00, totalPurchases: 3200.00, storeId: 'store-1', joinedAt: '2023-08-20' },
  { id: 'cust-4', name: 'City Electric Co', phone: '+1 555-1004', area: 'Industrial', creditBalance: 2100.00, totalPurchases: 12500.00, storeId: 'store-1', joinedAt: '2023-02-10' },
  { id: 'cust-5', name: 'Premium Painters', phone: '+1 555-1005', area: 'Downtown', creditBalance: 0, totalPurchases: 4800.00, storeId: 'store-1', joinedAt: '2023-11-05' },
  { id: 'cust-6', name: 'DIY Dave', phone: '+1 555-1006', area: 'Suburbs', creditBalance: 75.00, totalPurchases: 890.00, storeId: 'store-2', joinedAt: '2024-01-02' },
];

const initialAccounts: Account[] = [
  { id: 'acc-1', name: 'Cash Register', type: 'cash', balance: 5420.50, storeId: 'store-1' },
  { id: 'acc-2', name: 'Card Terminal', type: 'card', balance: 12850.00, storeId: 'store-1' },
  { id: 'acc-3', name: 'Digital Wallet', type: 'wallet', balance: 3200.00, storeId: 'store-1' },
  { id: 'acc-4', name: 'Cash Register', type: 'cash', balance: 2150.00, storeId: 'store-2' },
  { id: 'acc-5', name: 'Card Terminal', type: 'card', balance: 5600.00, storeId: 'store-2' },
];

const initialSales: Sale[] = [
  { id: 'sale-1', invoiceNumber: 'INV-001', status: 'completed', type: 'cash', items: [{ productId: 'prod-1', productName: 'Power Drill 18V', quantity: 2, price: 89.99 }], subtotal: 179.98, discountAmount: 0, taxAmount: 0, totalAmount: 179.98, profit: 69.98, paymentMode: 'cash', accountId: 'acc-1', storeId: 'store-1', date: '2024-01-15T10:30:00' },
  { id: 'sale-2', invoiceNumber: 'INV-002', status: 'completed', type: 'credit', items: [{ productId: 'prod-2', productName: 'Hammer Claw 16oz', quantity: 5, price: 19.99 }], subtotal: 99.95, discountAmount: 0, taxAmount: 0, totalAmount: 99.95, profit: 57.45, paymentMode: 'cash', accountId: 'acc-1', customerId: 'cust-1', storeId: 'store-1', date: '2024-01-15T11:45:00' },
  { id: 'sale-3', invoiceNumber: 'INV-003', status: 'completed', type: 'retail', items: [{ productId: 'prod-6', productName: 'LED Bulb 60W 4pk', quantity: 3, price: 15.99 }], subtotal: 47.97, discountAmount: 0, taxAmount: 0, totalAmount: 47.97, profit: 26.97, paymentMode: 'card', accountId: 'acc-2', storeId: 'store-1', date: '2024-01-14T09:15:00' },
  { id: 'sale-4', invoiceNumber: 'INV-004', status: 'completed', type: 'cash', items: [{ productId: 'prod-7', productName: 'Circular Saw 7.25"', quantity: 1, price: 129.99 }], subtotal: 129.99, discountAmount: 0, taxAmount: 0, totalAmount: 129.99, profit: 44.99, paymentMode: 'card', accountId: 'acc-2', storeId: 'store-1', date: '2024-01-14T14:20:00' },
  { id: 'sale-5', invoiceNumber: 'INV-005', status: 'completed', type: 'retail', items: [{ productId: 'prod-8', productName: 'Wood Screws Box 100ct', quantity: 10, price: 8.99 }], subtotal: 89.90, discountAmount: 0, taxAmount: 0, totalAmount: 89.90, profit: 59.90, paymentMode: 'wallet', accountId: 'acc-3', storeId: 'store-1', date: '2024-01-13T16:00:00' },
];

const initialTransactions: Transaction[] = [
  { id: 'trans-1', type: 'cash_in', amount: 500.00, description: 'Credit payment from ABC Construction', customerId: 'cust-1', customerName: 'ABC Construction', storeId: 'store-1', accountId: 'acc-1', date: '2024-01-15T09:00:00' },
  { id: 'trans-2', type: 'expense', amount: 150.00, description: 'Office supplies', storeId: 'store-1', accountId: 'acc-1', date: '2024-01-14T11:30:00' },
  { id: 'trans-3', type: 'cash_out', amount: 2000.00, description: 'Bank deposit', storeId: 'store-1', accountId: 'acc-1', date: '2024-01-13T17:00:00' },
  { id: 'trans-4', type: 'sale_return', amount: 19.99, description: 'Returned hammer - defective', storeId: 'store-1', accountId: 'acc-1', date: '2024-01-12T10:15:00' },
];

const initialPurchases: Purchase[] = [
  { id: 'purch-1', invoiceNumber: 'PO-001', supplier: 'Tool Distributors Inc', type: 'cash', items: [{ productId: 'prod-1', productName: 'Power Drill 18V', quantity: 20, price: 55.00 }], totalAmount: 1100.00, storeId: 'store-1', accountId: 'acc-1', date: '2024-01-10T08:00:00' },
  { id: 'purch-2', invoiceNumber: 'PO-002', supplier: 'FastenAll Supply', type: 'credit', items: [{ productId: 'prod-8', productName: 'Wood Screws Box 100ct', quantity: 100, price: 3.00 }], totalAmount: 300.00, storeId: 'store-1', accountId: 'acc-2', date: '2024-01-08T09:30:00' },
];

export interface TaxSlab {
  id: string;
  name: string;
  percentage: number;
}

export interface StockTransfer {
  id: string;
  productId: string;
  fromStoreId: string;
  toStoreId: string;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  transferredAt?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  parentId?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber?: string;
  supplierId?: string;
  supplier: string;
  items: SaleItem[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'received' | 'cancelled' | 'partially_received';
  storeId: string;
  date: string;
  updatedAt?: string;
}

export interface Commission {
  id: string;
  userId: string;
  saleId: string;
  amount: number;
  percentage: number;
  status: 'pending' | 'paid';
}

export interface LoyaltyPoint {
  id: string;
  customerId: string;
  points: number;
  reason: string;
  saleId?: string;
}

export interface KitItem {
  productId: string;
  quantity: number;
}

export interface ItemKit {
  id: string;
  name: string;
  sku: string;
  category: string;
  sellingPrice: number;
  storeId: string;
  isActive: boolean;
  items: KitItem[];
  updatedAt: string;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[]; // Parsed from JSON
  isRequired: boolean;
  showOnReceipt: boolean;
  targetType: 'product' | 'client';
  defaultValue?: string;
  updatedAt: string;
}

export interface ProductCustomValue {
  id: string;
  productId: string;
  fieldId: string;
  value: string;
}

export interface CustomerCustomValue {
  id: string;
  customerId: string;
  fieldId: string;
  value: string;
}

// HR Specific Types
export interface HRAttendance {
  id: string;
  employeeId: string;
  name: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
}

export interface HRLeave {
  id: string;
  employeeId: string;
  type: 'annual' | 'sick' | 'unpaid' | 'other';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
}

export interface HRPayroll {
  id: string;
  employeeId: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'draft' | 'processed' | 'paid';
}

export interface HRPerformance {
  id: string;
  employeeId: string;
  reviewDate: string;
  rating: number;
  feedback: string;
  reviewerId: string;
}
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  storeId: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  isActive: boolean;
  storeId: string;
  updatedAt: string;
}

// Store State
interface ERPState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;

  // Device info
  deviceId: string | null;

  // Active Store
  activeStoreId: string;

  // Data
  users: User[];
  stores: Store[];
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  transactions: Transaction[];
  purchases: Purchase[];
  accounts: Account[];
  quotations: Quotation[];
  stockTransfers: StockTransfer[];
  expenseCategories: ExpenseCategory[];
  taxSlabs: TaxSlab[];
  purchaseOrders: PurchaseOrder[];
  commissions: Commission[];
  loyaltyPoints: LoyaltyPoint[];
  itemKits: ItemKit[];
  customFields: CustomField[];
  productCustomValues: ProductCustomValue[];
  customerCustomValues: CustomerCustomValue[];

  // Suppliers
  suppliers: Supplier[];
  supplierTransactions: SupplierTransaction[];
  supplierCustomFields: SupplierCustomField[];
  supplierCustomValues: SupplierCustomValue[];
  paymentTerms: PaymentTerm[];
  supplierDocuments: Record<string, SupplierDocument[]>; // Map supplierId -> docs
  receivings: Receiving[];
  invoices: Invoice[];
  cheques: Cheque[];


  // New Sales Module State
  giftCards: GiftCard[];
  workOrders: WorkOrder[];
  deliveries: Delivery[];
  testModeEnabled: boolean;
  activityLogs: ActivityLog[];

  // Delivery & Logistics
  deliveryZones: DeliveryZone[];
  deliveryPersonnel: User[]; // Assuming User interface has a field like `isDriver` or similar

  // HR Data
  hrAttendance: HRAttendance[];
  hrLeaves: HRLeave[];
  hrPayroll: HRPayroll[];
  hrPerformance: HRPerformance[];

  // Global State
  isInitialLoading: boolean;


  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setActiveStore: (storeId: string) => void;
  toggleTestMode: () => void;
  addStore: (store: Omit<Store, 'id'>) => Promise<void>;
  updateStore: (id: string, updates: Partial<Store>) => Promise<void>;
  deleteStore: (id: string) => Promise<void>;

  // CRUD Actions
  addUser: (user: Omit<User, 'id'> & { id?: string }) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Phase 11 Actions
  processStockTransfer: (transfer: Omit<StockTransfer, 'id' | 'status'>) => Promise<void>;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id'>) => Promise<void>;
  addExpenseCategory: (cat: Omit<ExpenseCategory, 'id'>) => Promise<void>;
  addTaxSlab: (slab: Omit<TaxSlab, 'id'>) => Promise<void>;
  generateBarcode: (sku: string) => Promise<string>;

  addSale: (sale: Omit<Sale, 'id' | 'invoiceNumber'>) => Promise<string>;
  resumeSale: (saleId: string) => Promise<void>;
  updateSale: (id: string, updates: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => void;

  // Gift Card Actions
  addGiftCard: (gc: Omit<GiftCard, 'id' | 'updatedAt'>) => Promise<void>;
  updateGiftCard: (id: string, updates: Partial<GiftCard>) => Promise<void>;
  getGiftCardByNumber: (number: string) => GiftCard | undefined;

  // Work Order Actions
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => Promise<void>;

  // Delivery Actions
  updateDelivery: (id: string, updates: Partial<Delivery>) => Promise<void>;

  // Delivery & Logistics Actions
  addDeliveryZone: (zoneData: Partial<DeliveryZone>) => Promise<void>;
  updateDeliveryZone: (id: string, updates: Partial<DeliveryZone>) => Promise<void>;
  deleteDeliveryZone: (id: string) => Promise<void>;
  toggleDriverStatus: (userId: string, isDriver: boolean) => Promise<void>;

  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;

  addPurchase: (purchase: Omit<Purchase, 'id' | 'invoiceNumber'>) => void;
  deletePurchase: (id: string) => void;

  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  bulkDeleteCustomers: (ids: string[]) => Promise<void>;
  mergeCustomers: (masterId: string, slaveIds: string[]) => Promise<void>;

  addQuotation: (quotation: Omit<Quotation, 'id' | 'quotationNumber'>) => void;
  updateQuotation: (id: string, quotation: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;
  convertQuotationToSale: (quotationId: string, saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'quotationId'>) => void;

  // Item Kit Actions
  addItemKit: (kit: Omit<ItemKit, 'id'>) => Promise<void>;
  updateItemKit: (id: string, updates: Partial<ItemKit>) => Promise<void>;
  deleteItemKit: (id: string) => Promise<void>;

  // Custom Field Actions
  addCustomField: (field: Omit<CustomField, 'id'>) => Promise<void>;
  updateCustomField: (id: string, updates: Partial<CustomField>) => Promise<void>;
  deleteCustomField: (id: string) => Promise<void>;

  // Bulk Product Actions
  bulkDeleteProducts: (ids: string[]) => Promise<void>;
  bulkUpdateProducts: (ids: string[], updates: Partial<Product>) => Promise<void>;

  // Inventory Intelligence Actions (async when using Electron)
  handleBarcodeScan: (barcode: string, mode?: 'IN' | 'OUT') => Promise<BarcodeResponse>;
  processExcelUpload: (data: InventoryRow[]) => Promise<ExcelUploadSummary>;

  // Custom Field Value Actions
  getProductCustomValues: (productId: string) => Promise<ProductCustomValue[]>;
  updateProductCustomValues: (productId: string, values: Omit<ProductCustomValue, 'id' | 'productId'>[]) => Promise<void>;
  getCustomerCustomValues: (customerId: string) => Promise<CustomerCustomValue[]>;
  updateCustomerCustomValues: (customerId: string, values: Omit<CustomerCustomValue, 'id' | 'customerId'>[]) => Promise<void>;

  // Getters
  getStoreProducts: () => Product[];
  getStoreCustomers: () => Customer[];
  getStoreSales: () => Sale[];
  getStoreTransactions: () => Transaction[];
  getStorePurchases: () => Purchase[];
  getStoreAccounts: () => Account[];
  getStoreQuotations: () => Quotation[];
  getStoreItemKits: () => ItemKit[];
  getStoreUsers: () => User[];
  getActiveStore: () => Store | undefined;

  // Database sync
  isSyncing: boolean;
  syncData: () => Promise<void>;
  loadFromDatabase: () => Promise<void>;

  // Supplier Actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'updatedAt' | 'currentBalance' | 'isDeleted'>) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  getSupplierLedger: (supplierId: string) => Promise<SupplierTransaction[]>;
  addSupplierTransaction: (tx: Omit<SupplierTransaction, 'id' | 'createdAt'>) => Promise<void>;
  addSupplierCustomField: (field: Omit<SupplierCustomField, 'id' | 'updatedAt'>) => Promise<void>;
  saveSupplierCustomValue: (val: Omit<SupplierCustomValue, 'id' | 'updatedAt'> & { id?: string }) => Promise<void>;

  // Receiving Actions
  addReceiving: (receiving: Omit<Receiving, 'id' | 'updatedAt'>) => Promise<void>;
  updateReceiving: (id: string, updates: Partial<Receiving>) => Promise<void>;
  completeReceiving: (id: string, amountPaid: number, accountId?: string) => Promise<void>;
  suspendReceiving: (id: string) => Promise<void>;
  deleteReceiving: (id: string) => Promise<void>;
  getReceivingById: (id: string) => Promise<Receiving | null>;

  // Invoice Actions
  fetchInvoices: () => Promise<void>;
  getInvoiceById: (id: string) => Promise<Invoice | null>;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'updatedAt'>) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  // Cheque Actions
  fetchCheques: () => Promise<void>;
  addCheque: (cheque: Omit<Cheque, 'id' | 'updatedAt' | 'storeId' | 'status'>) => Promise<void>;
  updateChequeStatus: (id: string, status: Cheque['status'], clearingDate?: string) => Promise<void>;
  deleteCheque: (id: string) => Promise<void>;


  // Payment Terms & Docs
  getPaymentTerms: () => Promise<PaymentTerm[]>;
  addPaymentTerm: (term: Omit<PaymentTerm, 'id' | 'updatedAt' | 'storeId'>) => Promise<void>;
  getSupplierDocuments: (supplierId: string) => Promise<SupplierDocument[]>;
  addSupplierDocument: (doc: Omit<SupplierDocument, 'id' | 'uploadedAt' | 'storeId'>) => Promise<void>;

  // HR Actions
  checkIn: () => Promise<{ success: boolean; message?: string }>;
  checkOut: () => Promise<{ success: boolean; message?: string }>;
  fetchAttendance: (startDate?: string, endDate?: string) => Promise<void>;
  applyLeave: (leave: Omit<HRLeave, 'id' | 'status'>) => Promise<void>;
  fetchLeaves: () => Promise<void>;
  updateLeaveStatus: (id: string, status: HRLeave['status']) => Promise<void>;
  fetchPayroll: () => Promise<void>;

  // Security Actions
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'storeId'>) => void;
}

export const useERPStore = create<ERPState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentUser: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      deviceId: null,
      activeStoreId: 'store-1',
      isSyncing: false,
      isInitialLoading: true,
      // ... (Initial data arrays)
      users: initialUsers,
      stores: initialStores,
      products: initialProducts,
      customers: initialCustomers,
      sales: initialSales,
      transactions: initialTransactions,
      purchases: initialPurchases,
      accounts: initialAccounts,
      quotations: [],
      stockTransfers: [],
      expenseCategories: [],
      taxSlabs: [],
      purchaseOrders: [],
      commissions: [],
      loyaltyPoints: [],
      itemKits: [],
      customFields: [],
      productCustomValues: [],
      customerCustomValues: [],
      suppliers: [],
      supplierTransactions: [],
      supplierCustomFields: [],
      supplierCustomValues: [],
      paymentTerms: [],
      supplierDocuments: {},
      hrAttendance: [],
      hrLeaves: [],
      hrPayroll: [],
      hrPerformance: [],
      receivings: [],
      invoices: [],
      cheques: [],

      giftCards: [],
      workOrders: [],
      deliveries: [],
      testModeEnabled: false,
      activityLogs: [],
      deliveryZones: [],
      deliveryPersonnel: [],


      // Auth Actions
      login: async (email, password) => {
        // 1. First Priority: Real API Login (Cloud Sync)
        try {
          const { authApi } = await import('./auth-api');
          const result = await authApi.login(email, password);

          if (result.success && result.data) {
            const { access, refresh, user } = result.data;

            // Map backend user to frontend user with role normalization
            const rawRole = (user.role || 'user').toLowerCase();
            const validRoles: Role[] = ['admin', 'staff', 'user', 'hr_manager', 'super_admin', 'sales_manager', 'inventory_manager', 'accountant', 'employee'];
            const normalizedRole = validRoles.includes(rawRole as Role) ? (rawRole as Role) : 'user';

            const mappedUser: User = {
              id: user.id || 'user-unknown',
              name: user.name || user.email?.split('@')[0] || 'Unknown User',
              email: user.email || '',
              role: normalizedRole,
              storeId: user.store_id || 'store-1',
            };

            set({
              currentUser: mappedUser,
              isAuthenticated: true,
              accessToken: access,
              refreshToken: refresh,
              activeStoreId: mappedUser.storeId
            });
            return { success: true };
          }

          // If API specifically returns an error (401, 404, etc.), don't fall back to local
          // only fall back if it's a network/connection error.
          if (!result.isNetworkError) {
            return { success: false, message: result.message };
          }

        } catch (error) {
          console.log("[Auth] Cloud login unreachable, attempting local fallback...");
        }

        // 2. Second Priority: Local Login (Offline / Demo Fallback)
        const localUsers = get().users;
        const localUser = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (localUser) {
          let isValid = false;
          if (isElectron() && window.electronAPI.verifyPassword) {
            isValid = await window.electronAPI.verifyPassword(localUser.id, password);
          } else {
            isValid = localUser.password === password;
          }

          if (isValid) {
            set({ currentUser: localUser, isAuthenticated: true, activeStoreId: localUser.storeId || 'store-1' });
            return { success: true };
          }
        }

        return { success: false, message: "AUTHENTICATION_FAILURE: Invalid identifier or security key." };
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false, accessToken: null, refreshToken: null });
      },

      setActiveStore: (storeId) => set({ activeStoreId: storeId }),

      toggleTestMode: () => set((state) => ({ testModeEnabled: !state.testModeEnabled })),

      addStore: async (storeData) => {
        if (!isElectron()) return;
        const newStore = {
          ...storeData,
          id: `store-${Date.now()}`,
          deviceId: get().deviceId || 'dev-unknown',
          updatedAt: new Date().toISOString()
        } as Store;

        await dbAdapter.addStore(newStore);
        const stores = await dbAdapter.getStores() as Store[];
        set({ stores });
      },

      updateStore: async (id, updates) => {
        if (!isElectron()) return;
        await dbAdapter.updateStore(id, updates);
        const stores = await dbAdapter.getStores() as Store[];
        set({ stores });
      },

      deleteStore: async (id) => {
        if (!isElectron()) return;
        await dbAdapter.deleteStore(id);
        const stores = await dbAdapter.getStores() as Store[];
        set({ stores });
      },

      // User Actions
      addUser: async (user) => {
        // Fix: Use use user.id if provided, otherwise generate one. 
        // This prevents FK errors when the renderer generates an ID for a dependent record (like Employee).
        const newUser = { ...user, id: user.id || generateId() };
        set((state) => ({
          users: [...state.users, newUser]
        }));
        // Persist
        await dbAdapter.addUser(newUser);
      },

      deleteUser: async (id) => {
        if (!isElectron()) return;
        await dbAdapter.deleteUser(id);
        const users = await dbAdapter.getUsers() as User[];
        set({ users });
      },

      updateUser: async (id, updates) => {
        if (!isElectron()) return;
        await dbAdapter.updateUser(id, updates);
        const users = await dbAdapter.getUsers() as User[];
        set({ users });
      },

      // Phase 11 Actions
      processStockTransfer: async (transferData: Partial<StockTransfer>) => {
        if (!isElectron()) return;
        const transfer = { ...transferData, id: `xfer-${Date.now()}`, status: transferData.status || 'completed' } as StockTransfer;
        await dbAdapter.processStockTransfer(transfer);
        // Refresh local data if needed
      },

      addPurchaseOrder: async (poData) => {
        if (!isElectron()) return;
        const po = { ...poData, id: `po-${Date.now()}` };
        await dbAdapter.addPurchaseOrder(po);
        const purchaseOrders = await dbAdapter.getPurchaseOrders(get().activeStoreId) as PurchaseOrder[];
        set({ purchaseOrders });
      },

      addExpenseCategory: async (catData) => {
        if (!isElectron()) return;
        const cat = { ...catData, id: `exp-cat-${Date.now()}` };
        await dbAdapter.addExpenseCategory(cat);
        const expenseCategories = await dbAdapter.getExpenseCategories() as ExpenseCategory[];
        set({ expenseCategories });
      },

      addTaxSlab: async (slabData) => {
        if (!isElectron()) return;
        const slab = { ...slabData, id: `tax-${Date.now()}` };
        await dbAdapter.addTaxSlab(slab);
        const taxSlabs = await dbAdapter.getTaxSlabs() as TaxSlab[];
        set({ taxSlabs });
      },

      generateBarcode: async (sku) => {
        if (!isElectron()) return `BC-${sku}`;
        return await dbAdapter.generateBarcode(sku);
      },

      // Item Kit Actions
      addItemKit: async (kitData) => {
        if (!isElectron()) return;
        const kit = { ...kitData, id: generateId(), updatedAt: new Date().toISOString() };
        await dbAdapter.addItemKit(kit);
        const itemKits = await dbAdapter.getItemKits(get().activeStoreId) as ItemKit[];
        set({ itemKits });
      },

      updateItemKit: async (id, updates) => {
        if (!isElectron()) return;
        await dbAdapter.updateItemKit(id, updates);
        const itemKits = await dbAdapter.getItemKits(get().activeStoreId) as ItemKit[];
        set({ itemKits });
      },

      deleteItemKit: async (id) => {
        if (!isElectron()) return;
        await dbAdapter.deleteItemKit(id);
        const itemKits = await dbAdapter.getItemKits(get().activeStoreId) as ItemKit[];
        set({ itemKits });
      },

      // Custom Field Actions
      addCustomField: async (fieldData) => {
        if (!isElectron()) return;
        const field = { ...fieldData, id: generateId(), updatedAt: new Date().toISOString() };
        await dbAdapter.addCustomField(field);
        const customFields = await dbAdapter.getCustomFields() as CustomField[];
        set({ customFields });
      },

      updateCustomField: async (id, updates) => {
        if (!isElectron()) return;
        await dbAdapter.updateCustomField(id, updates);
        const customFields = await dbAdapter.getCustomFields() as CustomField[];
        set({ customFields });
      },

      deleteCustomField: async (id) => {
        if (!isElectron()) return;
        await dbAdapter.deleteCustomField(id);
        const customFields = await dbAdapter.getCustomFields() as CustomField[];
        set({ customFields });
      },

      // Custom Field Value Actions
      getProductCustomValues: async (productId) => await dbAdapter.getProductCustomValues(productId) || [],
      updateProductCustomValues: async (productId, values) => {
        const fullValues = values.map(v => ({
          ...v,
          id: `${productId}-${v.fieldId}`,
          productId
        }));
        await dbAdapter.updateProductCustomValues(productId, fullValues);
        const allValues = await dbAdapter.getAllProductCustomValues() as ProductCustomValue[];
        if (allValues) set({ productCustomValues: allValues });
      },
      getCustomerCustomValues: async (customerId) => await dbAdapter.getCustomerCustomValues?.(customerId) || [],
      updateCustomerCustomValues: async (customerId, values) => {
        const fullValues = values.map(v => ({
          ...v,
          id: `${customerId}-${v.fieldId}`,
          customerId
        }));
        await dbAdapter.updateCustomerCustomValues?.(customerId, fullValues);
        const allValues = await dbAdapter.getAllCustomerCustomValues?.() as CustomerCustomValue[];
        if (allValues) set({ customerCustomValues: allValues });
      },

      // Bulk Product Actions
      bulkDeleteProducts: async (ids) => {
        if (!isElectron()) {
          set((state) => ({
            products: state.products.filter(p => !ids.includes(p.id))
          }));
          return;
        }
        await dbAdapter.bulkDeleteProducts(ids);
        const products = await dbAdapter.getProducts(get().activeStoreId) as Product[];
        set({ products });
      },

      bulkUpdateProducts: async (ids, updates) => {
        if (!isElectron()) {
          set((state) => ({
            products: state.products.map(p => ids.includes(p.id) ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
          }));
          return;
        }
        await dbAdapter.bulkUpdateProducts(ids, updates);
        const products = await dbAdapter.getProducts(get().activeStoreId) as Product[];
        set({ products });
      },

      // Product Actions
      addProduct: (product) => {
        const newProduct = { ...product, id: generateId(), updatedAt: new Date().toISOString() };
        set((state) => ({
          products: [...state.products, newProduct]
        }));
        dbAdapter.addProduct(newProduct);
      },

      updateProduct: (id, product) => {
        set((state) => ({
          products: state.products.map(p => p.id === id ? { ...p, ...product, updatedAt: new Date().toISOString() } : p)
        }));
        dbAdapter.updateProduct(id, product);
      },

      deleteProduct: (id) => {
        const product = get().products.find(p => p.id === id);
        if (product) {
          get().addActivityLog({
            action: 'PRODUCT_DELETED',
            details: `Product ${product.name} (SKU: ${product.sku}) deleted.`
          });
        }
        set((state) => ({
          products: state.products.filter(p => p.id !== id)
        }));
        dbAdapter.deleteProduct(id);
      },

      // Customer Actions
      addCustomer: (customer) => {
        const newCustomer = { ...customer, id: generateId(), updatedAt: new Date().toISOString() };
        set((state) => ({
          customers: [...state.customers, newCustomer]
        }));
        dbAdapter.addCustomer(newCustomer);
      },

      updateCustomer: (id, customer) => {
        set((state) => ({
          customers: state.customers.map(c => c.id === id ? { ...c, ...customer, updatedAt: new Date().toISOString() } : c)
        }));
        dbAdapter.updateCustomer(id, customer);
      },

      deleteCustomer: (id) => {
        const customer = get().customers.find(c => c.id === id);
        if (customer) {
          get().addActivityLog({
            action: 'CUSTOMER_DELETED',
            details: `Customer ${customer.name} (Phone: ${customer.phone}) deleted.`
          });
        }
        set((state) => ({
          customers: state.customers.filter(c => c.id !== id)
        }));
        dbAdapter.deleteCustomer?.(id);
      },

      bulkDeleteCustomers: async (ids) => {
        // Optimistic UI
        set((state) => ({
          customers: state.customers.filter(c => !ids.includes(c.id))
        }));

        // Parallel delete implementation
        if (isElectron()) {
          if (window.electronAPI.bulkDeleteCustomers) {
            await window.electronAPI.bulkDeleteCustomers(ids);
          } else {
            // Fallback if bulk not implemented in main process
            for (const id of ids) {
              await dbAdapter.deleteCustomer?.(id);
            }
          }
        }
      },

      mergeCustomers: async (masterId, slaveIds) => {
        const state = get();
        const master = state.customers.find(c => c.id === masterId);
        if (!master) return;

        const slaves = state.customers.filter(c => slaveIds.includes(c.id));
        const totalPurchases = slaves.reduce((acc, c) => acc + c.totalPurchases, master.totalPurchases);
        const creditBalance = slaves.reduce((acc, c) => acc + c.creditBalance, master.creditBalance);

        set((state) => ({
          customers: state.customers
            .map(c => c.id === masterId ? { ...c, totalPurchases, creditBalance, updatedAt: new Date().toISOString() } : c)
            .filter(c => !slaveIds.includes(c.id)),
          sales: state.sales.map(s => slaveIds.includes(s.customerId || '') ? { ...s, customerId: masterId } : s),
          quotations: state.quotations.map(q => slaveIds.includes(q.customerId || '') ? { ...q, customerId: masterId } : q)
        }));

        if (isElectron()) {
          for (const id of slaveIds) {
            await dbAdapter.deleteCustomer?.(id);
          }
          await dbAdapter.updateCustomer(masterId, { totalPurchases, creditBalance });
        }
      },
      addSale: async (saleData) => {
        // Generate ID and Invoice Number for Optimistic Update
        const invoiceNumber = generateInvoice('INV');
        const newSale = {
          ...saleData,
          id: generateId(),
          invoiceNumber,
          updatedAt: new Date().toISOString()
        } as Sale;

        // Optimistic UI Updates
        const { products, sales, accounts, customers } = get();

        // 1. Transactional Write (Source of Truth)
        try {
          if (isElectron()) {
            await window.electronAPI.addSale(newSale);
          }
        } catch (error) {
          console.error("Failed to process sale transaction:", error);
          throw new Error((error as Error).message || "Sale transaction failed");
        }

        // 2. Optimistic Local Updates
        set((state) => {
          if (state.testModeEnabled) {
            return {
              sales: [newSale, ...state.sales],
            };
          }

          const { activeStoreId } = get();
          const newState: Partial<ERPState> = {
            sales: [newSale, ...state.sales],
            products: state.products.map(p => {
              const soldItem = saleData.items.find(i => i.productId === p.id);
              return soldItem ? { ...p, quantity: p.quantity - soldItem.quantity, lastUsed: new Date().toISOString() } : p;
            }),
            customers: state.customers.map(c => {
              if (c.id === saleData.customerId) {
                let creditAdjustment = 0;
                if (saleData.type === 'credit') {
                  creditAdjustment = saleData.totalAmount;
                }
                const storeCreditPayment = saleData.payments?.find(p => p.paymentMode === 'store_credit');
                if (storeCreditPayment) {
                  creditAdjustment -= storeCreditPayment.amount; // Deduct from credit balance if using existing store credit.
                }

                return {
                  ...c,
                  totalPurchases: (c.totalPurchases || 0) + saleData.totalAmount,
                  creditBalance: (c.creditBalance || 0) + creditAdjustment
                };
              }
              return c;
            }),
            giftCards: state.giftCards.map(gc => {
              const gcPayment = saleData.payments?.find(p => p.paymentMode === 'gift_card' && p.giftCardId === gc.id);
              return gcPayment ? { ...gc, balance: gc.balance - gcPayment.amount, updatedAt: new Date().toISOString() } : gc;
            }),
            accounts: state.accounts.map(a => {
              const accountPayments = saleData.payments?.filter(p => p.accountId === a.id) || [];
              const totalForAccount = accountPayments.reduce((sum, p) => sum + p.amount, 0);
              return totalForAccount > 0 ? { ...a, balance: a.balance + totalForAccount } : a;
            })
          };

          if (newSale.status === 'work_order') {
            const wo: WorkOrder = {
              id: generateId(),
              saleId: newSale.id,
              status: 'pending',
              storeId: activeStoreId,
              updatedAt: new Date().toISOString()
            };
            newState.workOrders = [wo, ...state.workOrders];
            if (isElectron()) dbAdapter.updateWorkOrder?.(wo.id, wo);
          }

          if (newSale.status === 'delivery') {
            const delivery: Delivery = {
              id: generateId(),
              saleId: newSale.id,
              address: newSale.delivery?.address || '',
              deliveryCharge: newSale.delivery?.deliveryCharge || 0,
              isCod: newSale.delivery?.isCod || false,
              status: 'pending',
              storeId: activeStoreId,
              updatedAt: new Date().toISOString()
            };
            newState.deliveries = [delivery, ...state.deliveries];
            if (isElectron()) dbAdapter.updateDelivery?.(delivery.id, delivery);
          }

          return newState;
        });

        return newSale.id;
      },

      resumeSale: async (saleId) => {
        const sale = get().sales.find(s => s.id === saleId);
        if (!sale) return;

        // In a real POS, this would load the sale into the current POS state.
        // Since we are using global state, we just need to delete the "suspended" entry
        // and let the caller handle the navigation/pre-fill.
        // But wait, the standard way is to delete from suspended list.
        get().deleteSale(saleId);
      },

      updateSale: async (id, updates) => {
        set((state) => ({
          sales: state.sales.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)
        }));
        if (isElectron()) {
          await dbAdapter.updateSale(id, updates);
        }
      },

      addGiftCard: async (gcData) => {
        const { activeStoreId } = get();
        const id = generateId('gc');
        const newGC = { ...gcData, id, updatedAt: new Date().toISOString() } as GiftCard;
        set((state) => ({ giftCards: [newGC, ...state.giftCards] }));
        if (isElectron()) {
          await dbAdapter.addGiftCard(newGC);
        }
      },

      // Phase: Delivery & Logistics
      addDeliveryZone: async (zoneData: Partial<DeliveryZone>) => {
        const { activeStoreId } = get();
        const newZone: DeliveryZone = {
          id: generateId('dz'),
          name: zoneData.name || 'New Zone',
          fee: Number(zoneData.fee) || 0,
          isActive: true,
          storeId: activeStoreId,
          updatedAt: new Date().toISOString(),
        };
        set(state => ({ deliveryZones: [newZone, ...state.deliveryZones] }));
        if (isElectron()) await window.electronAPI.addDeliveryZone(newZone);
      },

      updateDeliveryZone: async (id: string, updates: Partial<DeliveryZone>) => {
        set(state => ({
          deliveryZones: state.deliveryZones.map((z: DeliveryZone): DeliveryZone =>
            z.id === id ? {
              ...z,
              ...updates,
              fee: updates.fee !== undefined ? Number(updates.fee) : z.fee,
              updatedAt: new Date().toISOString()
            } : z
          )
        }));
        if (isElectron()) await window.electronAPI.updateDeliveryZone(id, updates);
      },

      deleteDeliveryZone: async (id: string) => {
        set(state => ({
          deliveryZones: state.deliveryZones.filter(z => z.id !== id)
        }));
        if (isElectron()) await window.electronAPI.deleteDeliveryZone(id);
      },

      toggleDriverStatus: async (userId: string, isDriver: boolean) => {
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, isDriver } : u)
        }));
        if (isElectron()) await dbAdapter.updateUser(userId, { isDriver });
      },

      updateGiftCard: async (id, updates) => {
        set((state) => ({
          giftCards: state.giftCards.map(gc => gc.id === id ? { ...gc, ...updates, updatedAt: new Date().toISOString() } : gc)
        }));
        if (isElectron()) {
          await dbAdapter.updateGiftCard(id, updates);
        }
      },

      getGiftCardByNumber: (number) => {
        return get().giftCards.find(gc => gc.cardNumber === number);
      },

      updateWorkOrder: async (id, updates) => {
        set((state) => ({
          workOrders: state.workOrders.map(wo => wo.id === id ? { ...wo, ...updates, updatedAt: new Date().toISOString() } : wo)
        }));
        if (isElectron()) {
          await dbAdapter.updateWorkOrder(id, updates);
        }
      },

      updateDelivery: async (id, updates) => {
        set((state) => ({
          deliveries: state.deliveries.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d)
        }));
        if (isElectron()) {
          await dbAdapter.updateDelivery(id, updates);
        }
      },

      deleteSale: (id) => {
        const sale = get().sales.find(s => s.id === id);
        if (sale) {
          get().addActivityLog({
            action: 'SALE_DELETED',
            details: `Invoice #${sale.invoiceNumber} deleted. Amount: $${sale.totalAmount}`
          });
        }
        set((state) => ({
          sales: state.sales.filter(s => s.id !== id)
        }));
        // dbAdapter.deleteSale(id) - Not implemented
      },

      // Transaction Actions
      addTransaction: (transaction) => {
        const newTransaction = { ...transaction, id: generateId(), updatedAt: new Date().toISOString() };

        set((state) => {
          const updatedAccounts = state.accounts.map(a => {
            if (a.id === transaction.accountId) {
              const adjustment = transaction.type === 'cash_in' ? transaction.amount : -transaction.amount;
              return { ...a, balance: a.balance + adjustment };
            }
            return a;
          });

          const updatedCustomers = state.customers.map(c => {
            if (transaction.customerId === c.id && transaction.type === 'cash_in') {
              return { ...c, creditBalance: c.creditBalance - transaction.amount };
            }
            return c;
          });

          return {
            transactions: [...state.transactions, newTransaction],
            accounts: updatedAccounts,
            customers: updatedCustomers,
          };
        });

        dbAdapter.addTransaction(newTransaction);
      },

      // Purchase Actions
      addPurchase: async (purchaseData) => {
        // Generate ID and Invoice Number for Optimistic Update
        const existingPurchase = purchaseData as Partial<Purchase>;
        const invoiceNumber = existingPurchase.invoiceNumber || generateInvoice('PUR');
        const newPurchase = {
          ...purchaseData,
          id: generateId(),
          invoiceNumber,
          updatedAt: new Date().toISOString()
        } as Purchase;

        // Optimistic UI Updates
        // Access state directly from get()
        const state = get();

        // 1. Transactional Write
        try {
          if (window.electronAPI) {
            await window.electronAPI.addPurchase(newPurchase);
          }
        } catch (error) {
          console.error("Failed to process purchase transaction:", error);
          throw new Error((error as Error).message || "Purchase transaction failed");
        }

        // 2. Optimistic Update
        set((state) => {
          const updatedProducts = state.products.map(p => {
            const item = purchaseData.items.find(i => i.productId === p.id);
            if (item) {
              return { ...p, quantity: p.quantity + item.quantity };
            }
            return p;
          });

          return {
            purchases: [newPurchase, ...state.purchases],
            products: updatedProducts,
            accounts: purchaseData.accountId ? state.accounts.map(a =>
              a.id === purchaseData.accountId
                ? { ...a, balance: a.balance - purchaseData.totalAmount }
                : a
            ) : state.accounts
          };
        });
      },

      addActivityLog: (logData) => {
        const { currentUser, activeStoreId } = get();
        const log: ActivityLog = {
          ...logData,
          id: generateId(),
          timestamp: new Date().toISOString(),
          userId: currentUser?.id || 'unknown',
          userName: currentUser?.name || 'Unknown User',
          storeId: activeStoreId
        };
        set(state => ({ activityLogs: [log, ...state.activityLogs] }));
      },

      deletePurchase: (id) => {
        set((state) => ({
          purchases: state.purchases.filter(p => p.id !== id)
        }));
        // dbAdapter.deletePurchase(id); - Not implemented
      },

      // Quotation Actions
      addQuotation: (quotation) => {
        const quotationNumber = generateInvoice('QTN');
        const newQuotation: Quotation = {
          ...quotation,
          id: generateId(),
          quotationNumber,
          status: 'pending',
          updatedAt: new Date().toISOString()
        } as unknown as Quotation; // Type assertion since Quotation doesn't have updatedAt in interface

        set((state) => ({
          quotations: [...state.quotations, newQuotation]
        }));

        dbAdapter.addQuotation(newQuotation);
      },

      updateQuotation: (id, quotation) => {
        set((state) => ({
          quotations: state.quotations.map(q => q.id === id ? { ...q, ...quotation } : q)
        }));
        dbAdapter.updateQuotation(id, quotation);
      },

      convertQuotationToSale: (quotationId, saleData) => {
        const invoiceNumber = generateInvoice('INV');
        const newSale = {
          ...saleData,
          id: generateId(),
          invoiceNumber,
          quotationId,
          updatedAt: new Date().toISOString()
        };

        set((state) => {
          const updatedQuotations = state.quotations.map(q =>
            q.id === quotationId ? { ...q, status: 'converted' as const } : q
          );

          const updatedProducts = state.products.map(p => {
            const soldItem = saleData.items.find(i => i.productId === p.id);
            return soldItem ? { ...p, quantity: p.quantity - soldItem.quantity, lastUsed: new Date().toISOString() } : p;
          });

          return {
            sales: [newSale, ...state.sales],
            quotations: updatedQuotations,
            products: updatedProducts
          };
        });

        get().addSale(newSale); // Actually add to DB
      },

      // Invoice Actions Implementation
      fetchInvoices: async () => {
        if (!isElectron()) return;
        const invoices = await dbAdapter.getInvoices(get().activeStoreId) || [];
        set({ invoices });
      },

      getInvoiceById: async (id) => {
        if (!isElectron()) return get().invoices.find(i => i.id === id) || null;
        return await dbAdapter.getInvoiceById(id);
      },

      createInvoice: async (invoiceData) => {
        const id = generateId('inv');
        const invoiceNumber = invoiceData.invoiceNumber || generateInvoice('INV');
        const newInvoice = {
          ...invoiceData,
          id,
          updatedAt: new Date().toISOString(),
          status: invoiceData.status || 'draft'
        } as Invoice;

        set((state) => ({ invoices: [newInvoice, ...state.invoices] }));

        if (isElectron()) {
          await dbAdapter.createInvoice(newInvoice);
          await get().fetchInvoices();
        }
      },

      updateInvoice: async (id, updates) => {
        set((state) => ({
          invoices: state.invoices.map(inv => inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv)
        }));

        if (isElectron()) {
          await dbAdapter.updateInvoice(id, updates);
          await get().fetchInvoices();
        }
      },

      deleteInvoice: async (id) => {
        set((state) => ({
          invoices: state.invoices.filter(inv => inv.id !== id)
        }));

        if (isElectron()) {
          await dbAdapter.deleteInvoice(id);
          await get().fetchInvoices();
        }
      },



      deleteQuotation: (id) => {
        set((state) => ({
          quotations: state.quotations.filter(q => q.id !== id)
        }));
        // dbAdapter.deleteQuotation(id); - Not implemented
      },

      // Inventory Intelligence Implementation
      handleBarcodeScan: async (barcode, mode = 'OUT') => {
        const state = get();

        // Use Electron database if available
        if (isElectron()) {
          const result = await dbAdapter.handleBarcodeScan(barcode, mode, state.activeStoreId) as BarcodeResponse;
          if (result) {
            // Reload products from database to reflect changes
            const products = await dbAdapter.getProducts(state.activeStoreId) as Product[];
            if (products) set({ products });
            return result;
          }
        }

        // Fallback to local logic
        // 1. Validate Barcode
        if (!validateBarcode(barcode)) {
          return {
            barcode,
            status: 'ERROR',
            warning: 'Invalid barcode format. Must be 8-14 numeric digits.',
          };
        }

        // 2. Search Product
        const product = state.products.find(p => p.barcode === barcode && p.storeId === state.activeStoreId);

        if (!product) {
          return {
            barcode,
            status: 'NOT_FOUND',
            warning: 'Product not found in current store inventory.'
          };
        }

        // 3. Update Stock Logic
        const newQuantity = mode === 'IN' ? product.quantity + 1 : product.quantity - 1;

        // Check for negative stock
        if (newQuantity < 0) {
          return {
            product_id: product.id,
            product_name: product.name,
            barcode: product.barcode || barcode,
            previous_stock: product.quantity,
            updated_stock: product.quantity,
            status: 'ERROR',
            warning: 'Cannot reduce stock below zero.',
            action_type: mode,
          };
        }

        // Check for low stock warning
        let warning: string | undefined = undefined;
        if (newQuantity < 10) {
          warning = `Low stock warning! Current: ${newQuantity}`;
        }

        // Apply Update
        const updatedProduct = { ...product, quantity: newQuantity, updatedAt: new Date().toISOString() };
        state.updateProduct(product.id, updatedProduct);

        return {
          product_id: updatedProduct.id,
          product_name: updatedProduct.name,
          barcode: updatedProduct.barcode || barcode,
          previous_stock: product.quantity,
          updated_stock: updatedProduct.quantity,
          status: 'SUCCESS',
          warning,
          action_type: mode
        };
      },

      processExcelUpload: async (rows) => {
        const state = get();

        // Use Electron database if available
        const summary = await dbAdapter.processExcelUpload(rows, state.activeStoreId);
        if (summary) {
          // Reload products from database to reflect changes
          const products = await dbAdapter.getProducts(state.activeStoreId) as Product[];
          if (products) set({ products });
          return summary;
        }
        return {
          total_rows: rows.length,
          created_products: 0,
          updated_products: 0,
          failed_rows: rows.length,
          errors: [{ row: 0, reason: 'Database sync failed' }]
        };

        // Fallback to local logic
        let createdCount = 0;
        let updatedCount = 0;
        let failedCount = 0;
        const errors: { row: number; reason: string }[] = [];

        rows.forEach((row, index) => {
          try {
            // Check if product exists by barcode in active store
            const existingProduct = state.products.find(p => p.barcode === row.barcode && p.storeId === state.activeStoreId);

            if (existingProduct) {
              // Update existing
              state.updateProduct(existingProduct.id, {
                name: row.name,
                sellingPrice: row.price,
                quantity: existingProduct.quantity + row.stock,
                updatedAt: new Date().toISOString()
              });
              updatedCount++;
            } else {
              // Create new
              state.addProduct({
                name: row.name,
                barcode: row.barcode,
                sellingPrice: row.price,
                purchasePrice: row.price * 0.7, // Estimate purchase price
                quantity: row.stock,
                sku: row.barcode, // Use barcode as SKU if not provided
                category: row.category || 'Uncategorized',
                storeId: state.activeStoreId,
                lastUsed: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                unit: 'Pcs'
              });
              createdCount++;
            }
          } catch (e) {
            failedCount++;
            errors.push({ row: index + 2, reason: (e as Error).message });
          }
        });

        return {
          total_rows: rows.length,
          created_products: createdCount,
          updated_products: updatedCount,
          failed_rows: failedCount,
          errors
        };
      },

      // Getters
      getStoreProducts: () => get().products.filter(p => p.storeId === get().activeStoreId),
      getStoreCustomers: () => get().customers.filter(c => c.storeId === get().activeStoreId),
      getStoreSales: () => get().sales.filter(s => s.storeId === get().activeStoreId),
      getStoreTransactions: () => get().transactions.filter(t => t.storeId === get().activeStoreId),
      getStorePurchases: () => get().purchases.filter(p => p.storeId === get().activeStoreId),
      getStoreAccounts: () => get().accounts,
      getStoreQuotations: () => get().quotations.filter(q => q.storeId === get().activeStoreId),
      getStoreItemKits: () => get().itemKits.filter(k => k.storeId === get().activeStoreId),
      getStoreUsers: () => get().users.filter(u => u.storeId === get().activeStoreId),
      getActiveStore: () => get().stores.find(s => s.id === get().activeStoreId),

      // Database sync - Load data from Electron SQLite when available
      syncData: async () => {
        const { isSyncing, accessToken, refreshToken, activeStoreId, loadFromDatabase, logout } = get();
        if (isSyncing || !accessToken || !isElectron()) return;

        set({ isSyncing: true });

        // Helper to handle API requests with refresh retry
        const authenticatedFetch = async (url: string, options: RequestInit, retry = true): Promise<Response> => {
          const currentToken = get().accessToken;
          const response = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${currentToken}`
            }
          });

          if (response.status === 401 && retry && get().refreshToken) {
            console.log('[SYNC] Token expired, attempting refresh...');
            const { authApi } = await import('./auth-api');
            const refreshResult = await authApi.refreshToken(get().refreshToken);

            if (refreshResult && refreshResult.access) {
              console.log('[SYNC] Token refreshed successfully');
              set({
                accessToken: refreshResult.access,
                // Update refresh token if returned, otherwise keep old one
                refreshToken: refreshResult.refresh || get().refreshToken
              });

              // Retry with new token
              return authenticatedFetch(url, options, false);
            } else {
              console.error('[SYNC] Refresh failed, logging out');
              logout();
              // Return the original 401 response to stop execution
              return response;
            }
          }

          return response;
        };

        try {
          console.log('[SYNC] Starting two-way sync...');
          // 1. PUSH
          const dirtyData = await window.electronAPI.getDirtyData();
          console.log('[SYNC] Dirty data check complete:', dirtyData ? `${dirtyData.totalCount} records` : '0 records');

          if (dirtyData) {
            console.log('[SYNC] Push initiated');
            console.log('[SYNC] Push payload size:', JSON.stringify(dirtyData).length);
            const response = await authenticatedFetch(`${API_URL}/sync/push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dirtyData),
            });

            // If we logged out during fetch, stop
            if (!get().isAuthenticated) return;

            let pushResult: Record<string, any> | null = null;
            let pushText = '';
            try {
              pushText = await response.text();
              if (response.headers.get('content-type')?.includes('application/json')) {
                pushResult = JSON.parse(pushText);
              }
            } catch (e) {
              console.error('[SYNC] Failed to parse push response');
            }

            if (!response.ok) {
              console.error('[SYNC] Push failed with status:', response.status);
              console.error('[SYNC] Push error detail:', pushText || pushResult);
              set({ isSyncing: false });
              return;
            }

            if (response.ok) {
              // Build synced_ids from VPS response OR fall back to all records in local payload
              // This prevents invalid local records (e.g. seed data) from looping as "pending" forever
              const confirmedIds = (pushResult?.synced_ids && Object.keys(pushResult.synced_ids).length > 0)
                ? pushResult.synced_ids
                : Object.fromEntries(
                  Object.entries((dirtyData as { payload: Record<string, { id: string }[]> }).payload || {}).map(([tbl, rows]) => [
                    tbl, rows.map((r: { id: string }) => r.id)
                  ])
                );
              await window.electronAPI.markAsSynced(confirmedIds);
              console.log('[SYNC] Push completed & marked');
            }
          }

          // 2. PULL
          const lastSync = await window.electronAPI.getLastPullTimestamp() || '2000-01-01T00:00:00.000Z';
          // Use authenticated fetch for pull as well
          console.log('[SYNC] Pull initiated with:', {
            store_id: activeStoreId,
            last_sync: lastSync
          });
          const pullResponse = await authenticatedFetch(`${API_URL}/sync/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              store_id: activeStoreId,
              last_sync: lastSync
            }),
          });

          let pullResult: Record<string, any> | null = null;
          let pullText = '';
          try {
            pullText = await pullResponse.text();
            if (pullResponse.headers.get('content-type')?.includes('application/json')) {
              pullResult = JSON.parse(pullText);
            }
          } catch (e) {
            console.error('[SYNC] Failed to parse pull response');
          }

          if (!pullResponse.ok) {
            console.error('[SYNC] Pull failed with status:', pullResponse.status);
            console.error('[SYNC] Pull error detail:', pullText || pullResult);
            set({ isSyncing: false });
            return;
          }

          // If we logged out during fetch, stop
          if (!get().isAuthenticated) return;

          if (pullResponse.ok && pullResult) {
            if (pullResult.status === 'success' && pullResult.updates) {
              console.log('[SYNC] Pull received updates for tables:', Object.keys(pullResult.updates));
              const applyResult = await window.electronAPI.applyCloudUpdates({
                updates: pullResult.updates,
                serverTime: pullResult.server_time
              });
              if (applyResult.success) {
                await loadFromDatabase(); // Refresh local state
              }
            }
          }

        } catch (error) {
          console.error('Background sync failed:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      loadFromDatabase: async () => {
        if (!isElectron()) return; // Skip if not in Electron

        const state = get();
        try {
          // Load all data from database
          const log = (msg: string) => isElectron() ? window.electronAPI.log(msg) : console.log(msg);

          log(`[Store] Loading from database for store: ${state.activeStoreId}`);
          const [
            products, customers, sales, quotations, purchases,
            transactions, accounts, stores, users, stockTransfers,
            expenseCategories, taxSlabs, purchaseOrders, commissions,
            loyaltyPoints, itemKits, customFields, productCustomValues, customerCustomValues,
            suppliers, supplierCustomFields, paymentTerms, receivings, invoices
          ] = await Promise.all([
            dbAdapter.getProducts(state.activeStoreId) as Promise<Product[]>,
            dbAdapter.getCustomers(state.activeStoreId) as Promise<Customer[]>,
            dbAdapter.getSales(state.activeStoreId) as Promise<Sale[]>,
            dbAdapter.getQuotations(state.activeStoreId) as Promise<Quotation[]>,
            dbAdapter.getPurchases(state.activeStoreId) as Promise<Purchase[]>,
            dbAdapter.getTransactions(state.activeStoreId) as Promise<Transaction[]>,
            dbAdapter.getAccounts(state.activeStoreId) as Promise<Account[]>,
            dbAdapter.getStores() as Promise<Store[]>,
            dbAdapter.getUsers() as Promise<User[]>,
            dbAdapter.getStockTransfers ? dbAdapter.getStockTransfers(state.activeStoreId) as Promise<StockTransfer[]> : Promise.resolve([]),
            dbAdapter.getExpenseCategories ? dbAdapter.getExpenseCategories() as Promise<ExpenseCategory[]> : Promise.resolve([]),
            dbAdapter.getTaxSlabs ? dbAdapter.getTaxSlabs() as Promise<TaxSlab[]> : Promise.resolve([]),
            dbAdapter.getPurchaseOrders ? dbAdapter.getPurchaseOrders(state.activeStoreId) as Promise<PurchaseOrder[]> : Promise.resolve([]),
            dbAdapter.getCommissions ? dbAdapter.getCommissions(state.activeStoreId) as Promise<Commission[]> : Promise.resolve([]),
            dbAdapter.getLoyaltyPoints ? dbAdapter.getLoyaltyPoints(state.activeStoreId) as Promise<LoyaltyPoint[]> : Promise.resolve([]),
            dbAdapter.getItemKits ? dbAdapter.getItemKits(state.activeStoreId) as Promise<ItemKit[]> : Promise.resolve([]),
            dbAdapter.getCustomFields ? dbAdapter.getCustomFields() as Promise<CustomField[]> : Promise.resolve([]),
            dbAdapter.getAllProductCustomValues ? dbAdapter.getAllProductCustomValues() as Promise<ProductCustomValue[]> : Promise.resolve([]),
            dbAdapter.getAllCustomerCustomValues ? dbAdapter.getAllCustomerCustomValues() as Promise<CustomerCustomValue[]> : Promise.resolve([]),
            dbAdapter.getSuppliers ? dbAdapter.getSuppliers(state.activeStoreId) as Promise<Supplier[]> : Promise.resolve([]),
            dbAdapter.getSupplierCustomFields ? dbAdapter.getSupplierCustomFields(state.activeStoreId) as Promise<SupplierCustomField[]> : Promise.resolve([]),
            dbAdapter.getPaymentTerms ? dbAdapter.getPaymentTerms(state.activeStoreId) as Promise<PaymentTerm[]> : Promise.resolve([]),
            dbAdapter.getReceivings ? dbAdapter.getReceivings(state.activeStoreId) as Promise<Receiving[]> : Promise.resolve([]),
            dbAdapter.getInvoices ? dbAdapter.getInvoices(state.activeStoreId) as Promise<Invoice[]> : Promise.resolve([])
          ]);

          console.log(`[Store] Data loaded: ${products.length} products, ${sales.length} sales found locally.`);

          log(`[Store] Database results: ${products?.length || 0} products, ${customers?.length || 0} customers`);

          set({
            products: products || state.products,
            customers: customers || state.customers,
            sales: sales || state.sales,
            quotations: quotations || state.quotations,
            purchases: purchases || state.purchases,
            transactions: transactions || state.transactions,
            accounts: accounts || state.accounts,
            stores: stores || state.stores,
            users: users || state.users,
            stockTransfers: stockTransfers || state.stockTransfers,
            expenseCategories: expenseCategories || state.expenseCategories,
            taxSlabs: taxSlabs || state.taxSlabs,
            purchaseOrders: purchaseOrders || state.purchaseOrders,
            commissions: commissions || state.commissions,
            loyaltyPoints: loyaltyPoints || state.loyaltyPoints,
            itemKits: itemKits || state.itemKits,
            customFields: customFields || state.customFields,
            productCustomValues: productCustomValues || state.productCustomValues,
            customerCustomValues: customerCustomValues || state.customerCustomValues,
            suppliers: suppliers || state.suppliers,
            supplierCustomFields: supplierCustomFields || state.supplierCustomFields,
            paymentTerms: paymentTerms || state.paymentTerms,
            receivings: receivings || state.receivings,
            invoices: invoices || state.invoices,
          });
        } catch (error) {
          console.error('Failed to load from database:', error);
        }
      },

      // Supplier Actions Implementation
      addSupplier: async (supplierData) => {
        const id = generateId('sup');
        const newSupplier: Supplier = {
          ...supplierData,
          id,
          currentBalance: supplierData.openingBalance || 0,
          isDeleted: false,
          updatedAt: new Date().toISOString()
        } as Supplier;

        await dbAdapter.addSupplier(newSupplier);
        await get().loadFromDatabase();
      },

      updateSupplier: async (id, updates) => {
        await dbAdapter.updateSupplier(id, updates);
        await get().loadFromDatabase();
      },

      deleteSupplier: async (id) => {
        await dbAdapter.deleteSupplier(id);
        await get().loadFromDatabase();
      },

      getSupplierLedger: async (supplierId) => await dbAdapter.getSupplierLedger(supplierId) || [],

      addSupplierTransaction: async (txData) => {
        const id = generateId('stx');
        const newTx: SupplierTransaction = {
          ...txData,
          id,
          createdAt: new Date().toISOString()
        } as SupplierTransaction;

        await dbAdapter.addSupplierTransaction(newTx);
        await get().loadFromDatabase();
      },

      addSupplierCustomField: async (fieldData) => {
        const id = generateId('scf');
        const newField: SupplierCustomField = {
          ...fieldData,
          id,
          updatedAt: new Date().toISOString()
        } as SupplierCustomField;

        await dbAdapter.addSupplierCustomField(newField);
        await get().loadFromDatabase();
      },

      saveSupplierCustomValue: async (valData) => {
        const id = `scfv-${valData.supplierId}-${valData.fieldId}`;
        const newVal: SupplierCustomValue = {
          ...valData,
          id,
          updatedAt: new Date().toISOString()
        } as SupplierCustomValue;

        await dbAdapter.saveSupplierCustomValue(newVal);
        // Usually custom values are loaded when needed, so maybe no need to reload all
      },

      getPaymentTerms: async () => {
        if (!get().paymentTerms.length) {
          await get().loadFromDatabase();
        }
        return get().paymentTerms;
      },

      addPaymentTerm: async (termData) => {
        const id = generateId('pt');
        const newTerm: PaymentTerm = {
          ...termData,
          id,
          storeId: get().activeStoreId,
          updatedAt: new Date().toISOString()
        };
        await dbAdapter.addPaymentTerm(newTerm);
        await get().loadFromDatabase();
      },

      getSupplierDocuments: async (supplierId) => {
        const docs = await dbAdapter.getSupplierDocuments(supplierId);
        set(state => ({
          supplierDocuments: {
            ...state.supplierDocuments,
            [supplierId]: docs
          }
        }));
        return docs;
      },

      addSupplierDocument: async (docData) => {
        const id = generateId('sdoc');
        const newDoc: SupplierDocument = {
          ...docData,
          id,
          storeId: get().activeStoreId,
          uploadedAt: new Date().toISOString()
        };
        await dbAdapter.addSupplierDocument(newDoc);
        if (docData.supplierId) {
          await get().getSupplierDocuments(docData.supplierId);
        }
      },

      // Receiving Actions Implementation
      addReceiving: async (receivingData) => {
        const id = generateId('recv');
        const newReceiving: Receiving = {
          ...receivingData,
          id,
          updatedAt: new Date().toISOString(),
          items: receivingData.items?.map(item => ({
            ...item,
            id: item.id && item.id !== '' ? item.id : generateId('ri'),
            receivingId: id
          }))
        };
        await dbAdapter.addReceiving(newReceiving);
        await get().loadFromDatabase();
      },

      updateReceiving: async (id, updates) => {
        await dbAdapter.updateReceiving(id, updates);
        await get().loadFromDatabase();
      },

      completeReceiving: async (id, amountPaid, accountId) => {
        await dbAdapter.completeReceiving({ id, accountId, amountPaid });
        await get().loadFromDatabase();
      },

      suspendReceiving: async (id) => {
        await dbAdapter.suspendReceiving(id);
        await get().loadFromDatabase();
      },

      deleteReceiving: async (id) => {
        await dbAdapter.deleteReceiving(id);
        await get().loadFromDatabase();
      },

      getReceivingById: async (id) => {
        return await dbAdapter.getReceivingById(id);
      },

      // HR Actions Implementation
      checkIn: async () => {
        const { currentUser, activeStoreId } = get();
        if (!currentUser) return { success: false, message: 'User not logged in' };
        try {
          const result = await dbAdapter.checkIn(currentUser.id, activeStoreId);
          if (result?.success) {
            await get().fetchAttendance();
            return { success: true };
          }
          return { success: false, message: 'Check-in failed' };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          return { success: false, message };
        }
      },

      checkOut: async () => {
        const { currentUser } = get();
        if (!currentUser) return { success: false, message: 'User not logged in' };
        try {
          const result = await dbAdapter.checkOut(currentUser.id);
          if (result?.success) {
            await get().fetchAttendance();
            return { success: true };
          }
          return { success: false, message: 'Check-out failed' };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          return { success: false, message };
        }
      },

      fetchAttendance: async (startDate, endDate) => {
        const { currentUser } = get();
        // If not admin, only fetch for current user
        const userId = get().currentUser?.role === 'admin' ? undefined : currentUser?.id;
        const data = await dbAdapter.getAttendance(userId, startDate, endDate);
        if (data) set({ hrAttendance: data });
      },

      applyLeave: async (leave) => {
        const { currentUser, activeStoreId } = get();
        if (!currentUser) return;
        const result = await dbAdapter.applyLeave({
          ...leave,
          userId: currentUser.id,
          storeId: activeStoreId
        });
        if (result?.success) {
          await get().fetchLeaves();
        }
      },

      fetchLeaves: async () => {
        const data = await dbAdapter.getLeaves(get().activeStoreId);
        if (data) set({ hrLeaves: data });
      },

      updateLeaveStatus: async (id, status) => {
        const success = await dbAdapter.updateLeaveStatus(id, status);
        if (success) {
          await get().fetchLeaves();
        }
      },

      fetchPayroll: async () => {
        const { currentUser, activeStoreId } = get();
        if (!currentUser) return;
        const userId = currentUser.role === 'admin' ? undefined : currentUser.id;
        const data = await dbAdapter.getPayroll(activeStoreId, userId);
        if (data) set({ hrPayroll: data });
      },

      // Cheque Actions Implementation
      fetchCheques: async () => {
        const data = await dbAdapter.getCheques(get().activeStoreId);
        if (data) set({ cheques: data as Cheque[] });
      },

      addCheque: async (chequeData) => {
        const id = generateId('chq');
        const newCheque: Cheque = {
          ...chequeData,
          id,
          storeId: get().activeStoreId,
          updatedAt: new Date().toISOString(),
          status: 'pending'
        };
        await dbAdapter.addCheque(newCheque);
        await get().fetchCheques();
      },

      updateChequeStatus: async (id, status, clearingDate) => {
        const updates: Partial<Cheque> = { status };
        if (clearingDate) updates.clearingDate = clearingDate;

        await dbAdapter.updateCheque(id, updates);

        // If cleared, we might want to update the store balance
        // This depends on the specific accounting logic, but usually
        // clearing a cheque increases (customer) or decreases (supplier) balance.
        // For now, let's keep it simple as requested and just update the status.

        await get().fetchCheques();
      },

      deleteCheque: async (id) => {
        await dbAdapter.deleteCheque(id);
        await get().fetchCheques();
      },
    }),
    {
      name: 'erp-store-v1',
    }
  )
);
