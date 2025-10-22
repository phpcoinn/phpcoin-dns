import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Domain, DomainStatus } from '../types';
import { searchDomainAPI } from '../utils/api';
import { LoaderIcon, XIcon, ExternalLinkIcon, XCircleIcon } from './Icons';
import { config } from '../config';

type DomainInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  domainName: string | null;
};

const backdropVariants: Variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};

const modalVariants: Variants = {
  hidden: { y: "-50%", x: "-50%", opacity: 0, scale: 0.95 },
  visible: { y: "-50%", x: "-50%", opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { y: "-50%", x: "-50%", opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } },
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-slate-200 dark:border-navy-700">
        <span className="text-slate-500 dark:text-slate-400 text-sm mb-1 sm:mb-0">{label}</span>
        <div className="text-left sm:text-right text-sm font-medium text-slate-800 dark:text-white">{children}</div>
    </div>
);

const renderStatusBadge = (status: DomainStatus) => {
    switch (status) {
        case DomainStatus.Taken:
            return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-300 rounded-full">Taken</span>;
        case DomainStatus.Reserved:
            return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300 rounded-full">Reserved</span>;
        case DomainStatus.Available:
             return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-300 rounded-full">Available</span>;
        default:
            return null;
    }
};

const DomainInfoModal: React.FC<DomainInfoModalProps> = ({ isOpen, onClose, domainName }) => {
  const [domain, setDomain] = useState<Domain | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && domainName) {
      const fetchDetails = async () => {
        setStatus('loading');
        setDomain(null);
        setError(null);

        const response = await searchDomainAPI(domainName);
        if (response.success && response.data) {
          setDomain(response.data);
          setStatus('success');
        } else {
          setError(response.error || 'Could not fetch domain details.');
          setStatus('error');
        }
      };
      fetchDetails();
    }
  }, [isOpen, domainName]);

  const handleClose = () => {
    onClose();
  };
  
  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="text-center py-8">
            <LoaderIcon className="w-12 h-12 mx-auto text-primary-end" />
            <h3 className="text-xl font-bold mt-4">Fetching Details...</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Retrieving on-chain data for {domainName}.</p>
        </div>
      );
    }

    if (status === 'error' || !domain) {
         return (
             <div className="text-center py-8">
                 <XCircleIcon className="w-12 h-12 mx-auto text-red-400" />
                 <h3 className="text-xl font-bold mt-4">Error</h3>
                 <p className="text-slate-600 dark:text-slate-400 mt-2">{error}</p>
                 <button onClick={handleClose} className="mt-6 bg-slate-200 dark:bg-navy-700 text-slate-800 dark:text-white px-6 py-2 rounded-full font-semibold hover:bg-slate-300 dark:hover:bg-navy-600 transition-colors">
                     Close
                 </button>
             </div>
         );
    }
    
    return (
        <>
            <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Domain Details</h3>
                <a
                  href={`https://${domain.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open ${domain.name} in a new tab`}
                  className="text-slate-400 hover:text-primary-end transition-colors"
                >
                    <ExternalLinkIcon className="w-5 h-5" />
                </a>
            </div>
            <p className="font-mono text-primary-end">{domain.name}</p>
            <div className="mt-6 space-y-2">
                <DetailRow label="Status">{renderStatusBadge(domain.status)}</DetailRow>
                {domain.owner && (
                     <DetailRow label="Owner">
                        <a href={`${config.explorerAddressUrl}${domain.owner}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 font-mono text-primary-end hover:underline">
                            <span className="break-all">{domain.owner}</span>
                            <ExternalLinkIcon className="w-4 h-4 flex-shrink-0" />
                        </a>
                    </DetailRow>
                )}
                {domain.created && <DetailRow label="Registration Date">{domain.created}</DetailRow>}
                {domain.price && <DetailRow label="Registration Price">{domain.price} PHP</DetailRow>}
                {domain.transactionId && (
                    <DetailRow label="Registration TX">
                        <a href={`${config.explorerUrl}${domain.transactionId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 font-mono text-primary-end hover:underline">
                            <span className="break-all">{`${domain.transactionId.substring(0, 10)}...${domain.transactionId.substring(domain.transactionId.length - 8)}`}</span>
                            <ExternalLinkIcon className="w-4 h-4 flex-shrink-0" />
                        </a>
                    </DetailRow>
                )}
            </div>
            <div className="mt-8 flex justify-end">
                <button onClick={handleClose} className="bg-slate-200 dark:bg-navy-700 text-slate-800 dark:text-white px-6 py-2 rounded-full font-semibold hover:bg-slate-300 dark:hover:bg-navy-600 transition-colors">
                    Close
                </button>
            </div>
        </>
    );
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleClose}
        >
          <motion.div
            className="fixed top-1/2 left-1/2 w-full max-w-lg p-8 bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-2xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 hover:text-slate-800 dark:hover:text-white transition-colors"
              aria-label="Close"
            >
              <XIcon className="w-5 h-5" />
            </button>
            {renderContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DomainInfoModal;