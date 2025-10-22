import React, { useState } from 'react';
// FIX: Add `Variants` to framer-motion import to fix type error.
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { LoaderIcon, CheckCircleIcon, XCircleIcon, XIcon } from './Icons';

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  domainName: string;
  price: string;
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
};

const backdropVariants: Variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};

// FIX: Explicitly type `modalVariants` with `Variants` to resolve type incompatibility.
const modalVariants: Variants = {
  hidden: { y: "-50%", x: "-50%", opacity: 0, scale: 0.95 },
  visible: { y: "-50%", x: "-50%", opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { y: "-50%", x: "-50%", opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } },
};

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, domainName, price, onConfirm, onSuccess }) => {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setStatus('processing');
    setError(null);
    const result = await onConfirm();
    if (result.success) {
      setStatus('success');
    } else {
      setStatus('error');
      setError(result.error || 'An unknown error occurred.');
    }
  };

  const handleClose = () => {
    // Prevent closing while processing
    if (status === 'processing') return;
    setStatus('idle');
    setError(null);
    onClose();
  };

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="text-center">
            <LoaderIcon className="w-12 h-12 mx-auto text-primary-end" />
            <h3 className="text-xl font-bold mt-4">Processing Payment</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Please wait while we confirm your transaction on the blockchain...</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
            <CheckCircleIcon className="w-16 h-16 mx-auto text-green-400" />
            <h3 className="text-2xl font-bold mt-4">Payment Successful!</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Congratulations! <span className="font-bold text-slate-900 dark:text-white">{domainName}</span> is now yours.
            </p>
            <button
              onClick={onSuccess}
              className="mt-6 w-full bg-gradient-to-r from-primary-start to-primary-end text-white px-6 py-3 rounded-full font-semibold hover:shadow-glow-primary transition-shadow"
            >
              View My Domains
            </button>
          </div>
        );
      case 'error':
        return (
          <div className="text-center">
            <XCircleIcon className="w-16 h-16 mx-auto text-red-400" />
            <h3 className="text-2xl font-bold mt-4">Payment Failed</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2 bg-slate-100 dark:bg-navy-900 p-3 rounded-lg">{error}</p>
            <div className="mt-6 flex space-x-4">
               <button onClick={handleClose} className="w-full bg-slate-200 dark:bg-navy-700 text-slate-800 dark:text-white px-6 py-3 rounded-full font-semibold hover:bg-slate-300 dark:hover:bg-navy-600 transition-colors">
                 Cancel
               </button>
               <button onClick={handleConfirm} className="w-full bg-gradient-to-r from-primary-start to-primary-end text-white px-6 py-3 rounded-full font-semibold hover:shadow-glow-primary transition-shadow">
                 Try Again
               </button>
            </div>
          </div>
        );
      case 'idle':
      default:
        return (
          <>
            <h3 className="text-2xl font-bold text-center">Confirm Registration</h3>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center bg-slate-100 dark:bg-navy-900 p-4 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Domain:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{domainName}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-100 dark:bg-navy-900 p-4 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Price:</span>
                <span className="font-bold text-lg text-primary-end">{price} PHP</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">A transaction fee will also be applied by the network.</p>
            <div className="mt-8 flex space-x-4">
              <button onClick={handleClose} className="w-full bg-slate-200 dark:bg-navy-700 text-slate-800 dark:text-white px-6 py-3 rounded-full font-semibold hover:bg-slate-300 dark:hover:bg-navy-600 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="w-full bg-gradient-to-r from-primary-start to-primary-end text-white px-6 py-3 rounded-full font-semibold hover:shadow-glow-primary transition-shadow"
              >
                Pay Now
              </button>
            </div>
          </>
        );
    }
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
            className="fixed top-1/2 left-1/2 w-full max-w-md p-8 bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-2xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {status !== 'processing' && status !== 'success' && (
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 hover:text-slate-800 dark:hover:text-white transition-colors"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
            )}
            {renderContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;