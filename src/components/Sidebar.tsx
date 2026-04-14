import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  LayoutGrid,
  Users,
  LogOut,
  User as UserIcon,
  Video,
  ShoppingBag,
  Star,
  Zap,
  Moon,
  Sun,
  Home,
  ShoppingCart,
} from "lucide-react";
import { User } from "firebase/auth";
import { UserTier } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import "../index.css";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const GeminiIcon = ({ size = 24, fill = "none", className }: { size?: number; fill?: string; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill === "currentColor" ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3L14.5 9.5L21 12L14.5 14.5L12 21L9.5 14.5L3 12L9.5 9.5L12 3Z" />
  </svg>
);

const HangerIcon = ({ size = 24, fill = "none", className }: { size?: number; fill?: string; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill === "currentColor" ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 20V19C7 17.8954 7.89543 17 9 17H15C16.1046 17 17 17.8954 17 19V20" />
    <path d="M12 7V3C12 2.44772 12.4477 2 13 2C13.5523 2 14 2.44772 14 3" />
    <path d="M12 7L4.12508 13.9156C3.41112 14.5403 3.41112 15.6472 4.12508 16.2719L4.12508 16.2719C4.83905 16.8966 5.99616 16.8966 6.71012 16.2719L12 11.6432L17.2899 16.2719C18.0038 16.8966 19.161 16.8966 19.8749 16.2719L19.8749 16.2719C20.5889 15.6472 20.5889 14.5403 19.8749 13.9156L12 7Z" />
  </svg>
);

interface SidebarProps {
  user: User | null;
  tier?: UserTier;
  onLogout: () => void;
  onUpgrade: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Sidebar = ({
  user,
  tier,
  onLogout,
  onUpgrade,
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  darkMode,
  toggleDarkMode,
}: SidebarProps) => {
  // Desktop sidebar: hover to expand
  const [isExpanded, setIsExpanded] = useState(false);
  // Tablet sidebar: click Sparkles icon to toggle
  const [isTabletExpanded, setIsTabletExpanded] = useState(false);
  // Mobile bottom nav: click Sparkles to toggle
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const menuItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "lab", icon: GeminiIcon, label: "AI Lab" },
    { id: "wardrobe", icon: HangerIcon, label: "Wardrobe" },
    { id: "styler", icon: LayoutGrid, label: "Styler" },
    { id: "upcycle", icon: Video, label: "Upcycle" },
    { id: "market", icon: ShoppingBag, label: "Market" },
    { id: "community", icon: Users, label: "Feed" },
    { id: "profile", icon: UserIcon, label: "Profile" },
  ];

  const bottomActions = [
    ...(user
      ? [
        {
          id: "upgrade",
          onClick: onUpgrade,
          icon:
            tier === "premium" ? (
              <Star size={20} fill="currentColor" className="text-yellow-400 flex-shrink-0" />
            ) : (
              <Zap size={20} className="text-[var(--sidebar-icon)] flex-shrink-0 group-hover:text-[#024A34]" />
            ),
          label: tier === "premium" ? "Premium" : "Free",
          className:
            tier === "premium"
              ? "text-yellow-400 font-bold hover:text-yellow-300"
              : "text-white/60 hover:text-[#024A34] hover:bg-yellow-400",
        },
      ]
      : []),
    {
      id: "darkmode",
      onClick: toggleDarkMode,
      icon: darkMode ? (
        <Sun size={20} fill="none" className="text-[var(--sidebar-icon)] flex-shrink-0 group-hover:text-[#024A34]" />
      ) : (
        <Moon size={20} fill="none" className="text-[var(--sidebar-icon)] flex-shrink-0 group-hover:text-[#024A34]" />
      ),
      label: darkMode ? "Light" : "Dark",
      className: "text-white/60 hover:text-[#024A34] hover:bg-[#FFACC1]",
    },
    {
      id: "cart",
      onClick: onOpenCart,
      icon: (
        <div className="relative flex-shrink-0">
          <ShoppingCart size={20} fill="none" className="text-[var(--sidebar-icon)] group-hover:text-[#024A34]" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 w-4 h-4 bg-orange text-primary text-[9px] font-bold rounded-full flex items-center justify-center border border-[var(--sidebar-bg)]">
              {cartCount}
            </span>
          )}
        </div>
      ),
      label: `Cart (${cartCount})`,
      className: "text-white/60 hover:text-[#024A34] hover:bg-[#FFACC1]",
    },
    ...(user
      ? [
        {
          id: "logout",
          onClick: onLogout,
          icon: <LogOut size={20} fill="none" className="text-[var(--sidebar-icon)] group-hover:translate-x-0.5 group-hover:text-[#024A34] transition-transform flex-shrink-0" />,
          label: "Logout",
          className: "text-white/60 hover:text-[#024A34] hover:bg-[#FFACC1]",
        },
      ]
      : []),
  ];

  return (
    <>
      {/* ── Desktop (lg+): hover to expand ── */}
      <motion.aside
        initial={false}
        animate={{ width: isExpanded ? 220 : 64 }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onClick={() => setIsExpanded(true)}
        style={{ top: 16, bottom: 16, left: 16 }}
        className="hidden lg:flex fixed z-[100] bg-[var(--sidebar-bg)] backdrop-blur-xl border-2 border-pink/20 shadow-2xl flex-col transition-colors duration-300 overflow-hidden rounded-[2rem] dark:border-primary/20 dark:bg-dark"
      >
        {/* Header */}
        <div className={cn(
          "flex-shrink-0 px-3 pt-4 pb-3 flex",
          isExpanded ? "items-center gap-2.5" : "items-center justify-center"
        )}>
          <div className="w-8 h-8 flex items-center justify-center">
            <Sparkles className="text-pink dark:text-primary" size={18} fill="currentColor" />
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-body italic text-lg text-pink dark:text-primary whitespace-nowrap"
              >
                Menu
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="border-b border-white/10 mx-3" />

        {/* MENU */}
        <div className="flex flex-col flex-1 min-h-0 py-2">
          <nav className="flex flex-col gap-0.5 px-2">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2 py-2 transition-all group relative rounded-[2rem]",

                    isActive
                      ? "text-pink bg-pink/10 dark:text-primary dark:bg-primary/10"
                      : "text-white/60 hover:text-[#024A34] hover:bg-[#FFACC1] dark:text-primary dark:hover:text-dark dark:hover:bg-primary"
                  )}
                >
                  {/* ICON */}
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <item.icon
                      size={18}
                      className={cn(
                        "transition-colors",
                        isActive
                          ? "text-pink dark:text-primary"
                          : "text-[var(--sidebar-icon)] group-hover:text-[#024A34] dark:text-primary dark:group-hover:text-dark"
                      )}
                    />
                  </div>

                  {/* LABEL */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="font-body text-sm whitespace-nowrap truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* ACTIVE INDICATOR */}
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator-desktop"
                      className="absolute left-0 w-0.5 h-5 bg-pink dark:bg-primary rounded-r-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* BOTTOM */}
          <div className="border-t border-white/10 mx-3 mt-2" />
          <div className="flex flex-col gap-0.5 px-2 pt-2">
            {bottomActions.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2 py-2 rounded-[2rem] transition-all group",
                  item.className
                )}
              >
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="font-body text-sm whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>
        </div>
      </motion.aside>

      {/* ── Tablet (md–lg): Sparkles icon toggles expand/collapse ── */}
      <motion.aside
        initial={false}
        animate={{ width: isTabletExpanded ? 220 : 64 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        style={{ top: 16, bottom: 16, left: 16 }}
        className="hidden md:flex lg:hidden fixed z-[100] bg-[var(--sidebar-bg)] backdrop-blur-xl border-2 border-primary/20 shadow-2xl flex-col transition-colors duration-300 overflow-hidden rounded-[2rem]"
      >
        {/* HEADER */}
        <div
          className={cn(
            "flex-shrink-0 px-3 pt-4 pb-3 flex",
            isTabletExpanded ? "items-center gap-2.5" : "items-center justify-center"
          )}
        >
          <button
            onClick={() => setIsTabletExpanded((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FFACC1] dark:hover:bg-primary group transition-all"
          >
            <Sparkles
              size={18}
              fill="currentColor"
              className="text-pink dark:text-primary group-hover:text-[#024A34] dark:group-hover:text-dark transition-all"
            />
          </button>

          <AnimatePresence>
            {isTabletExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-body italic text-lg text-pink dark:text-primary whitespace-nowrap"
              >
                Menu
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="border-b border-white/10 mx-3" />

        {/* MENU */}
        <div className="flex flex-col flex-1 min-h-0 py-2 overflow-y-auto">
          <nav className="flex flex-col gap-1 px-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2 py-2 rounded-[2rem] transition-all group relative",

                  activeTab === item.id
                    ? "bg-pink/10 text-pink font-bold dark:bg-primary/15 dark:text-primary"
                    : "text-white/60 hover:text-[#024A34] hover:bg-[#FFACC1] dark:text-primary dark:hover:bg-primary dark:hover:text-dark"
                )}
              >
                {/* ICON FIX (no overflow EVER) */}
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-all",
                      activeTab === item.id
                        ? "text-pink dark:text-primary"
                        : "text-[var(--sidebar-icon)] group-hover:text-[#024A34] dark:text-primary dark:group-hover:text-dark"
                    )}
                  />
                </div>

                <AnimatePresence>
                  {isTabletExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="font-body text-sm whitespace-nowrap truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {activeTab === item.id && (
                  <motion.div
                    layoutId="active-indicator-tablet"
                    className="absolute left-0 w-0.5 h-5 bg-pink dark:bg-primary rounded-r-full"
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="flex-1" />

          {/* BOTTOM ACTIONS */}
          <div className="border-t border-white/10 mx-3 mt-2" />
          <div className="flex flex-col gap-1 px-2 pt-2">
            {bottomActions.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2 py-2 rounded-[2rem] transition-all group",

                  "text-white/60 hover:text-[#024A34] hover:bg-[#FFACC1]",
                  "dark:text-primary dark:hover:bg-primary dark:hover:text-dark"
                )}
              >
                {/* ICON FIX FOR CUSTOM ICONS */}
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                  <div className="w-5 h-5 flex items-center justify-center [&>*]:w-5 [&>*]:h-5">
                    {item.icon}
                  </div>
                </div>

                <AnimatePresence>
                  {isTabletExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="font-body text-sm whitespace-nowrap truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>
        </div>
      </motion.aside>

      {/* ── Mobile (< md): bottom nav bar ── */}
      <nav className="fixed left-3 right-3 bottom-3 z-50 md:hidden">
        <div className="rounded-[2rem] border-2 border-primary/20 bg-[var(--sidebar-bg)] backdrop-blur-xl shadow-2xl overflow-hidden">

          <div className="flex items-center gap-2 px-3 py-2.5">

            {/* Toggle */}
            <button
              onClick={() => setIsMobileExpanded((v) => !v)}
              className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/5 hover:bg-[#FFACC1] dark:hover:bg-primary group transition-all"
            >
              <Sparkles
                size={20}
                fill="currentColor"
                className="text-pink dark:text-primary group-hover:text-[#024A34] dark:group-hover:text-dark"
              />
            </button>

            <AnimatePresence initial={false}>
              {isMobileExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex-1 overflow-x-auto whitespace-nowrap"
                >
                  <div className="flex items-center gap-2 min-w-max">

                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "flex items-center justify-center w-11 h-11 rounded-2xl transition-all group",

                          activeTab === item.id
                            ? "bg-pink/15 dark:bg-primary/15"
                            : "hover:bg-[#FFACC1] dark:hover:bg-primary"
                        )}
                      >
                        <item.icon
                          size={20}
                          className={cn(
                            "transition-colors",
                            activeTab === item.id
                              ? "text-pink dark:text-primary"
                              : "text-[var(--sidebar-icon)] group-hover:text-[#024A34] dark:text-primary dark:group-hover:text-dark"
                          )}
                        />
                      </button>
                    ))}

                    {/* Divider */}
                    <div className="w-px h-8 bg-white/15 mx-1" />

                    {/* Bottom Actions */}
                    {bottomActions.map((item) => (
                      <button
                        key={item.id}
                        onClick={item.onClick}
                        className="flex items-center justify-center w-11 h-11 rounded-2xl transition-all group hover:bg-[#FFACC1] dark:hover:bg-primary"
                      >
                        <div className="dark:text-primary group-hover:text-[#024A34] dark:group-hover:text-dark">
                          {item.icon}
                        </div>
                      </button>
                    ))}

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </nav>
    </>
  );
};
