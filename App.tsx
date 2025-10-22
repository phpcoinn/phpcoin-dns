import React, { useState, useCallback, useEffect } from 'react';
// FIX: Add `Transition` and `Variants` to framer-motion import to fix type error.
import { AnimatePresence, motion, Transition, Variants } from 'framer-motion';

import { Page, Domain } from './types';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import MyDomainsPage from './pages/MyDomainsPage';
import ManageDomainPage from './pages/ManageDomainPage';
import ExplorerPage from './pages/ExplorerPage';
import HowItWorksPage from './pages/HowItWorksPage';
import LoginModal from './components/LoginModal';
import ApiOfflineBanner from './components/ApiOfflineBanner';

import { useTheme } from './hooks/useTheme';
import { useWallet } from './hooks/useWallet';
import { useDomainManager } from './hooks/useDomainManager';
import { getAccountInfoAPI } from './utils/api';

const pageVariants: Variants = {
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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const fetchAccountInfo = async () => {
      if (wallet.address) {
        const response = await getAccountInfoAPI(wallet.address);
        if (response.success && response.data) {
          console.log(response.data);
          wallet.setBalance(response.data.balance);
          domainManager.setOwnedDomains(response.data.domains);
        } else {
          console.error("Failed to fetch account info:", response.error);
          // On failure, we can reset to a known state
          wallet.setBalance(0);
        }
      }
    };
    fetchAccountInfo();
  }, [wallet.address, wallet.setBalance, domainManager.setOwnedDomains]);


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

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage domainManager={domainManager} navigateTo={navigateTo} onLoginRequest={() => setIsLoginModalOpen(true)} />;
      case 'my-domains':
        return <MyDomainsPage domainManager={domainManager} navigateTo={navigateTo} />;
      case 'manage-domain':
        return selectedDomain ? <ManageDomainPage domain={selectedDomain} domainManager={domainManager} navigateTo={navigateTo} initialTab={manageDomainTab} /> : <HomePage domainManager={domainManager} navigateTo={navigateTo} onLoginRequest={() => setIsLoginModalOpen(true)} />;
      case 'explorer':
        return <ExplorerPage domainManager={domainManager} />;
      case 'how-it-works':
        return <HowItWorksPage />;
      default:
        return <HomePage domainManager={domainManager} navigateTo={navigateTo} onLoginRequest={() => setIsLoginModalOpen(true)} />;
    }
  };

  return (
    <div className={`${theme} font-sans`}>
      <div className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 min-h-screen transition-colors duration-300">
        
        <ApiOfflineBanner isOffline={domainManager.apiStatus === 'offline'} />
        
        <Header 
          theme={theme}
          toggleTheme={toggleTheme}
          wallet={wallet}
          navigateTo={navigateTo}
          currentPage={currentPage}
          onLoginRequest={() => setIsLoginModalOpen(true)}
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

        <LoginModal 
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={wallet.connectWallet}
          onSuccess={handleLoginSuccess}
        />
      </div>
    </div>
  );
}

export default App;
