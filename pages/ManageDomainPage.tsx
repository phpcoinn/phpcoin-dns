import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Domain, Page } from '../types';
import { useDomainManager } from '../hooks/useDomainManager';
import { useWallet } from '../hooks/useWallet';
import ConfirmationModal from '../components/ConfirmationModal';
import { LoaderIcon, CheckCircleIcon, ExternalLinkIcon } from '../components/Icons';
import { config } from '../config';
import phpcoinCrypto from 'phpcoin-crypto';
import {TEST_NEW_OWNER_ADDRESS} from '../constants';

type ManageDomainPageProps = {
  domain: Domain;
  domainManager: ReturnType<typeof useDomainManager>;
  navigateTo: (page: Page, domain?: Domain, options?: { tab?: 'overview' | 'dns' | 'transfer' | 'danger' }) => void;
  initialTab?: 'overview' | 'dns' | 'transfer' | 'danger';
};

type DnsType = 'none' | 'ip' | 'ipfs' | 'redirect';
type ModalStatus = 'idle' | 'confirming' | 'processing' | 'success' | 'error';


const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
      active
        ? 'border-primary-end text-primary-end'
        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600'
    }`}
  >
    {children}
  </button>
);

const InputField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string, error?: string, disabled?: boolean }> = ({ label, value, onChange, placeholder, error, disabled }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full p-3 bg-slate-100 dark:bg-navy-900 rounded-lg border ${error ? 'border-red-500' : 'border-slate-300 dark:border-navy-700'} focus:ring-2 focus:ring-primary-end focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
);

const RadioOption: React.FC<{
  id: DnsType;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  description: string;
  disabled?: boolean;
}> = ({ id, name, checked, onChange, label, description, disabled }) => (
  <label htmlFor={id} className={`flex p-4 bg-slate-50 dark:bg-navy-900/50 rounded-lg border border-slate-200 dark:border-navy-700 has-[:checked]:border-primary-end has-[:checked]:ring-2 has-[:checked]:ring-primary-end/50 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
    <input
      id={id}
      name={name}
      type="radio"
      value={id}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="h-4 w-4 mt-1 text-primary-end bg-slate-200 dark:bg-navy-800 border-slate-400 dark:border-navy-600 focus:ring-primary-end disabled:cursor-not-allowed"
    />
    <div className="ml-3 text-sm">
      <span className="font-medium text-slate-900 dark:text-white">{label}</span>
      <p className="text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  </label>
);


