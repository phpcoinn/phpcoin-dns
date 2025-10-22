import React from 'react';
import { Domain, Page } from '../types';
import { useDomainManager } from '../hooks/useDomainManager';
import { ChevronRightIcon } from '../components/Icons';

type MyDomainsPageProps = {
  domainManager: ReturnType<typeof useDomainManager>;
  navigateTo: (page: Page, domain?: Domain, options?: { tab?: 'overview' | 'dns' | 'transfer' | 'danger' }) => void;
};

const MyDomainsPage: React.FC<MyDomainsPageProps> = ({ domainManager, navigateTo }) => {
  const ownedDomains = domainManager.getOwnedDomains();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Domains</h1>
      {ownedDomains.length > 0 ? (
        <div className="bg-white dark:bg-navy-800/50 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-navy-700">
                    <thead className="bg-slate-50 dark:bg-navy-900/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Domain</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Registered On</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Linked Site</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Registration Price</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-navy-700">
                        {ownedDomains.map(domain => (
                            <tr key={domain.name} className="hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{domain.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{domain.created || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 truncate max-w-xs">{domain.linkedSite || 'Not Set'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{domain.price ? `${domain.price} PHP` : 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                        onClick={() => navigateTo('manage-domain', domain)} 
                                        className="inline-flex items-center space-x-2 px-4 py-2 text-sm rounded-full font-semibold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
                                    >
                                        <span>Manage</span>
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-navy-800/50 rounded-2xl border border-slate-200 dark:border-navy-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">No Domains Found</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">You don't own any domains yet. Start by searching for one.</p>
          <button onClick={() => navigateTo('home')} className="mt-6 flex items-center mx-auto space-x-2 bg-gradient-to-r from-primary-start to-primary-end text-white px-6 py-2 rounded-full font-semibold hover:shadow-glow-primary transition-shadow">
            <span>Search for a Domain</span>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MyDomainsPage;