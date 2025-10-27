import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function Topbar() {
  const { user, logout } = useAuth();
  return (
    <header className="h-16 bg-navy text-white flex items-center justify-between px-4 shadow-soft">
      <div className="font-semibold tracking-wide">Prime Academy Office Management</div>
      <div className="flex items-center gap-3">
        <img src={user?.avatar} alt="avatar" className="w-9 h-9 rounded-full border-2 border-gold object-cover"/>
        <div className="text-sm leading-tight">
          <div className="font-semibold">{user?.name}</div>
          <div className="opacity-80">{user?.designation}</div>
        </div>
        <a href="/profile" className="ml-2 inline-flex items-center gap-1 bg-gold text-navy px-3 py-2 rounded-2xl hover:bg-lightgold transition">
          <UserIcon size={16}/> Profile
        </a>
        <button onClick={logout} className="inline-flex items-center gap-1 bg-white text-navy px-3 py-2 rounded-2xl hover:bg-lightgold transition">
          <LogOut size={16}/> Logout
        </button>
      </div>
    </header>
  );
}
