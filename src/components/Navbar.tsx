import React from 'react';
import { Sparkles, Shirt, Layout, Users, LogOut, User as UserIcon, Video, ShoppingBag, Star, Zap, Home } from 'lucide-react';
import { User } from 'firebase/auth';
import { UserTier } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavbarProps {
  user: User | null;
  tier?: UserTier;
  onLogout: () => void;
  onUpgrade: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const Navbar = ({ user, tier, onLogout, onUpgrade, activeTab, setActiveTab, cartCount, onOpenCart }: NavbarProps) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-cream/95 backdrop-blur-md border-t-4 border-primary/20 px-6 py-4 z-50 md:top-0 md:bottom-auto md:border-b-4 md:border-t-0 shadow-2xl">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <div className="hidden md:flex items-center gap-8 font-heading text-3xl tracking-tighter text-primary">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
          <div className="w-12 h-12 bg-pink rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg border-2 border-primary/10">
            <Sparkles className="text-primary" size={24} fill="currentColor" />
          </div>
          <span className="font-heading italic">Social Thrift</span>
        </div>
        {user && (
          <button 
            onClick={onUpgrade}
            className={cn(
              "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-md border-2",
              tier === 'premium' 
                ? "bg-orange border-primary text-primary shadow-orange/20" 
                : "bg-white border-primary/10 text-primary/60 hover:bg-cream hover:scale-105"
            )}
          >
            {tier === 'premium' ? <Star size={12} fill="currentColor" /> : <Zap size={12} />}
            {tier === 'premium' ? 'Premium Member' : 'Upgrade to Premium'}
          </button>
        )}
      </div>
      <div className="flex flex-1 justify-around md:justify-end md:gap-6">
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'lab', icon: Sparkles, label: 'AI Lab' },
          { id: 'wardrobe', icon: Shirt, label: 'Wardrobe' },
          { id: 'styler', icon: Layout, label: 'Styler' },
          { id: 'upcycle', icon: Video, label: 'Upcycle' },
          { id: 'market', icon: ShoppingBag, label: 'Market' },
          { id: 'community', icon: Users, label: 'Feed' },
          { id: 'profile', icon: UserIcon, label: 'Profile' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all md:flex-row md:gap-2 px-4 py-2 rounded-2xl group",
              activeTab === tab.id 
                ? "text-primary bg-pink font-bold shadow-lg scale-110" 
                : "text-dark/40 hover:text-primary hover:bg-pink/10"
            )}
          >
            <tab.icon size={20} className={cn(activeTab === tab.id ? "scale-110" : "group-hover:scale-110 transition-transform")} />
            <span className="text-[10px] font-heading uppercase tracking-wider md:text-sm md:capitalize md:tracking-normal hidden md:block">
              {tab.label}
            </span>
          </button>
        ))}
        {user && (
          <div className="flex items-center gap-6 md:ml-6 border-l-2 border-primary/10 pl-8">
            <button 
              onClick={onOpenCart}
              className="relative p-2 text-dark/40 hover:text-primary transition-colors group"
            >
              <ShoppingBag size={24} className="group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-orange text-primary text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>
            <button 
              onClick={onLogout} 
              className="p-2 text-dark/40 hover:text-red-500 transition-colors group"
              title="Logout"
            >
              <LogOut size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  </nav>
);
