import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Wallet,
  Receipt,
  ReceiptText,
  Store,
  UserCog,
  FileText,
  ShoppingBag,
  LogOut,
  Hexagon,
  Settings,
  BarChart3,
  ShieldCheck,
  FolderTree,
  Award,
  BookOpen,
  PieChart,
  ClipboardList,
  ArrowRightLeft,
  Percent
} from 'lucide-react';
import { useERPStore } from '@/lib/store-data';
import { SyncStatus } from '../sync/SyncStatus';

import { ROLE_SIDEBARS, NavItem } from '@/config/navigation';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, getActiveStore } = useERPStore();
  const activeStore = getActiveStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get items based on role, default to 'user' if no role
  const userRole = currentUser?.role || 'user';
  const navItems = ROLE_SIDEBARS[userRole] || ROLE_SIDEBARS['user'];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-black text-white border-r border-gray-800 sticky top-0">
      {/* Clean Header */}
      <div className="p-5 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/invenza-bg.png" alt="Invenza Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-white tracking-tight leading-none">Invenza</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold bg-green-900/50 px-2 py-0.5 rounded-full text-green-400 border border-green-800">
                PRIME v1.0.1
              </span>
              <button
                onClick={async () => {
                  const api = (window as any).electronAPI;
                  if (api?.checkForUpdates) {
                    console.log('[Sidebar] Manual update check started...');
                    const res = await api.checkForUpdates();
                    console.log('[Sidebar] Check result:', res);
                    if (!res.success) alert('Update check failed: ' + res.error);
                    else if (!res.info) alert('No updates available.');
                  }
                }}
                className="text-[10px] text-gray-500 hover:text-white transition-colors underline"
              >
                Check
              </button>
            </div>
          </div>
        </div>
        {activeStore && (
          <p className="text-xs text-gray-400 mt-2 font-medium">{activeStore.name} [{activeStore.branch}]</p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-none">
        {navItems.map((item) => {
          try {
            const isActive = item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-[15px] font-medium rounded-xl transition-all ${isActive
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                <span>{item.title}</span>
              </button>
            );
          } catch (err) {
            console.error("Sidebar item render error:", err, item);
            return null;
          }
        })}
      </nav>

      {/* Sync Status */}
      <SyncStatus />

      {/* User Section (Docked to bottom) */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gray-700 flex items-center justify-center text-white text-sm font-semibold rounded-full">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{currentUser?.name || 'User'}</p>
            <p className="text-xs text-gray-400 capitalize">{currentUser?.role || 'user'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-red-900 text-gray-300 hover:text-red-400 text-sm font-medium transition-colors border border-gray-700 rounded-xl"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
