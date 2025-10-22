import React, { useState, useCallback, useEffect } from 'react';
// FIX: Add `Transition` to framer-motion import to fix type error.
import { AnimatePresence, motion, Transition } from 'framer-motion';

import { Page, Domain } from './types';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import MyDomainsPage from './pages/MyDomainsPage';
import ManageDomainPage from './pages/ManageDomainPage';
import ExplorerPage from './pages/ExplorerPage';

import { useTheme } from './hooks/useTheme';
import { useWallet } from './hooks/useWallet';
import { useDomainManager } from './hooks/useDomainManager';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

// FIX: Explicitly type `pageTransition` with `Transition` to resolve type incompatibility.
const pageTransition: Transition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
};

function App() {
  const { theme, toggleTheme } = useTheme();
  const wallet = useWallet();
  const domainManager = useDomainManager(wallet.address);

  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [manageDomainTab, setManageDomainTab] = useState<'overview' | 'dns' | 'transfer' | 'danger'>('overview');

  const navigateTo = useCallback((page: Page, domain?: Domain, options?: { tab?: 'overview' | 'dns' | 'transfer' | 'danger' }) => {
    if (page === 'manage-domain' && domain) {
      setSelectedDomain(domain);
      setManageDomainTab(options?.tab || 'overview');
    } else {
      setSelectedDomain(null);
    }
    setCurrentPage(page);
  }, []);

  useEffect(() => {
    // This effect ensures that the selectedDomain state is always in sync with the source of truth from the domainManager.
    if (currentPage === 'manage-domain' && selectedDomain) {
      const freshDomain = domainManager.domains[selectedDomain.name];
      
      // If the domain doesn't exist anymore or has been transferred to another wallet, navigate away.
      if (!freshDomain || freshDomain.owner !== wallet.address) {
        navigateTo('my-domains');
      } else if (JSON.stringify(freshDomain) !== JSON.stringify(selectedDomain)) {
        // If the domain data has been updated (e.g., DNS change), update the selectedDomain state
        // to pass fresh props to the ManageDomainPage.
        setSelectedDomain(freshDomain);
      }
    }
  }, [domainManager.domains, currentPage, wallet.address, navigateTo, selectedDomain]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage domainManager={domainManager} navigateTo={navigateTo} wallet={wallet} />;
      case 'my-domains':
        return <MyDomainsPage domainManager={domainManager} navigateTo={navigateTo} />;
      case 'manage-domain':
        return selectedDomain ? <ManageDomainPage domain={selectedDomain} domainManager={domainManager} navigateTo={navigateTo} initialTab={manageDomainTab} /> : <HomePage domainManager={domainManager} navigateTo={navigateTo} wallet={wallet} />;
      case 'explorer':
        return <ExplorerPage domainManager={domainManager} />;
      default:
        return <HomePage domainManager={domainManager} navigateTo={navigateTo} wallet={wallet} />;
    }
  };

  return (
    <div className={`${theme} font-sans`}>
      <div className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 min-h-screen transition-colors duration-300">
        
        
        <Header 
          theme={theme}
          toggleTheme={toggleTheme}
          wallet={wallet}
          navigateTo={navigateTo}
          currentPage={currentPage}
        />
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
           <AnimatePresence mode="wait">
            <motion.div
              key={currentPage + (selectedDomain?.name || '')}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;