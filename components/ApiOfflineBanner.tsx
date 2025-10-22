import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangleIcon } from './Icons';

type ApiOfflineBannerProps = {
  isOffline: boolean;
};

const ApiOfflineBanner: React.FC<ApiOfflineBannerProps> = ({ isOffline }) => {
  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/95 backdrop-blur-sm text-yellow-900 text-sm font-semibold shadow-lg"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center space-x-2">
            <AlertTriangleIcon className="w-4 h-4" />
            <span>Service Temporarily Unavailable. Some features may be limited.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ApiOfflineBanner;
