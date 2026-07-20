import React, { useState } from 'react';
import { ShoppingBag, Menu, X, User, Search, Sparkles, MapPin, Instagram, Send, MessageSquare, MessageCircle, Phone, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CMSTexts } from '../types';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onAdminClick: () => void;
  onHomeClick: () => void;
  onCategorySelect: (category: string | null) => void;
  activeCategory: string | null;
  currentView: 'shop' | 'admin';
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onHandmadesClick?: () => void;
  onAboutClick?: () => void;
  onContactClick?: () => void;
  userView?: string;
  cms?: CMSTexts;
  currentUser?: any;
  onAccountClick?: () => void;
  onLogout?: () => void;
}

export default function Header({
  cartCount,
  onCartClick,
  onAdminClick,
  onHomeClick,
  onCategorySelect,
  activeCategory,
  currentView,
  searchTerm,
  setSearchTerm,
  onHandmadesClick,
  onAboutClick,
  onContactClick,
  userView,
  cms,
  currentUser,
  onAccountClick,
  onLogout,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleCategoryClick = (catId: string) => {
    onCategorySelect(catId === 'all' ? null : catId);
    onHomeClick(); // Switch to shop view
    setIsMobileMenuOpen(false);
  };

  const defaultMenus = [
    { id: 'm-1', name: 'صفحه اصلی', link: '/', order: 1, isActive: true },
    { id: 'm-2', name: 'فروشگاه زیورآلات', link: '/shop', order: 2, isActive: true },
    { id: 'm-3', name: 'سفارش اختصاصی', link: '/custom', order: 3, isActive: true },
    { id: 'm-4', name: 'درباره ما', link: '/about', order: 4, isActive: true },
    { id: 'm-5', name: 'قوانین و مقررات', link: '/terms', order: 5, isActive: true },
  ];

  const activeMenus = (cms?.header?.menus && cms.header.menus.length > 0
    ? cms.header.menus
    : defaultMenus)
    .filter(m => m.isActive)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleMenuClick = (menu: { name: string; link: string }) => {
    setIsMobileMenuOpen(false);
    if (menu.link === '/' || menu.link === '/home') {
      onHomeClick();
      onCategorySelect(null);
    } else if (menu.link === '/shop') {
      onHomeClick();
    } else if (menu.link === '/custom' || menu.link === '/handmades') {
      if (onHandmadesClick) onHandmadesClick();
    } else if (menu.link === '/about') {
      if (onAboutClick) onAboutClick();
    } else if (menu.link === '/terms' || menu.link === '/contact') {
      if (onContactClick) onContactClick();
    } else {
      onHomeClick();
    }
  };

  const isMenuSelected = (link: string) => {
    if (link === '/' || link === '/home') return userView === 'home';
    if (link === '/shop') return userView === 'catalog';
    if (link === '/custom' || link === '/handmades') return userView === 'handmades';
    if (link === '/about') return userView === 'about';
    if (link === '/terms' || link === '/contact') return userView === 'contact' || userView === 'terms';
    return false;
  };

  const topText = cms?.header?.topText || '✨ ارسال رایگان برای خریدهای بالای ۵۰۰ هزار تومان + هدیه ویژه گالری آونتورین ✨';
  const logoUrl = cms?.general?.logoUrl || cms?.header?.logoUrl || '/src/assets/images/aventurin_logo_1784399850455.jpg';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-850 bg-slate-950 shadow-md transition-all duration-300">
      {/* Top Banner Alert */}
      <div className="bg-gradient-to-r from-gold-700 via-gold-500 to-gold-800 text-stone-50 text-xs py-1.5 px-4 text-center font-medium tracking-wide">
        {topText}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Right section: Logo and Brand Name */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-full p-2 text-slate-300 hover:bg-slate-800 hover:text-gold-400 focus:outline-none lg:hidden"
              aria-label="منو"
              id="btn-mobile-menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div 
              onClick={() => {
                onHomeClick();
                onCategorySelect(null);
              }}
              className="flex cursor-pointer items-center gap-2 group"
            >
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-gold-600 to-gold-400 p-0.5 shadow-md shadow-gold-500/20 transition-transform duration-300 group-hover:rotate-12 overflow-hidden">
                <img 
                  src={logoUrl} 
                  alt="Aventurin" 
                  className="h-full w-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="font-serif text-lg font-bold tracking-tight text-slate-100 sm:text-2xl">
                  {cms?.general?.title ? (
                    <span>{cms.general.title.split('|')[0].trim()}</span>
                  ) : (
                    <>گالری <span className="text-gold-400 font-extrabold">آونتورین</span></>
                  )}
                </h1>
                <p className="text-[10px] text-slate-400 tracking-wider font-light -mt-1 hidden sm:block">
                  {cms?.general?.description ? cms.general.description.slice(0, 40) + '...' : 'AVENTURIN ACCESSORIES'}
                </p>
              </div>
            </div>
          </div>

          {/* Center section: Main Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {activeMenus.map((menu) => {
              const selected = isMenuSelected(menu.link);
              return (
                <button
                  key={menu.id}
                  onClick={() => handleMenuClick(menu)}
                  className={`relative rounded-xl px-4.5 py-2 text-sm font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                    selected
                      ? 'text-gold-400 bg-slate-800 border border-slate-700/80 shadow-md shadow-black/20'
                      : 'text-slate-200 hover:text-gold-400 hover:bg-slate-800/40'
                  }`}
                >
                  {menu.link.includes('custom') && <Sparkles size={14} className="text-gold-400 animate-pulse" />}
                  <span>{menu.name}</span>
                  {selected && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-gold-400"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Left section: Actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Search toggler */}
            <div className="relative">
              <div className={`flex items-center overflow-hidden rounded-full border bg-slate-950 transition-all duration-300 ${
                isSearchOpen ? 'w-48 sm:w-64 px-3 border-gold-500/50 shadow-lg shadow-gold-500/5' : 'w-10 h-10 border-transparent bg-transparent'
              }`}>
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="flex h-10 w-10 items-center justify-center text-slate-300 hover:text-gold-400 transition-colors shrink-0"
                  id="btn-search-toggle"
                >
                  <Search size={20} />
                </button>
                {isSearchOpen && (
                  <div className="flex items-center w-full mr-1.5">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="جستجو در زیورآلات..."
                      className="w-full bg-transparent py-1 text-xs sm:text-sm text-slate-100 outline-none placeholder:text-slate-500"
                      dir="rtl"
                      autoFocus
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1 mr-1 shrink-0 cursor-pointer"
                        title="پاک کردن جستجو"
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* User Account / Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={onAccountClick}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black transition-all duration-300 cursor-pointer ${
                    userView === 'account' && currentView === 'shop'
                      ? 'bg-gold-500 text-slate-950 shadow-md shadow-gold-500/15'
                      : 'bg-slate-900 border border-slate-800 text-gold-400 hover:text-gold-300 hover:bg-slate-850'
                  }`}
                  title="مشاهده حساب کاربری"
                  id="btn-user-account"
                >
                  <User size={16} />
                  <span className="hidden sm:inline">سلام، {currentUser.name || 'کاربر'}</span>
                </button>
                
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer"
                    title="خروج از حساب کاربری"
                    id="btn-header-logout"
                  >
                    <LogOut size={15} />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onAccountClick}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-900 border border-slate-800 hover:border-gold-500/45 hover:text-gold-400 hover:bg-slate-850 transition-all duration-300 cursor-pointer"
                title="ورود یا ثبت‌نام"
                id="btn-user-login"
              >
                <User size={16} className="text-slate-400" />
                <span className="hidden sm:inline">ورود / عضویت</span>
              </button>
            )}

            {/* Admin Panel Link - strictly shown ONLY if admin */}
            {currentUser && currentUser.role === 'admin' && (
              <button
                onClick={onAdminClick}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black transition-all duration-300 cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-950 border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 shadow-[0_0_12px_rgba(234,179,8,0.1)]'
                }`}
                title="ورود به پنل مدیریت فروشگاه"
                id="btn-admin-toggle"
              >
                <Sparkles size={14} className={currentView === 'admin' ? '' : 'animate-pulse text-gold-400'} />
                <span>{currentView === 'admin' ? 'خروج از مدیریت' : 'پنل مدیریت'}</span>
              </button>
            )}

            {/* Cart Trigger */}
            <button
              onClick={onCartClick}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 shadow-lg hover:bg-gold-500/20 hover:scale-105 active:scale-95 transition-all duration-300"
              id="btn-shopping-cart"
            >
              <ShoppingBag size={20} className="stroke-[2.5]" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden"
            />

            {/* Drawer container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 top-0 z-50 w-72 bg-slate-950 p-6 shadow-2xl border-l border-slate-850 lg:hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <img 
                      src={logoUrl} 
                      alt="Aventurin Gallery" 
                      className="h-8 w-8 rounded-full object-cover border border-gold-500/30"
                      referrerPolicy="no-referrer"
                    />
                    <span className="font-bold text-slate-100 font-serif text-sm">منوی گالری</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    id="btn-close-mobile-menu"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex flex-col gap-2.5">
                  {activeMenus.map((menu) => {
                    const selected = isMenuSelected(menu.link);
                    return (
                      <button
                        key={menu.id}
                        onClick={() => handleMenuClick(menu)}
                        className={`w-full rounded-xl px-4 py-3.5 text-right text-sm font-bold transition-all duration-200 flex items-center justify-between cursor-pointer ${
                          selected
                            ? 'bg-gold-500 text-slate-950 font-black'
                            : 'text-slate-200 bg-slate-900 hover:bg-slate-805 hover:text-gold-400'
                        }`}
                      >
                        <span>{menu.name}</span>
                        {menu.link.includes('custom') && <Sparkles size={16} className={selected ? 'text-slate-950' : 'text-gold-400 animate-pulse'} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Info Box at bottom of drawer */}
              <div className="border-t border-slate-800 pt-6 text-xs text-slate-400 flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-gold-400 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{cms?.footer?.contactInfo?.address || 'مرکزی، محلات، میدان مصطفی خمینی، گالری اونتورین'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>{cms?.footer?.contactInfo?.workingHours || 'همه روزه از ساعت ۱۰ صبح الی ۹ شب'}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