const ManageDomainPage: React.FC<ManageDomainPageProps> = ({ domain, domainManager, navigateTo, initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'dns' | 'transfer' | 'danger'>(initialTab);
  const isApiOffline = domainManager.apiStatus === 'offline';
  const wallet = useWallet();
  
  // DNS State
  const [selectedDnsType, setSelectedDnsType] = useState<DnsType>('none');
  const [dns, setDns] = useState(domain.dns || { ip: '', ipfs: '', redirect: '' });
  const [dnsUpdateStatus, setDnsUpdateStatus] = useState<ModalStatus>('idle');
  const [dnsUpdateError, setDnsUpdateError] = useState<string | null>(null);
  const [isDnsUpdateModalOpen, setIsDnsUpdateModalOpen] = useState(false);
  const [dnsUpdateTxId, setDnsUpdateTxId] = useState<string | null>(null);

  // Transfer State
  const [transferAddress, setTransferAddress] = useState('');
  const [transferError, setTransferError] = useState('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferApiError, setTransferApiError] = useState<string | null>(null);
  const [transferStatus, setTransferStatus] = useState<ModalStatus>('idle');
  const [transferTxId, setTransferTxId] = useState<string | null>(null);


  // Unregister State
  const [isUnregisterModalOpen, setIsUnregisterModalOpen] = useState(false);
  const [unregisterStatus, setUnregisterStatus] = useState<ModalStatus>('idle');
  const [unregisterApiError, setUnregisterApiError] = useState<string | null>(null);
  const [unregisterTxId, setUnregisterTxId] = useState<string | null>(null);
  
  // Effect to sync local state with props to avoid stale data
  useEffect(() => {
    const currentDns = domain.dns || {};
    setTransferAddress(TEST_NEW_OWNER_ADDRESS);
    setDns({
        ip: currentDns.ip || '',
        ipfs: currentDns.ipfs || '',
        redirect: currentDns.redirect || '',
    });

    if (currentDns.ip) {
        setSelectedDnsType('ip');
    } else if (currentDns.ipfs) {
        setSelectedDnsType('ipfs');
    } else if (currentDns.redirect) {
        setSelectedDnsType('redirect');
    } else {
        setSelectedDnsType('none');
    }
  }, [domain.dns]);

  const handleInitiateDnsUpdate = () => {
    setDnsUpdateError(null);
    setDnsUpdateStatus('confirming');
    setIsDnsUpdateModalOpen(true);
  };

  const handleConfirmDnsUpdate = async () => {
    setDnsUpdateStatus('processing');
    setDnsUpdateError(null);

    const finalDns: Partial<Domain['dns']> = {};
    switch(selectedDnsType) {
        case 'ip': finalDns.ip = dns.ip; break;
        case 'ipfs': finalDns.ipfs = dns.ipfs; break;
        case 'redirect': finalDns.redirect = dns.redirect; break;
    }

    const result = await domainManager.updateDomain(domain.name, finalDns, wallet.getPrivateKey);
    if (result.success && result.data?.transactionId) {
        setDnsUpdateStatus('success');
        setDnsUpdateTxId(result.data.transactionId);
    } else {
        setDnsUpdateStatus('confirming');
        setDnsUpdateError(result.error || 'An unexpected error occurred.');
    }
  };
  
  const closeDnsUpdateModal = () => {
    setIsDnsUpdateModalOpen(false);
    setTimeout(() => {
        setDnsUpdateStatus('idle');
        setDnsUpdateError(null);
        setDnsUpdateTxId(null);
    }, 300);
  };
  
  const handleInitiateTransfer = () => {
    let isValidAddress;
    try {
      isValidAddress = phpcoinCrypto.verifyAddress(transferAddress);
    }catch(e) {
      isValidAddress = false;
    }

    if (!transferAddress || !isValidAddress) {
      setTransferError("Please enter a valid PHPCoin address (e.g., Pa...).");
      return;
    }
    setTransferError('');
    setTransferApiError(null);
    setTransferStatus('confirming');
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransfer = async () => {
    if (transferStatus === 'processing' || transferStatus === 'success') return;
    
    setTransferApiError(null);
    setTransferStatus('processing');
    const result = await domainManager.transferDomain(domain.name, transferAddress, wallet.getPrivateKey);
    
    if (result.success && result.data?.transactionId) {
      setTransferStatus('success');
      setTransferTxId(result.data.transactionId);
    } else {
      setTransferApiError(result.error || 'An unexpected error occurred.');
      setTransferStatus('confirming');
    }
  };
  
  const closeTransferModal = () => {
    const wasSuccess = transferStatus === 'success';
    setIsTransferModalOpen(false);
    setTimeout(() => {
      setTransferStatus('idle');
      setTransferApiError(null);
      setTransferTxId(null);
      if (wasSuccess) {
        navigateTo('my-domains');
      }
    }, 300);
  };

  const handleInitiateUnregister = () => {
    setUnregisterApiError(null);
    setUnregisterStatus('confirming');
    setIsUnregisterModalOpen(true);
  };

  const handleConfirmUnregister = async () => {
    if (unregisterStatus === 'processing' || unregisterStatus === 'success') return;

    setUnregisterApiError(null);
    setUnregisterStatus('processing');
    const result = await domainManager.unregisterDomain(domain.name, wallet.getPrivateKey);

    if (result.success && result.data?.transactionId) {
        setUnregisterStatus('success');
        setUnregisterTxId(result.data.transactionId);
    } else {
        setUnregisterApiError(result.error || 'An unexpected error occurred.');
        setUnregisterStatus('confirming');
    }
  };

  const closeUnregisterModal = () => {
    const wasSuccess = unregisterStatus === 'success';
    setIsUnregisterModalOpen(false);
    setTimeout(() => {
      setUnregisterStatus('idle');
      setUnregisterApiError(null);
      setUnregisterTxId(null);
      if (wasSuccess) {
        navigateTo('my-domains');
      }
    }, 300);
  };

  const purchasePrice = parseFloat(domain.price || '0');
  const refundAmount = (purchasePrice * 0.5).toFixed(2);

  const dnsInputVariants: Variants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { opacity: 1, y: 0, height: 'auto', transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, height: 0, transition: { duration: 0.2 } },
  };

  const renderSharedModalContent = (status: ModalStatus, type: 'transfer' | 'dns' | 'unregister') => {
      let title = '';
      let txId: string | null = null;

      if (type === 'transfer') { title = 'Domain Transfer'; txId = transferTxId; }
      if (type === 'dns') { title = 'DNS Update'; txId = dnsUpdateTxId; }
      if (type === 'unregister') { title = 'Domain Unregister'; txId = unregisterTxId; }
      
      switch(status) {
        case 'processing':
            return (
                <div className="text-center py-8">
                    <LoaderIcon className="w-12 h-12 mx-auto text-primary-end" />
                    <h3 className="text-xl font-bold mt-4">Processing Transaction</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">Submitting your request to the blockchain...</p>
                </div>
            );
        case 'success':
            return (
                <div className="text-center">
                    <CheckCircleIcon className="w-16 h-16 mx-auto text-green-400" />
                    <h3 className="text-2xl font-bold mt-4">Transaction Submitted</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        Your {title} has been initiated. The action will be completed once the transaction is mined on the blockchain.
                    </p>
                    {txId && (
                        <div className="mt-4 text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Transaction ID:</span>
                            <a
                                href={`${config.explorerUrl}${txId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center space-x-2 font-mono text-primary-end hover:underline"
                            >
                                <span className="break-all">
                                    {`${txId.substring(0, 10)}...${txId.substring(txId.length - 8)}`}
                                </span>
                                <ExternalLinkIcon className="w-4 h-4" />
                            </a>
                        </div>
                    )}
                </div>
            );
        default: return null;
      }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Manage Domain</h1>
      <div className="flex items-center space-x-3">
        <p className="text-xl text-primary-end font-mono">{domain.name}</p>
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

      <div className="mt-8 border-b border-slate-200 dark:border-navy-700">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
        <TabButton active={activeTab === 'dns'} onClick={() => setActiveTab('dns')}>DNS / Redirect</TabButton>
        <TabButton active={activeTab === 'transfer'} onClick={() => setActiveTab('transfer')}>Transfer</TabButton>
        <TabButton active={activeTab === 'danger'} onClick={() => setActiveTab('danger')}>Danger Zone</TabButton>
      </div>

      <div className="mt-6 p-8 bg-white dark:bg-navy-800/50 rounded-2xl border border-slate-200 dark:border-navy-700">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Owner</span>
                <span className="font-mono text-sm text-slate-800 dark:text-white break-all">{domain.owner}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Created Date</span>
                <span className="text-slate-800 dark:text-white">{domain.created}</span>
            </div>
            {domain.transactionId && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Registration TX</span>
                <a
                  href={`${config.explorerUrl}${domain.transactionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 font-mono text-sm text-primary-end hover:underline"
                >
                  <span className="break-all">
                    {`${domain.transactionId.substring(0, 10)}...${domain.transactionId.substring(domain.transactionId.length - 8)}`}
                  </span>
                  <ExternalLinkIcon className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}
        {activeTab === 'dns' && (
          <div className="space-y-6">
             <p className="text-slate-600 dark:text-slate-400">
                Choose one of the following options to point your domain. Only one record can be active at a time.
            </p>
            <div className="space-y-4">
                <RadioOption id="none" name="dns-type" checked={selectedDnsType === 'none'} onChange={(e) => setSelectedDnsType(e.target.value as DnsType)} label="None (Disabled)" description="No DNS record will be active." disabled={isApiOffline} />
                <RadioOption id="ip" name="dns-type" checked={selectedDnsType === 'ip'} onChange={(e) => setSelectedDnsType(e.target.value as DnsType)} label="IP Address (A Record)" description="Point to a server's IPv4 address." disabled={isApiOffline} />
                <RadioOption id="ipfs" name="dns-type" checked={selectedDnsType === 'ipfs'} onChange={(e) => setSelectedDnsType(e.target.value as DnsType)} label="IPFS Content ID (CID)" description="Point to content on the InterPlanetary File System." disabled={isApiOffline} />
                <RadioOption id="redirect" name="dns-type" checked={selectedDnsType === 'redirect'} onChange={(e) => setSelectedDnsType(e.target.value as DnsType)} label="Redirect URL" description="Forward visitors to another website." disabled={isApiOffline} />
            </div>

            <div className="overflow-hidden">
                <AnimatePresence mode="wait">
                    {selectedDnsType === 'ip' && (
                        <motion.div key="ip" variants={dnsInputVariants} initial="hidden" animate="visible" exit="exit">
                            <InputField label="IP Address (A Record)" value={dns.ip || ''} onChange={(e) => setDns({...dns, ip: e.target.value})} placeholder="e.g., 192.168.1.1" disabled={isApiOffline} />
                        </motion.div>
                    )}
                    {selectedDnsType === 'ipfs' && (
                        <motion.div key="ipfs" variants={dnsInputVariants} initial="hidden" animate="visible" exit="exit">
                            <InputField label="IPFS Content ID (CID)" value={dns.ipfs || ''} onChange={(e) => setDns({...dns, ipfs: e.target.value})} placeholder="e.g., Qm..." disabled={isApiOffline} />
                        </motion.div>
                    )}
                    {selectedDnsType === 'redirect' && (
                        <motion.div key="redirect" variants={dnsInputVariants} initial="hidden" animate="visible" exit="exit">
                             <InputField label="Redirect URL" value={dns.redirect || ''} onChange={(e) => setDns({...dns, redirect: e.target.value})} placeholder="e.g., https://my-other-site.com" disabled={isApiOffline} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="flex items-center space-x-4">
                <button 
                    onClick={handleInitiateDnsUpdate}
                    disabled={isApiOffline}
                    className="flex items-center justify-center bg-gradient-to-r from-primary-start to-primary-end text-white px-6 py-2 rounded-full font-semibold hover:shadow-glow-primary transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Save Changes
                </button>
            </div>
          </div>
        )}
        {activeTab === 'transfer' && (
          <div className="space-y-6 max-w-lg">
            <p className="text-slate-600 dark:text-slate-400">Transferring ownership is an irreversible action. The new owner will have full control over this domain. Please double-check the recipient's address before proceeding.</p>
            <InputField 
                label="New Owner Address" 
                value={transferAddress} 
                onChange={(e) => {
                    setTransferAddress(e.target.value);
                    if (transferError) setTransferError('');
                }}
                placeholder="0x..." 
                error={transferError}
                disabled={isApiOffline}
            />
            <button onClick={handleInitiateTransfer} disabled={isApiOffline} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Transfer Ownership
            </button>
          </div>
        )}
        {activeTab === 'danger' && (
          <div className="space-y-6 max-w-lg border border-red-500/30 bg-red-500/10 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-400">Unregister Domain</h3>
            <p className="text-slate-600 dark:text-slate-400">Unregistering your domain will permanently delete it from the blockchain. This action is irreversible, and you will lose ownership and all associated data.</p>
            <div className="text-sm p-3 bg-slate-100 dark:bg-navy-900/50 rounded-lg border border-slate-200 dark:border-navy-700">
                <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Original Purchase Price:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{purchasePrice.toFixed(2)} PHP</span>
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-slate-500 dark:text-slate-400">Note: You will receive a 50% refund:</span>
                    <span className="font-mono text-green-400">{refundAmount} PHP</span>
                </div>
            </div>
            <button onClick={handleInitiateUnregister} disabled={isApiOffline} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Unregister {domain.name}
            </button>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isTransferModalOpen}
        onClose={closeTransferModal}
        onConfirm={handleConfirmTransfer}
        title={ transferStatus === 'success' || transferStatus === 'processing' ? '' : 'Confirm Domain Transfer' }
        message={
            transferStatus === 'processing' || transferStatus === 'success'
            ? renderSharedModalContent(transferStatus, 'transfer')
            : <div className="space-y-3">
                <p>You are about to transfer ownership of <strong className="font-mono text-slate-900 dark:text-white">{domain.name}</strong>.</p>
                <p>This action is irreversible. Please confirm the recipient's address:</p>
                <p className="font-mono text-sm text-slate-800 dark:text-white bg-slate-100 dark:bg-navy-900 p-3 rounded-lg break-all">{transferAddress}</p>
                {transferApiError && (
                    <div className="!mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                        {transferApiError}
                    </div>
                )}
              </div>
        }
        confirmText="Confirm Transfer"
        isDestructive={true}
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        hideActions={transferStatus !== 'confirming'}
        renderFooter={transferStatus === 'success' ? 
            <button onClick={closeTransferModal} className="mt-6 w-full bg-slate-200 dark:bg-navy-700 text-slate-800 dark:text-white px-6 py-3 rounded-full font-semibold hover:bg-slate-300 dark:hover:bg-navy-600 transition-colors">Close</button>
            : undefined}
      />

      <ConfirmationModal
        isOpen={isDnsUpdateModalOpen}
        onClose={closeDnsUpdateModal}
        onConfirm={handleConfirmDnsUpdate}
        title={ dnsUpdateStatus === 'success' || dnsUpdateStatus === 'processing' ? '' : 'Confirm DNS Update' }
        message={
            dnsUpdateStatus === 'processing' || dnsUpdateStatus === 'success'
            ? renderSharedModalContent(dnsUpdateStatus, 'dns')
            : <div className="space-y-3">
                <p>You are about to update the DNS records for <strong className="font-mono text-slate-900 dark:text-white">{domain.name}</strong>. This is a blockchain transaction that requires your signature.</p>
                 {dnsUpdateError && (
                    <div className="!mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                        {dnsUpdateError}
                    </div>
                )}
              </div>
        }
        confirmText="Confirm Update"
        hideActions={dnsUpdateStatus !== 'confirming'}
        renderFooter={dnsUpdateStatus === 'success' ? 
            <button onClick={closeDnsUpdateModal} className="mt-6 w-full bg-slate-200 dark:bg-navy-700 text-slate-800 dark:text-white px-6 py-3 rounded-full font-semibold hover:bg-slate-300 dark:hover:bg-navy-600 transition-colors">Close</button>
            : undefined}
      />

      <ConfirmationModal
        isOpen={isUnregisterModalOpen}
        onClose={closeUnregisterModal}
        onConfirm={handleConfirmUnregister}
        title={ unregisterStatus === 'success' || unregisterStatus === 'processing' ? '' : 'Unregister Domain' }
        message={
          unregisterStatus === 'processing' || unregisterStatus === 'success'
          ? renderSharedModalContent(unregisterStatus, 'unregister')
          : <div className="space-y-3">
                <p>Are you sure you want to unregister <strong className="font-mono text-slate-900 dark:text-white">{domain.name}</strong>? This action is irreversible.</p>
                <div className="!mt-4 p-3 bg-slate-100 dark:bg-navy-900 rounded-lg border border-slate-200 dark:border-navy-700">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Purchase Price:</span>
                        <span className="font-mono text-slate-900 dark:text-white">{purchasePrice.toFixed(2)} PHP</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                        <span className="text-slate-500 dark:text-slate-400">You will be refunded:</span>
                        <span className="font-mono font-bold text-green-400">{refundAmount} PHP</span>
                    </div>
                </div>
                 {unregisterApiError && (
                    <div className="!mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                        {unregisterApiError}
                    </div>
                )}
            </div>
        }
        confirmText="Unregister & Claim Refund"
        isDestructive={true}
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        hideActions={unregisterStatus !== 'confirming'}
        renderFooter={unregisterStatus === 'success' ? 
            <button onClick={closeUnregisterModal} className="mt-6 w-full bg-slate-200 dark:bg-navy-700 text-slate-800 dark:text-white px-6 py-3 rounded-full font-semibold hover:bg-slate-300 dark:hover:bg-navy-600 transition-colors">Close</button>
            : undefined}
      />
    </div>
  );
};

export default ManageDomainPage;