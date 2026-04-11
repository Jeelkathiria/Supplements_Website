import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LogOut, User, MapPin, Package, Heart, ChevronsLeft, ChevronsRight, Menu, X } from 'lucide-react';
import { useAuth } from '../components/context/AuthContext';
import logoFull from '../../images/LOGO.png';
import logoCollapsed from '../../images/LOGO1.png';

export const Account: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Menu items for navigation
  const menuItems = [
    { label: 'Profile', icon: User, path: '/account/profile' },
    { label: 'Addresses', icon: MapPin, path: '/account/addresses' },
    { label: 'Orders', icon: Package, path: '/account/orders' },
    { label: 'Favorites', icon: Heart, path: '/account/favourites' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-[calc(100vh-115px)] md:min-h-screen bg-[#F8FAFB] overflow-hidden">
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:block flex-shrink-0">
        <div
          className={`h-screen bg-white border-r border-neutral-200 flex flex-col transition-all duration-500 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-72'
            }`}
        >
          {/* Header with Logo & Toggle */}
          <div className={`flex items-center transition-all px-5 py-6 border-b border-teal-800 bg-gradient-to-r from-teal-700 to-teal-900 ${isSidebarCollapsed ? 'justify-between' : 'justify-between'
            }`}>
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <img src={logoFull} alt="Logo" className="w-20 h-20 object-contain" />
                <span className="font-bold text-lg text-white">MUSCLE & POWER</span>
              </div>
            ) : (
              <img src={logoCollapsed} alt="Logo" className="w-15 h-15 object-contain" />
            )}

            {!isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1.5 hover:bg-teal-600 rounded-lg transition-colors text-teal-100 hover:text-white"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            )}

            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 hover:bg-teal-600 rounded-lg transition-colors text-teal-100 hover:text-white"
              >
                <ChevronsRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* User Profile Card */}
          <div className={`transition-all ${isSidebarCollapsed
            ? 'px-3 py-4 flex justify-center'
            : 'mx-3 my-4 p-4 rounded-xl bg-neutral-50 border border-neutral-100'
            }`}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'
              }`}>
              <div className="w-11 h-11 min-w-[2.75rem] rounded-xl bg-gradient-to-br from-teal-600 to-teal-900 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {user?.name?.charAt(0) || 'U'}
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className={`flex-1 space-y-1 transition-all ${isSidebarCollapsed ? 'px-2' : 'px-3'
            }`}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center transition-all py-3 rounded-xl ${isSidebarCollapsed
                    ? 'justify-center px-0'
                    : 'gap-3 px-3 justify-start'
                    } ${isActive(item.path)
                      ? 'bg-teal-900 text-white font-semibold shadow-lg'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className={`border-t border-neutral-200 transition-all ${isSidebarCollapsed ? 'px-2 py-4' : 'px-3 py-4'
            }`}>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center py-3 rounded-xl text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-all ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3 justify-start'
                }`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE SIDEBAR (Drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-neutral-200 flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-6 border-b bg-teal-900 border-neutral-100 justify-between">
              <div className="flex items-center gap-2">
                <img src={logoFull} alt="Logo" className="bg-teal-900 rounded-full w-13 h-13 object-contain" />
                <span className="font-bold text-neutral-900 text-sm tracking-tight">MUSCLE & POWER</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Card */}
            <div className="mx-3 my-4 p-4 rounded-xl bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-900 text-white flex items-center justify-center font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Menu */}
            <nav className="flex-1 px-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center gap-3 py-3 px-3 rounded-xl transition-all ${isActive(item.path)
                      ? 'bg-teal-900 text-white font-semibold'
                      : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-neutral-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 py-3 px-3 rounded-xl text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT AREA - Rendered by nested routes via Outlet */}
      <div className="flex-1 flex flex-col h-[calc(100vh-115px)] md:h-screen overflow-hidden">
        {/* TOP BAR WITH MENU TOGGLE (Mobile) */}
        <div className="md:hidden sticky top-0 z-30 bg-white border-b border-neutral-200 p-4 flex items-center justify-between shadow-sm">
          <h1 className="text-lg font-bold text-neutral-900">Account</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Account;
