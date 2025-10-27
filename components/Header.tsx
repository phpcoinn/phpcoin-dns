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
                    <div className="px-3 py-1 bg-navy-700 rounded-full text-sm font-mono flex items-center space-x-2">
                      <span className="text-slate-400">{balance.toFixed(4)} PHP</span>
                      <span className="text-white bg-navy-900/50 rounded-full px-2 py-0.5">{`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}</span>
                    </div>
                    <button onClick={disconnectWallet} className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors" aria-label="Disconnect wallet">
                        <LogOutIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={onLoginRequest} className="flex items-center space-x-2 bg-gradient-to-r from-primary-start to-primary-end text-white px-6 py-2 rounded-full font-semibold hover:shadow-glow-primary transition-shadow">
                    <WalletIcon className="w-5 h-5" />
                    <span>Connect Wallet</span>
                  </button>
                )}
              </div>
              <div className="md:hidden">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
                    {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 top-16 z-40 bg-navy-900 p-6 md:hidden"
          >
            <nav className="flex flex-col space-y-4">
              <NavLink onClick={() => handleMobileNav('home')} isActive={currentPage === 'home'}>Search</NavLink>
              <NavLink onClick={() => handleMobileNav('my-domains')} isActive={currentPage === 'my-domains'}>My Domains</NavLink>
              <NavLink onClick={() => handleMobileNav('explorer')} isActive={currentPage === 'explorer'}>Explorer</NavLink>
              <NavLink onClick={() => handleMobileNav('how-it-works')} isActive={currentPage === 'how-it-works'}>How It Works</NavLink>

              <div className="border-t border-navy-700 pt-4 mt-4">
                {isConnected && address ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-navy-800 rounded-lg">
                      <span className="font-medium text-white">Address</span>
                      <span className="font-mono text-sm text-slate-300">{`${address.substring(0, 8)}...${address.substring(address.length - 6)}`}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-navy-800 rounded-lg">
                      <span className="font-medium text-white">Balance</span>
                      <span className="font-mono text-sm text-slate-300">{balance.toFixed(4)} PHP</span>
                    </div>
                    <button onClick={() => { disconnectWallet(); setIsMenuOpen(false); }} className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg font-semibold bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors">
                      <LogOutIcon className="w-5 h-5" />
                      <span>Disconnect Wallet</span>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { onLoginRequest(); setIsMenuOpen(false); }} className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg font-semibold bg-gradient-to-r from-primary-start to-primary-end text-white hover:shadow-glow-primary transition-shadow">
                    <WalletIcon className="w-5 h-5" />
                    <span>Connect Wallet</span>
                  </button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;