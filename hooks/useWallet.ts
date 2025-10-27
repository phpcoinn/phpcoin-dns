import { useState } from 'react';
import phpcoinCrypto from 'phpcoin-crypto';
import { authAPI } from '../utils/api';
import { config } from '../config';

const PRIVATE_KEY_STORAGE_KEY = 'phpcoin_wallet_private_key';
const ADDRESS_STORAGE_KEY = 'phpcoin_wallet_address';

export const useWallet = () => {
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!window.localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
  });
  const [address, setAddress] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ADDRESS_STORAGE_KEY);
  });
  const [balance, setBalance] = useState<number>(0);

  // The simulated balance fetching has been removed.
  // Balance will now be fetched from the new account info endpoint in App.tsx.

  const connectWallet = async (privateKey: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // The user will provide the implementation for generating these values.
      // For now, we will assume a mock implementation.


      let nonce, signature, publicKey;
      try {
        let chainId = config.chainId;
        publicKey = phpcoinCrypto.getPublicKey(privateKey);
        nonce = phpcoinCrypto.generateRandomString(10);
        signature = phpcoinCrypto.sign(chainId+nonce, privateKey);
      } catch (e) {
          return { success: false, error: "Error signing login" };
      }



      const response = await authAPI(nonce, signature, publicKey);

      if (response.success && response.data?.address) {
        const returnedAddress = response.data.address;
        
        window.localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKey);
        window.localStorage.setItem(ADDRESS_STORAGE_KEY, returnedAddress);
        
        setIsConnected(true);
        setAddress(returnedAddress);
        
        return { success: true };
      } else {
        return { success: false, error: response.error || "Authentication failed. Please check your key." };
      }
    } catch (e) {
      return { success: false, error: "Invalid private key. Please check it and try again." };
    }
  };

  const disconnectWallet = () => {
    window.localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
    window.localStorage.removeItem(ADDRESS_STORAGE_KEY);
    setIsConnected(false);
    setAddress(null);
    setBalance(0);
  };

  const getPrivateKey = () => {
    return window.localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
  };

  return { isConnected, address, balance, connectWallet, disconnectWallet, setBalance, getPrivateKey };
};