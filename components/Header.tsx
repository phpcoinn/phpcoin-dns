import React from 'react';
import { Page } from '../types';
import { useWallet } from '../hooks/useWallet';
import { LogoIcon, MoonIcon, SunIcon, WalletIcon, LogOutIcon } from './Icons';

type HeaderProps = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  wallet: ReturnType<typeof useWallet>;
  navigateTo: (page: Page) => void;
  currentPage: Page;
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

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, wallet, navigateTo, currentPage }) => {
  const { isConnected, address, balance, connectWallet, disconnectWallet } = wallet;

  return (
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
                onClick={connectWallet}
                className="flex items-center space-x-2 bg-gradient-to-r from-primary-start to-primary-end text-white px-4 py-2 rounded-full text-sm font-semibold hover:shadow-glow-primary transition-shadow"
              >
                <WalletIcon className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;