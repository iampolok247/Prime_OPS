import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut, User as UserIcon, Menu } from 'lucide-react';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  return (
    <header className="h-16 bg-navy text-white flex items-center justify-between px-4 shadow-soft">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-navy/80 rounded-lg transition"
        >
          <Menu size={20} />
        </button>
        
        {/* Logo - smaller on mobile */}
        <div className="px-2">
          <img src="https://primeacademy.org/logo-full.png" alt="Prime Academy" className="h-6 md:h-8 object-contain" />
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-3">
        <img src={user?.avatar} alt="avatar" className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-gold object-cover"/>
        
        {/* User info - hidden on small mobile */}
        <div className="hidden sm:block text-sm leading-tight">
          <div className="font-semibold">{user?.name}</div>
          <div className="opacity-80 text-xs">{user?.designation}</div>
        </div>
        
        {/* Profile button - responsive */}
        <a href="/profile" className="hidden md:inline-flex items-center gap-1 bg-gold text-navy px-3 py-2 rounded-2xl hover:bg-lightgold transition text-sm">
          <UserIcon size={16}/> Profile
        </a>
        
        {/* Mobile profile icon */}
        <a href="/profile" className="md:hidden p-2 bg-gold text-navy rounded-full hover:bg-lightgold transition">
          <UserIcon size={16}/>
        </a>
        
        {/* Logout button - responsive */}
        <button onClick={logout} className="hidden md:inline-flex items-center gap-1 bg-white text-navy px-3 py-2 rounded-2xl hover:bg-lightgold transition text-sm">
          <LogOut size={16}/> Logout
        </button>
        
        {/* Mobile logout icon */}
        <button onClick={logout} className="md:hidden p-2 bg-white text-navy rounded-full hover:bg-lightgold transition">
          <LogOut size={16}/>
        </button>
      </div>
    </header>
  );
}
