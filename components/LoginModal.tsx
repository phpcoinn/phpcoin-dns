import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { LoaderIcon, XIcon, AlertTriangleIcon, EyeIcon, EyeOffIcon } from './Icons';
import { TEST_PRIVATE_KEY } from '../constants';

type LoginStatus = 'idle' | 'processing' | 'error';

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (privateKey: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
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

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, onSuccess }) => {
  const [privateKey, setPrivateKey] = useState('');
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  useEffect(() => {
    // Reset state when modal is closed
    if (!isOpen) {
      setTimeout(() => {
        setPrivateKey(TEST_PRIVATE_KEY);
        setStatus('idle');
        setError(null);
        setIsKeyVisible(false);
      }, 300); // Delay reset to allow for exit animation
    }
  }, [isOpen]);

  const handleLogin = async () => {
    setStatus('processing');
    setError(null);
    const result = await onLogin(privateKey);
    if (result.success) {
      onSuccess();
    } else {
      setStatus('error');
      setError(result.error || 'An unknown error occurred.');
    }
  };

  const handleClose = () => {
    if (status === 'processing') return;
    onClose();
  };

  const renderContent = () => {
    if (status === 'processing') {
      return (
        <div className="text-center py-8">
          <LoaderIcon className="w-12 h-12 mx-auto text-primary-end" />
          <h3 className="text-xl font-bold mt-4">Connecting...</h3>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Please wait while we securely access your account.</p>
        </div>
      );
    }

    return (
      <>
        <h3 className="text-2xl font-bold text-center">Login with Private Key</h3>
        
        <div className="mt-8 space-y-6">
            <div className="flex items-start space-x-3 bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded-lg border border-yellow-300 dark:border-yellow-700/60">
              <AlertTriangleIcon className="w-8 h-8 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Security Warning</h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Pasting your private key is risky. We recommend using a dedicated, low-value wallet for this app. Your key is stored in your browser's local storage and is not sent to our servers.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="private-key" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Your Private Key
              </label>
              <div className="relative">
                  <input
                      id="private-key"
                      type={isKeyVisible ? 'text' : 'password'}
                      value={privateKey}
                      onChange={(e) => {
                          setPrivateKey(e.target.value);
                          if (error) setError(null);
                          if (status === 'error') setStatus('idle');
                      }}
                      placeholder="Enter your 64-character private key"
                      className={`w-full p-3 pr-10 bg-slate-100 dark:bg-navy-900 rounded-lg border ${error ? 'border-red-500' : 'border-slate-300 dark:border-navy-700'} focus:ring-2 focus:ring-primary-end focus:outline-none transition-all`}
                  />
                  <button 
                      onClick={() => setIsKeyVisible(!isKeyVisible)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      aria-label={isKeyVisible ? "Hide private key" : "Show private key"}
                  >
                      {isKeyVisible ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
              </div>
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </div>
        </div>
        
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:space-x-4">
          <button onClick={handleClose} className="mt-3 sm:mt-0 w-full bg-slate-200 dark:bg-navy-700 text-slate-800 dark:text-white px-6 py-3 rounded-full font-semibold hover:bg-slate-300 dark:hover:bg-navy-600 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleLogin}
            disabled={!privateKey}
            className="w-full bg-gradient-to-r from-primary-start to-primary-end text-white px-6 py-3 rounded-full font-semibold hover:shadow-glow-primary transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Login
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
            className="fixed top-1/2 left-1/2 w-full max-w-md p-8 bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-2xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {status !== 'processing' && (
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

export default LoginModal;