

.\venv\Scripts\python manage.py runserver 0.0.0.0:8000

🧭 COMPLETE ERP BLUEPRINT (FROM ZERO → USER USE)

(Correct order, no jumping)

🥇 PHASE 1 — UI (WHAT USER SEES)
🔹 React JS

What it is

Screens

Forms

Buttons

Tables

Charts

What it does

Shows inventory

Takes input

Shows reports

Important rule

React does NOT store real data
React only shows data

At this stage:

You can use sample data

UI must work perfectly

✅ You already did this

🥈 PHASE 2 — DESKTOP APP (HOW IT RUNS OFFLINE)
🔹 Electron

What it is

Wraps React into a desktop software

Like Chrome + Node.js

Why needed

Offline usage

File system access

SQLite access

Barcode scanner

Excel upload

What Electron does

Opens React as a desktop app

Talks to OS

Acts as backend for React

Without Electron → offline ERP is impossible

✅ You already did this

🥉 PHASE 3 — LOCAL DATA (OFFLINE STORAGE)
🔹 SQLite

What it is

Local database file

No server

One file per computer

Where

Each PC → storeflow.db


What it stores

Products

Stock

Sales

Everything

Important rule

SQLite is the source of truth

React never owns data.

Flow

React → Electron → SQLite


At this stage:

Add / Edit / Delete inventory

Close app → data stays

Internet NOT needed

✅ This is what you’re building now

🟦 PHASE 4 — CORE FEATURES (STILL OFFLINE)

(ALL local, NO server)

You build these one by one:

Inventory CRUD

Barcode → stock in/out

Excel upload → bulk data

Reports from SQLite

All work:

Offline

On one PC

Independently

⚠️ Still NO Django
⚠️ Still NO PostgreSQL

🟨 PHASE 5 — SYNC ENGINE (BRIDGE BETWEEN OFFLINE & ONLINE)
🔹 Sync Engine (MOST IMPORTANT CONCEPT)

What it is

Custom logic (not a tool)

Written by you

What it does

Finds unsynced local data

Sends it to server

Marks it as synced

Local DB fields

sync_status = 0 (not synced)
sync_status = 1 (synced)
updated_at
device_id


When it runs

Internet ON → sync

Internet OFF → wait

User does nothing.

🟧 PHASE 6 — CENTRAL SERVER (COMMON DATA)
🔹 Django Backend

What Django is used for

NOT UI

NOT desktop app

Django does:

Receives synced data

Validates it

Saves centrally

Runs

First on your laptop

Later on VPS

🟥 PHASE 7 — CENTRAL DATABASE
🔹 PostgreSQL

What it is

Central database

Stores combined data from all PCs

Why needed

Reports

Backup

Multi-computer data

Owner dashboard

Rule

PostgreSQL is the central truth,
SQLite is local truth

☁️ PHASE 8 — VPS (CLOUD)
🔹 VPS means:

A computer on the internet

Always ON

VPS hosts

Django API

PostgreSQL

VPS does NOT host

React

Electron app

🧑‍💼 PHASE 9 — USER EXPERIENCE (VERY IMPORTANT)
What YOU (developer) do:

Run npm

Build app

Create .exe installer

What USER does:

Install ERP

Double-click icon

Use software

❌ No commands
❌ No terminal
❌ No coding

🔁 INTERNET OFF vs ON (SIMPLE)
❌ Internet OFF

App opens

Data saved locally

Work continues

✅ Internet ON

App auto-syncs

Central DB updated

Reports updated

User never knows.

🖥️ MULTIPLE COMPUTERS (COMMON DATA)
PC	Local DB	Sync
PC 1	SQLite	→ Server
PC 2	SQLite	→ Server
PC 3	SQLite	→ Server

All data merges in PostgreSQL.

🧠 ONE-LINE MEMORY RULE (IMPORTANT)

Build local-first → stabilize → sync → centralize → deploy




........................................

when i add user from electron its not showing in the django and postgresql, also every modals has dif fields in electron , like in django i have 10 fields but in electron i have only 5 fields, so when i sync the data from electron to django , it will not sync properly, so i need to make sure that every modals has same fields in electron and django, and also the sync engine should work properly, add store option in store page ELECTRON ,    





)
(venv) burhan@server1:~/erp-backend$ sudo -u postgres psql
[sudo] password for burhan:
Sorry, try again.
[sudo] password for burhan:
psql (16.11 (Ubuntu 16.11-0ubuntu0.24.04.1))
Type "help" for help.



VPS PostgreSQL (THIS is what production is using)

Installed inside your Ubuntu VPS

Running on that server

Database name: storeflow_db

User: postgres

Password: admin (you set it)




connect to serer : ssh burhan@104.207.70.86
pass : burhan123
cd erp-backend
source venv/bin/activate






sudo systemctl restart gunicorn
sudo systemctl restart nginx
sudo systemctl status gunicorn



ERP = Enterprise Resource Planning