import React, { useState, FormEvent } from 'react';
// FIX: Add `Variants` to framer-motion import to fix type error.
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Domain, DomainStatus, Page } from '../types';
import { useDomainManager } from '../hooks/useDomainManager';
import { useWallet } from '../hooks/useWallet';
import { SearchIcon, LoaderIcon, CheckCircleIcon, XCircleIcon, AlertTriangleIcon, DatabaseIcon, DollarSignIcon } from '../components/Icons';
import PaymentModal from '../components/PaymentModal';
import { calculatePrice } from '../utils';

type HomePageProps = {
  domainManager: ReturnType<typeof useDomainManager>;
  // FIX: Update navigateTo prop signature to match its definition for consistency.
  navigateTo: (page: Page, domain?: Domain, options?: { tab?: 'overview' | 'dns' | 'transfer' | 'danger' }) => void;
  wallet: ReturnType<typeof useWallet>;
};

const SearchResult: React.FC<{
  result: Domain,
  onRegister: (name: string) => void,
  onViewDetails: (domain: Domain) => void,
  isConnected: boolean,
  onConnectWallet: () => void,
}> = ({ result, onRegister, onViewDetails, isConnected, onConnectWallet }) => {
  const { name, status } = result;

  // FIX: Explicitly type `resultVariants` with `Variants` to resolve type incompatibility.
  const resultVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  const renderContent = () => {
    switch (status) {
      case DomainStatus.Searching:
        return <div className="flex items-center justify-center space-x-2"><LoaderIcon className="w-6 h-6" /><span>Searching...</span></div>;
      case DomainStatus.Available:
        return (
          <div className="text-center sm:text-left sm:flex items-center justify-between">
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircleIcon className="w-6 h-6" />
              <p><span className="font-bold">{name}</span> is available!</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{calculatePrice(name)} PHP</span>
              {isConnected ? (
                <button onClick={() => onRegister(name)} className="bg-gradient-to-r from-primary-start to-primary-end text-white px-6 py-2 rounded-full font-semibold hover:shadow-glow-primary transition-shadow">
                  Register Now
                </button>
              ) : (
                <button onClick={onConnectWallet} className="bg-gradient-to-r from-primary-start to-primary-end text-white px-6 py-2 rounded-full font-semibold hover:shadow-glow-primary transition-shadow">
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        );
      case DomainStatus.Taken:
        return (
          <div className="text-center sm:text-left sm:flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <XCircleIcon className="w-6 h-6" />
              <p><span className="font-bold">{name}</span> is taken.</p>
            </div>
             <button onClick={() => onViewDetails(result)} className="mt-4 sm:mt-0 bg-slate-200 dark:bg-navy-700 text-slate-800 dark:text-white px-6 py-2 rounded-full font-semibold hover:bg-slate-300 dark:hover:bg-navy-600 transition-colors">
              View Details
            </button>
          </div>
        );
      case DomainStatus.Reserved:
        return (
          <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
            <AlertTriangleIcon className="w-6 h-6" />
            <p><span className="font-bold">{name}</span> is reserved and cannot be registered.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {status !== DomainStatus.Available && status !== DomainStatus.Taken && status !== DomainStatus.Reserved && status !== DomainStatus.Searching ? null : (
        <motion.div
          variants={resultVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="mt-8 bg-white dark:bg-navy-800/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 dark:border-white/10"
        >
          {renderContent()}
        {/* FIX: Corrected closing tag from `</motion.doc>` to `</motion.div>`. */}
        </motion.div>
      )}
    </AnimatePresence>
  );
};


const HomePage: React.FC<HomePageProps> = ({ domainManager, navigateTo, wallet }) => {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<Domain | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [domainToRegister, setDomainToRegister] = useState<string | null>(null);

  // FIX: Explicitly type `allDomains` as `Domain[]` to prevent items from being inferred as `unknown`.
  const allDomains: Domain[] = Object.values(domainManager.domains);
  const registeredDomains = allDomains.filter(d => d.status === DomainStatus.Taken);
  const totalRegistered = registeredDomains.length;
  const totalFunds = registeredDomains.reduce((sum, domain) => sum + parseFloat(calculatePrice(domain.name)), 0);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    let domainName = query.trim().toLowerCase();
    if (!domainName.endsWith('.dap.ad') && !domainName.endsWith('.phpcoin.net') && !domainName.endsWith('.phpcoin')) {
      domainName = `${domainName}.phpcoin`;
    }

    setSearchResult({ name: domainName, status: DomainStatus.Searching, owner: null, created: null });
    const result = await domainManager.searchDomain(domainName);
    setSearchResult(result);
  };
  
  const handleInitiateRegistration = (name: string) => {
    setDomainToRegister(name);
    setIsPaymentModalOpen(true);
  };
  
  const handleConfirmRegistration = async () => {
    if (!domainToRegister) {
      return { success: false, error: 'Domain name is missing.' };
    }
    return await domainManager.registerDomain(domainToRegister);
  };

  const handleRegistrationSuccess = () => {
    setIsPaymentModalOpen(false);
    setDomainToRegister(null);
    navigateTo('my-domains');
  };
  
  const handleViewDetails = (domain: Domain) => {
    navigateTo('manage-domain', domain);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center"
      >
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-start to-primary-end">
            On-Chain Domain Manager
          </span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400">
          Search, register, and manage your decentralized domains on the PHP Coin network. Simple, secure, and truly yours.
        </p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10 w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="bg-white dark:bg-navy-800/50 rounded-2xl border border-slate-200 dark:border-navy-700 p-6 flex items-center space-x-4">
          <div className="bg-primary-start/10 p-3 rounded-full">
            <DatabaseIcon className="w-6 h-6 text-primary-start" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Domains Registered</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalRegistered.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-navy-800/50 rounded-2xl border border-slate-200 dark:border-navy-700 p-6 flex items-center space-x-4">
          <div className="bg-primary-end/10 p-3 rounded-full">
            <DollarSignIcon className="w-6 h-6 text-primary-end" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Funds Collected</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalFunds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-2xl"
      >
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter domain name (e.g., 'my-awesome-site')"
            className="w-full pl-6 pr-32 py-4 text-lg bg-white dark:bg-navy-800/80 rounded-full border border-slate-300 dark:border-navy-700 focus:ring-2 focus:ring-primary-end focus:outline-none transition-all"
          />
          <button type="submit" className="absolute inset-y-0 right-2 my-2 flex items-center space-x-2 bg-gradient-to-r from-primary-start to-primary-end text-white px-6 rounded-full font-semibold hover:shadow-glow-primary transition-shadow">
            <SearchIcon className="w-5 h-5" />
            <span>Search</span>
          </button>
        </form>
      </motion.div>
      
      <div className="w-full max-w-2xl">
        {searchResult && <SearchResult result={searchResult} onRegister={handleInitiateRegistration} onViewDetails={handleViewDetails} isConnected={wallet.isConnected} onConnectWallet={wallet.connectWallet} />}
      </div>
      
      {domainToRegister && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          domainName={domainToRegister}
          price={calculatePrice(domainToRegister)}
          onConfirm={handleConfirmRegistration}
          onSuccess={handleRegistrationSuccess}
        />
      )}

    </div>
  );
};

export default HomePage;
