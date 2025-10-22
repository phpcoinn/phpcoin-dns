import React, { useState } from 'react';
// FIX: Add `Variants` to framer-motion import to fix type error.
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Page } from '../types';
import { useWallet } from '../hooks/useWallet';
import { LogoIcon, MoonIcon, SunIcon, WalletIcon, LogOutIcon, MenuIcon, XIcon } from './Icons';

type HeaderProps = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  wallet: ReturnType<typeof useWallet>;
  navigateTo: (page: Page) => void;
  currentPage: Page;
  onLoginRequest: () => void;
};

const NavLink: React.FC<{
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
}> = ({ onClick, isActive, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'text-white bg-white/10'
        : 'text-slate-300 hover:text-white hover:bg-white/5'
    }`}
  >
    {children}
  </button>
);

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, wallet, navigateTo, currentPage, onLoginRequest }) => {
  const { isConnected, address, balance, disconnectWallet } = wallet;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMobileNav = (page: Page) => {
    navigateTo(page);
    setIsMenuOpen(false);
  };

  // FIX: Explicitly type `menuVariants` with `Variants` to resolve type incompatibility.
  const menuVariants: Variants = {
    hidden: { opacity: 0, x: '100%' },
    visible: { opacity: 1, x: 0, transition: { type: 'tween', ease: 'circOut' } },
    exit: { opacity: 0, x: '100%', transition: { type: 'tween', ease: 'circIn' } }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-navy-800/80 backdrop-blur-lg border-b border-navy-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <button onClick={() => navigateTo('home')} className="flex items-center space-x-2 text-white">
                <LogoIcon className="h-8 w-8 text-primary-end" />
                <span className="font-bold text-lg hidden sm:inline">PHP Coin Domains</span>
              </button>
              <nav className="hidden md:flex items-center space-x-4">
                <NavLink onClick={() => navigateTo('home')} isActive={currentPage === 'home'}>Search</NavLink>
                <NavLink onClick={() => navigateTo('my-domains')} isActive={currentPage === 'my-domains'}>My Domains</NavLink>
                <NavLink onClick={() => navigateTo('explorer')} isActive={currentPage === 'explorer'}>Explorer</NavLink>
                <NavLink onClick={() => navigateTo('how-it-works')} isActive={currentPage === 'how-it-works'}>How It Works</NavLink>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>

              <div className="hidden md:flex items-center">
                {isConnected && address ? (
                  <div className="flex items-center space-x-2">
                    <div className="bg-navy-700/50 rounded-full p-1 flex items-center space-x-2 text-sm">
                      <span className="text-white pl-3">{balance.toFixed(4)} PHP</span>
                      <div className="bg-navy-900 text-slate-300 rounded-full px-3 py-1 font-mono">
                        {`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
                      </div>
                    </div>
                    <button
                      onClick={disconnectWallet}
                      className="p-2 rounded-full text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      aria-label="Disconnect wallet"
                    >
                      <LogOutIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onLoginRequest}
                    className="flex items-center space-x-2 bg-gradient-to-r from-primary-start to-primary-end text-white px-4 py-2 rounded-full text-sm font-semibold hover:shadow-glow-primary transition-shadow"
                  >
                    <WalletIcon className="w-4 h-4" />
                    <span>Login</span>
                  </button>
                )}
              </div>
              
              <div className="md:hidden">
                 <button
                  onClick={() => setIsMenuOpen(true)}
                  className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Open menu"
                >
                  <MenuIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 z-[100] bg-navy-900 p-4 flex flex-col md:hidden"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => handleMobileNav('home')} className="flex items-center space-x-2 text-white">
                <LogoIcon className="h-8 w-8 text-primary-end" />
                <span className="font-bold text-lg">PHP Coin Domains</span>
              </button>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10"
                aria-label="Close menu"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col items-center justify-center flex-grow space-y-8">
              <button onClick={() => handleMobileNav('home')} className={`text-2xl font-bold transition-colors ${currentPage === 'home' ? 'text-primary-end' : 'text-slate-200 hover:text-primary-end/80'}`}>Search</button>
              <button onClick={() => handleMobileNav('my-domains')} className={`text-2xl font-bold transition-colors ${currentPage === 'my-domains' ? 'text-primary-end' : 'text-slate-200 hover:text-primary-end/80'}`}>My Domains</button>
              <button onClick={() => handleMobileNav('explorer')} className={`text-2xl font-bold transition-colors ${currentPage === 'explorer' ? 'text-primary-end' : 'text-slate-200 hover:text-primary-end/80'}`}>Explorer</button>
              <button onClick={() => handleMobileNav('how-it-works')} className={`text-2xl font-bold transition-colors ${currentPage === 'how-it-works' ? 'text-primary-end' : 'text-slate-200 hover:text-primary-end/80'}`}>How It Works</button>
            </nav>
            <div className="py-4">
              {isConnected && address ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-navy-800 rounded-full p-1 flex items-center space-x-2 text-sm w-full max-w-xs">
                    <span className="text-white pl-3 flex-1">{balance.toFixed(4)} PHP</span>
                    <div className="bg-navy-900 text-slate-300 rounded-full px-3 py-1 font-mono">
                      {`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      disconnectWallet();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center justify-center space-x-2 w-full max-w-xs p-2 rounded-full text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                    aria-label="Disconnect wallet"
                  >
                    <LogOutIcon className="w-5 h-5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLoginRequest();
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-start to-primary-end text-white px-4 py-3 rounded-full text-base font-semibold hover:shadow-glow-primary transition-shadow"
                >
                  <WalletIcon className="w-5 h-5" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;