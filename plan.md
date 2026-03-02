# 🧭 ERP Development Roadmap — From Zero to VPS Deployment

This document tracks the technical progress and future trajectory of the Local-First ERP system.

---

## 📊 Project Status: **Phase 3 (Finalizing)**
**Current Milestone**: Database DNA & Local Persistence

---

## 🥇 Phase 1: UI & Experience (COMPLETE)
*Goal: Build a high-fidelity React interface for ERP operations.*
- [x] Responsive Dashboards (Sales, Inventory, Customers)
- [x] Interactive Forms (New Sale, New Product, etc.)
- [x] State Management (Zustand) for rapid UI updates
- [x] **Tech**: React JS, Tailwind CSS, Shadcn UI, Lucide Icons

## 🥈 Phase 2: Desktop Integration (COMPLETE)
*Goal: Wrap React in a secure desktop environment.*
- [x] Electron Main & Preload process setup
- [x] Secure IPC Bridge (Frontend cannot touch OS directly)
- [x] Handling Native Build compatibility (@electron/rebuild)
- [x] **Tech**: Electron, Node.js

## 🥉 Phase 3: Local Data Engine (COMPLETE)
*Goal: SQLite as the Single Source of Truth.*
- [x] SQLite Schema Design (Stores, Users, Products, Sales, etc.)
- [x] **Database DNA**: Every record has `device_id`, `sync_status`, and `updated_at`.
- [x] Persistent Storage: Closing the app does NOT lose data.
- [x] **Tech**: better-sqlite3, uuid/crypto

---

## 🟦 Phase 4: Core Offline Features (NEXT STEP)
*Goal: Implement business logic and data integrity rules.*
- [ ] **Atomic Stock Movement**: Deduct stock automatically on Sale; Increase on Purchase.
- [ ] **Audit Trail (stock_logs)**: Detailed history of every product movement.
- [ ] **Transactional Integrity**: Ensure Sales + Inventory updates stay in sync even if the app crashes midway.
- [ ] **Offline Reports**: Inventory valuation, Low stock alerts, Daily sales summaries.

## 🟪 Phase 4.5 — Data Validation Layer

Input validation before DB write

Guardrails against negative stock

Duplicate barcode protection

Constraint errors surfaced to UI

## 🟨 Phase 5: Sync Engine — Local Side
*Goal: Prepare data for the cloud without needing a constant connection.*
- [ ] **The "Dirty Data" Finder**: Logic to identify records where `sync_status = 0`.
- [ ] **ID Mapping**: Strategy to handle global synchronization of local UUIDs.
- [ ] **Manual Sync Trigger**: User-controlled button to "Upload to Cloud" when internet is found.

## 🟧 Phase 6: Central Sync — Server Side
*Goal: Build the "Mirror" for the local data.*
- [ ] **Django REST API**: Endpoints optimized for receiving bulk sync payloads.
- [ ] **Conflict Resolution**: Logic to handle "PC-1 updated product at 5:00 while PC-2 updated it at 5:01".
- [ ] **Tech**: Django, Django REST Framework

## 🟥 Phase 7: Central Database
*Goal: Consolidate data from all branch PCs.*
- [x] **PostgreSQL Migration**: Move from local SQLite silos to a central relational powerhouse.
- [ ] **Cross-PC Analytics**: View combined sales from Branch A + Branch B in one dashboard.

## ☁️ Phase 8: Cloud Deployment (VPS)
*Goal: Final production environment.*
- [ ] **VPS Setup**: Hardening the Linux server.
- [ ] **Dockerization**: Containerizing Django & Postgres for 99.9% uptime.
- [ ] **SSL & Security**: Ensuring business data is encrypted over the wire.

## 🧑‍💼 Phase 9: User Experience
*Goal: Final binary for the customer.*
- [ ] **One-Click Installer**: Create `.exe` (Windows) and `.dmg` (Mac).
- [ ] **Auto-Updates**: App notifies user when a new version is available.

---

## 🎯 Current Technical Focus
We are transitioning from **Data Storage** (Phase 3) to **Data Logic** (Phase 4).
**Next Action**: Implement the `db.transaction()` wrapper for Sales to ensure stock integrity.
