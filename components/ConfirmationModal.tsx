import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { LoaderIcon, XIcon, AlertTriangleIcon } from './Icons';

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  confirmButtonClass?: string;
  isDestructive?: boolean;
  hideActions?: boolean;
  renderFooter?: React.ReactNode;
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

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmButtonClass = 'bg-gradient-to-r from-primary-start to-primary-end text-white',
  isDestructive = false,
  hideActions = false,
  renderFooter
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm();
    // The parent component is responsible for closing the modal on success
    // and for resetting the processing state if there's an error.
    setIsProcessing(false);
  };

  const handleClose = () => {
    if (isProcessing) return;
    onClose();
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
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 hover:text-slate-800 dark:hover:text-white transition-colors"
              aria-label="Close"
            >
              <XIcon className="w-5 h-5" />
            </button>
            
            <div className="sm:flex sm:items-start">
              {isDestructive && (
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
                </div>
              )}
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                  <div className="mt-2">
                    <div className="text-sm text-slate-600 dark:text-slate-400">{message}</div>
                  </div>
              </div>
            </div>

            {renderFooter ? (
              <div>{renderFooter}</div>
            ) : !hideActions ? (
              <div className="mt-8 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className={`w-full inline-flex justify-center rounded-full border border-transparent shadow-sm px-6 py-2 text-base font-medium focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 ${isProcessing ? 'cursor-not-allowed' : ''} ${confirmButtonClass}`}
                >
                  {isProcessing ? (
                    <>
                      <LoaderIcon className="w-5 h-5 mr-2" />
                      Processing...
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
                <button
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="mt-3 w-full inline-flex justify-center rounded-full border border-slate-300 dark:border-navy-600 bg-slate-100 dark:bg-navy-700/50 px-6 py-2 text-base font-medium text-slate-800 dark:text-white shadow-sm hover:bg-slate-200 dark:hover:bg-navy-700 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;