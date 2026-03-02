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
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-white text-gray-800 border-r border-gray-100 sticky top-0">
      {/* Clean Header */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-1.5 bg-black rounded-lg text-white shadow-sm">
            <Hexagon className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-black tracking-tight">StoreFlow</h1>
            <span className="text-[10px] font-semibold bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">v2.0.4</span>
          </div>
        </div>
        {activeStore && (
          <p className="text-xs text-gray-500 mt-2 font-medium">{activeStore.name} [{activeStore.branch}]</p>
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
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
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
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gray-200 flex items-center justify-center text-black text-sm font-semibold rounded-full">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-black truncate">{currentUser?.name || 'User'}</p>
            <p className="text-xs text-gray-500 capitalize">{currentUser?.role || 'user'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-red-50 text-gray-700 hover:text-red-500 text-sm font-medium transition-colors border border-gray-200 rounded-xl"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
