# How to Test the Store Configuration

The Store Configuration uses **Zustand with Local Storage Persistence** coupled with **SQLite Database Synchronization**. This means your browser saves changes instantly, and they are also backed up and shared via the global database.

## Step 1: Start the App
Run your application normally:
```bash
npm run dev
```
*(Or use `npm run electron` if testing the desktop wrapper).*

## Step 2: Navigate to Store Config
1. Log into the application (if required).
2. Look at the Sidebar on the left.
3. Scroll down and click on **Store Config**.

## Step 3: Test Real-Time Updates & Database Saving
1. Go to the **Company Info** tab.
2. Change the "Company Name" to `My Test Company`.
3. Go to the **Currency** tab.
4. Change the "Currency Symbol" from `$` to `£`.
5. Click **Save All Changes** at the top right.
6. A success message should appear indicating it saved to the database.

## Step 4: Test Global Persistence (Database Load)
1. **Refresh the page** (Press F5 or Ctrl+R).
2. Go back to the **Store Config** page.
3. **Verify:** You should see that `My Test Company` and `£` are still there! 

## Step 5: Advanced Test (Developer Validation)
1. Press `F12` to open your browser's Developer Tools.
2. Go to the **Application** tab (in Chrome/Edge).
3. Under **Local Storage** on the left, click your app's URL.
4. Delete the key `storeflow-store-config`.
5. Refresh the page.
6. If the backend IPC integration is successful, the app will *automatically pull the configuration back* from the SQLite `settings` table and restore your settings, even without Local Storage!
