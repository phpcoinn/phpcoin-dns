import React from 'react';
import { motion } from 'framer-motion';
import { TRENDING_DOMAINS } from '../constants';
import { DatabaseIcon, DollarSignIcon, SearchIcon } from '../components/Icons';
import { useDomainManager } from '../hooks/useDomainManager';
import { calculatePrice } from '../utils';
import { Domain, DomainStatus } from '../types';

type ExplorerPageProps = {
  domainManager: ReturnType<typeof useDomainManager>;
};

const ExplorerPage: React.FC<ExplorerPageProps> = ({ domainManager }) => {
  // FIX: Explicitly type `allDomains` as `Domain[]` to prevent items from being inferred as `unknown`.
  const allDomains: Domain[] = Object.values(domainManager.domains);
  const registeredDomains = allDomains.filter(d => d.status === DomainStatus.Taken);
  const totalRegistered = registeredDomains.length;
  const totalFunds = registeredDomains.reduce((sum, domain) => sum + parseFloat(calculatePrice(domain.name)), 0);
    
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Domain Explorer</h1>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
      
      <div className="bg-white dark:bg-navy-800/50 rounded-2xl border border-slate-200 dark:border-navy-700 p-8">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Trending Domains</h2>
        <motion.ul 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
        >
          {TRENDING_DOMAINS.map((domain, index) => (
            <motion.li key={index} variants={item}>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-navy-900 rounded-lg border border-slate-200 dark:border-navy-700 hover:border-primary-end/50 transition-colors group">
                <span className="font-mono text-slate-600 dark:text-slate-300">{domain}</span>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-primary-end/20 text-primary-end">
                    <SearchIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </div>
  );
};

export default ExplorerPage;
