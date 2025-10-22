import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Domain } from '../types';
import { useDomainManager } from '../hooks/useDomainManager';
import { useWallet } from '../hooks/useWallet';
import { LoaderIcon, CheckCircleIcon, XIcon } from './Icons';

// Reusable InputField component for form consistency
const InputField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full p-3 bg-slate-100 dark:bg-navy-900 rounded-lg border border-slate-300 dark:border-navy-700 focus:ring-2 focus:ring-primary-end focus:outline-none transition-all"
        />
    </div>
);

type SaveStatus = 'idle' | 'saving' | 'success';

type DomainSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  domain: Domain;
  domainManager: ReturnType<typeof useDomainManager>;
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

const DomainSettingsModal: React.FC<DomainSettingsModalProps> = ({ isOpen, onClose, domain, domainManager }) => {
  const [dns, setDns] = useState(domain.dns || { ip: '', ipfs: '', redirect: '' });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const wallet = useWallet();

  // Reset form when modal opens with a new domain or when it's reopened
  useEffect(() => {
    if (isOpen) {
      setDns(domain.dns || { ip: '', ipfs: '', redirect: '' });
      setSaveStatus('idle');
    }
  }, [isOpen, domain]);

  const handleSave = async () => {
    setSaveStatus('saving');
    // FIX: Pass the `getPrivateKey` function as the third argument to satisfy the `updateDomain` function signature.
    await domainManager.updateDomain(domain.name, dns, wallet.getPrivateKey);
    setSaveStatus('success');
    setTimeout(() => {
      onClose();
    }, 2000); // Auto-close modal after 2 seconds on success
  };

  const handleClose = () => {
    if (saveStatus === 'saving') return; // Prevent closing while saving
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        // FIX: Changed div to motion.div to apply animation props.
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleClose}
        >
          {/* FIX: Changed div to motion.div to apply animation props. */}
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
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Domain Settings</h3>
            <p className="font-mono text-primary-end">{domain.name}</p>

            <div className="mt-6 space-y-6">
                <InputField label="IP Address (A Record)" value={dns.ip || ''} onChange={(e) => setDns({...dns, ip: e.target.value})} placeholder="e.g., 192.168.1.1" />
                <InputField label="IPFS Content ID (CID)" value={dns.ipfs || ''} onChange={(e) => setDns({...dns, ipfs: e.target.value})} placeholder="e.g., Qm..." />
                <InputField label="Redirect URL" value={dns.redirect || ''} onChange={(e) => setDns({...dns, redirect: e.target.value})} placeholder="e.g., https://my-other-site.com" />
            </div>

            <div className="mt-8 flex items-center justify-end space-x-4">
                <button
                    onClick={handleClose}
                    disabled={saveStatus === 'saving'}
                    className="px-6 py-2 rounded-full font-semibold border border-slate-300 dark:border-navy-600 bg-slate-100 dark:bg-navy-700/50 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-navy-700 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave} 
                    disabled={saveStatus !== 'idle'}
                    className="w-40 flex items-center justify-center bg-gradient-to-r from-primary-start to-primary-end text-white px-6 py-2 rounded-full font-semibold hover:shadow-glow-primary transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {saveStatus === 'saving' ? (
                    <>
                        <LoaderIcon className="w-5 h-5 mr-2" />
                        Saving...
                    </>
                ) : saveStatus === 'success' ? (
                     <>
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        Saved!
                    </>
                ) : 'Save Changes'}
                </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DomainSettingsModal;
