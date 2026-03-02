# macOS Packaging Guide

Follow these steps to build the StoreFlow ERP `.app` file on a Mac.

## Prerequisites
- **Node.js**: Install the LTS version from [nodejs.org](https://nodejs.org).
- **Git**: Ensure Git is installed (`git --version`).

## Step-by-Step Build Process

### 1. Extract the Project
Unzip the `storeflow-erp.zip` file to your desktop or a preferred directory.

### 2. Install Dependencies
Open **Terminal**, navigate to the project folder, and run:
```bash
npm install
```

### 3. Rebuild Native Modules
Since macOS uses ARM (M1/M2/M3) or Intel, you must rebuild the SQLite engine for your specific Mac architecture:
```bash
npx @electron/rebuild -f -w better-sqlite3
```

### 4. Build the Frontend
Compile the React application:
```bash
npm run build
```

### 5. Package for Mac
Run the distribution command:
```bash
npx electron-builder --mac
```

## Results
- The packaged application will be located in the `release/` directory as a `.dmg` or `.app` file.
- **Note**: If you see a security warning when opening the app, go to **System Settings > Privacy & Security** and click **"Open Anyway"**.

---
*Created for StoreFlow Release Management*
