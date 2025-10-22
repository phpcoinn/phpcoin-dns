import React from 'react';
import { motion } from 'framer-motion';
import { DatabaseIcon, DollarSignIcon, ExternalLinkIcon, AlertTriangleIcon } from '../components/Icons';
import { useDomainManager } from '../hooks/useDomainManager';

type ExplorerPageProps = {
  domainManager: ReturnType<typeof useDomainManager>;
};

const ExplorerPage: React.FC<ExplorerPageProps> = ({ domainManager }) => {
  const { stats, trendingDomains, isLoading, apiStatus } = domainManager;
  const isApiOffline = apiStatus === 'offline';
    
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

  const renderTrendingDomains = () => {
    if (isLoading && apiStatus === 'checking') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="p-4 bg-slate-50 dark:bg-navy-900 rounded-lg border border-slate-200 dark:border-navy-700 animate-pulse">
              <div className="h-5 bg-slate-200 dark:bg-navy-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      );
    }
    
    if (isApiOffline) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-8 text-slate-500 dark:text-slate-400">
                <AlertTriangleIcon className="w-10 h-10 mb-2 text-yellow-500" />
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">Service Unavailable</h3>
                <p className="text-sm">Could not load trending domains. Please try again later.</p>
            </div>
        );
    }

    if (trendingDomains.length === 0) {
      return <p className="text-slate-500 dark:text-slate-400 text-center py-4">No trending domains at the moment.</p>;
    }
    
    return (
        <motion.ul 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
        >
          {trendingDomains.map((domain, index) => (
            <motion.li key={index} variants={item}>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-navy-900 rounded-lg border border-slate-200 dark:border-navy-700 hover:border-primary-end/50 transition-colors group">
                <span className="font-mono text-slate-600 dark:text-slate-300">{domain}</span>
                <a
                  href={`https://${domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${domain} in a new tab`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-primary-end/20 text-primary-end"
                >
                    <ExternalLinkIcon className="w-4 h-4" />
                </a>
              </div>
            </motion.li>
          ))}
        </motion.ul>
    );
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
            <p className={`text-2xl font-bold ${isApiOffline ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
              {isApiOffline ? 'Offline' : stats.totalDomains.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-navy-800/50 rounded-2xl border border-slate-200 dark:border-navy-700 p-6 flex items-center space-x-4">
          <div className="bg-primary-end/10 p-3 rounded-full">
            <DollarSignIcon className="w-6 h-6 text-primary-end" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Funds Collected</p>
            <p className={`text-2xl font-bold ${isApiOffline ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
              {isApiOffline ? 'Offline' : `${stats.totalFunds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP`}
            </p>
          </div>
        </div>
      </motion.div>
      
      <div className="bg-white dark:bg-navy-800/50 rounded-2xl border border-slate-200 dark:border-navy-700 p-8">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Trending Domains</h2>
        {renderTrendingDomains()}
      </div>
    </div>
  );
};

export default ExplorerPage;