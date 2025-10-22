import { useState } from 'react';
import { MOCK_WALLET_ADDRESS } from '../constants';

export const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);

  const connectWallet = () => {
    setIsConnected(true);
    setAddress(MOCK_WALLET_ADDRESS);
    // Simulate a random balance
    setBalance(Math.random() * 10 + 1); 
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setBalance(0);
  };

  return { isConnected, address, balance, connectWallet, disconnectWallet };
};
