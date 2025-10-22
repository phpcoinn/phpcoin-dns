import { useState, useCallback, useEffect } from 'react';
import phpcoinCrypto from 'phpcoin-crypto';
import { Domain, DomainStatus, GlobalStats } from '../types';
import { MOCK_DOMAINS } from '../constants';
import { getGlobalStatsAPI, searchDomainAPI, getTrendingDomainsAPI, prepareRegisterDomainAPI, finalizeRegisterDomainAPI, unregisterDomainAPI, prepareUpdateDomainAPI, finalizeUpdateDomainAPI, prepareTransferDomainAPI, finalizeTransferDomainAPI, getAccountInfoAPI } from '../utils/api';
import { config } from '../config';

const LOCAL_STORAGE_KEY = 'phpcoin_domains';
const NETWORK_ERROR_MESSAGE = 'Network error. Could not connect to the server.';

// Utility to create a full Domain object from the mock data
const createFullDomain = (name: string): Domain => {
    const normalizedName = name.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(MOCK_DOMAINS, normalizedName)) {
        const mock = MOCK_DOMAINS[normalizedName];
        return { name: normalizedName, ...mock };
    }
    return {
        name: normalizedName,
        status: DomainStatus.Available,
        owner: null,
        created: null
    };
};

export const useDomainManager = (walletAddress: string | null) => {
    const [domains, setDomains] = useState<{[key: string]: Domain}>(() => {
        try {
            const savedDomains = window.localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedDomains) {
                // FIX: Cast result of JSON.parse to ensure the `domains` state is correctly typed. This resolves type inference errors in `getOwnedDomains`.
                return JSON.parse(savedDomains) as {[key: string]: Domain};
            }
        } catch (error) {
            console.error("Could not parse domains from localStorage", error);
        }

        const initialDomains: {[key: string]: Domain} = {};
        Object.keys(MOCK_DOMAINS).forEach(name => {
            initialDomains[name] = createFullDomain(name);
        });
        return initialDomains;
    });
    
    const [stats, setStats] = useState<GlobalStats>({ totalDomains: 0, totalFunds: 0 });
    const [trendingDomains, setTrendingDomains] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');


    useEffect(() => {
        try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(domains));
        } catch (error) {
            console.error("Could not save domains to localStorage", error);
        }
    }, [domains]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            setApiStatus('checking');

            const statsResponse = await getGlobalStatsAPI();

            if (statsResponse.success && statsResponse.data) {
                setStats(statsResponse.data);
                setApiStatus('online');

                const trendingResponse = await getTrendingDomainsAPI();
                if (trendingResponse.success && trendingResponse.data) {
                    setTrendingDomains(trendingResponse.data);
                } else {
                    console.error("Failed to fetch trending domains:", trendingResponse.error);
                    setTrendingDomains([]);
                }

            } else {
                console.error("Failed to fetch global stats:", statsResponse.error);
                if (statsResponse.error === NETWORK_ERROR_MESSAGE) {
                    setApiStatus('offline');
                }
                
                // Fallback to local mock data calculation on API failure
                // FIX: Explicitly type `allDomains` as `Domain[]` to resolve type inference issues with `Object.values`, which was causing `d.status` and `domain.name` to be inaccessible.
                const allDomains: Domain[] = Object.values(domains);
                const registeredDomains = allDomains.filter(d => d.status === DomainStatus.Taken);
                setStats({
                    totalDomains: registeredDomains.length,
                    totalFunds: registeredDomains.reduce((sum, domain) => sum + parseFloat(domain.price || '0'), 0)
                });
                 setTrendingDomains([]);
            }
            
            setIsLoading(false);
        };
        fetchInitialData();
    }, []);

    const searchDomain = useCallback(async (name: string): Promise<Domain> => {
        if (apiStatus === 'offline') {
             return { name, status: DomainStatus.Taken, owner: null, created: null, price: 'N/A' };
        }

        const normalizedName = name.toLowerCase();
        const response = await searchDomainAPI(normalizedName);

        if (response.success && response.data) {
            return response.data;
        } else {
            console.error("Failed to search domain:", response.error);
            // Fallback to "Available" status on API error, consistent with original mock behavior.
            return {
                name: normalizedName,
                status: DomainStatus.Available,
                owner: null,
                created: null,
            };
        }
    }, [apiStatus]);

    // FIX: Moved setOwnedDomains and getOwnedDomains before their usage to fix block-scoped variable error.
    const getOwnedDomains = useCallback((): Domain[] => {
        if (!walletAddress) return [];
        // FIX: Cast the result of Object.values to Domain[] to fix an issue where the type of `d` was being inferred as `unknown`.
        return (Object.values(domains) as Domain[]).filter(d => d.owner === walletAddress);
    }, [domains, walletAddress]);

    const setOwnedDomains = useCallback((ownedDomains: Domain[]) => {
        setDomains(prev => {
            const updatedDomains = { ...prev };
            ownedDomains.forEach(domain => {
                updatedDomains[domain.name.toLowerCase()] = domain;
            });
            return updatedDomains;
        });
    }, []);

    const registerDomain = useCallback(async (name: string, getPrivateKey: () => string | null): Promise<{ success: boolean; error?: string; data?: { transactionId: string } }> => {
        if (apiStatus === 'offline') {
            return { success: false, error: "The registration service is temporarily unavailable. Please try again later." };
        }

        const privateKey = getPrivateKey();
        if (!privateKey) {
            return { success: false, error: "Private key not found. Please log in again." };
        }

        if (!walletAddress) {
            return { success: false, error: "Please connect your wallet to register a domain." };
        }
        
        try {
            // Step 1: Prepare registration to get data for signing.
            const prepareResponse = await prepareRegisterDomainAPI(name, walletAddress);
            if (!prepareResponse.success || !prepareResponse.data) {
                return { success: false, error: prepareResponse.error || "Failed to prepare domain registration." };
            }

            // Step 2: Sign the data and finalize.
            const publicKey = phpcoinCrypto.getPublicKey(privateKey);
            const dataToSign = JSON.stringify(prepareResponse.data);
            const finalSignature = phpcoinCrypto.sign(dataToSign, privateKey);

            const finalizeResponse = await finalizeRegisterDomainAPI({
                dataToSign,
                finalSignature,
                publicKey
            });

            if (finalizeResponse.success && finalizeResponse.data) {
                 // The domain will appear in the user's list after the background refresh completes
                 // and the user navigates to the 'my-domains' page.
                if (walletAddress) {
                    getAccountInfoAPI(walletAddress).then(accountInfo => {
                        if (accountInfo.success && accountInfo.data) {
                            setOwnedDomains(accountInfo.data.domains);
                        }
                    });
                }
                return { success: true, data: { transactionId: finalizeResponse.data.transactionId } };
            } else {
                 return { success: false, error: finalizeResponse.error || "Failed to finalize domain registration." };
            }

        } catch (e) {
            console.error("Error during registration process:", e);
            return { success: false, error: "A client-side error occurred during registration." };
        }
    }, [apiStatus, walletAddress, setOwnedDomains]);

    const unregisterDomain = useCallback(async (name: string, getPrivateKey: () => string | null): Promise<{ success: boolean; error?: string; data?: { transactionId: string } }> => {
        if (apiStatus === 'offline') {
            return { success: false, error: "The service is temporarily unavailable. Please try again later." };
        }

        const privateKey = getPrivateKey();
        if (!privateKey) {
            return { success: false, error: "Private key not found. Please log in again." };
        }
        
        try {
            const publicKey = phpcoinCrypto.getPublicKey(privateKey);
            // The data to sign should be consistent and prevent replay attacks.
            // Including the domain name and a constant chain ID is a good practice.
            const dataToSign = config.chainId + name.toLowerCase();
            const signature = phpcoinCrypto.sign(dataToSign, privateKey);

            const response = await unregisterDomainAPI(name.toLowerCase(), signature, publicKey);

            if (response.success && response.data) {
                // Like with transfer, remove optimistic UI update to prevent premature redirect.
                // The domain will be removed from the list after the background refresh completes
                // and the user navigates away.
                if (walletAddress) {
                    getAccountInfoAPI(walletAddress).then(accountInfo => {
                        if (accountInfo.success && accountInfo.data) {
                            setOwnedDomains(accountInfo.data.domains);
                        }
                    });
                }
                return { success: true, data: response.data };
            } else {
                return { success: false, error: response.error || "Failed to unregister domain." };
            }
        } catch (e) {
            console.error("Error during unregister process:", e);
            return { success: false, error: "A client-side error occurred during unregistration." };
        }
    }, [apiStatus, walletAddress, setOwnedDomains]);
    
    const updateDomain = useCallback(async (name: string, data: Partial<Domain['dns']>, getPrivateKey: () => string | null): Promise<{success: boolean, error?: string, data?: { transactionId: string }}> => {
        if (apiStatus === 'offline') {
            return { success: false, error: "The service is temporarily unavailable. Please try again later." };
        }
        
        const privateKey = getPrivateKey();
        if (!privateKey) {
            return { success: false, error: "Private key not found. Please log in again." };
        }

        try {
            // Step 1: Prepare update to get data for signing.
            const prepareResponse = await prepareUpdateDomainAPI(name, data);
            if (!prepareResponse.success || !prepareResponse.data) {
                return { success: false, error: prepareResponse.error || "Failed to prepare domain update." };
            }

            // Step 2: Sign the data and finalize.
            const publicKey = phpcoinCrypto.getPublicKey(privateKey);
            const dataToSign = JSON.stringify(prepareResponse.data);
            const finalSignature = phpcoinCrypto.sign(dataToSign, privateKey);

            const finalizeResponse = await finalizeUpdateDomainAPI({
                dataToSign,
                finalSignature,
                publicKey
            });

            if (finalizeResponse.success && finalizeResponse.data) {
                 // The domain data will be refreshed by the effect in App.tsx, ensuring the UI
                 // reflects the state on the blockchain after the transaction is mined.
                return { success: true, data: { transactionId: finalizeResponse.data.transactionId } };
            } else {
                 return { success: false, error: finalizeResponse.error || "Failed to finalize domain update." };
            }

        } catch (e) {
            console.error("Error during update process:", e);
            return { success: false, error: "A client-side error occurred during the update." };
        }
    }, [apiStatus]);

    const transferDomain = useCallback(async (name: string, newOwner: string, getPrivateKey: () => string | null): Promise<{success: boolean, error?: string, data?: { transactionId: string }}> => {
        if (apiStatus === 'offline') {
            return { success: false, error: "The service is temporarily unavailable. Please try again later." };
        }

        const privateKey = getPrivateKey();
        if (!privateKey) {
            return { success: false, error: "Private key not found. Please log in again." };
        }
        
        try {
            // Step 1: Prepare transfer (unauthenticated) to get data for signing.
            const prepareResponse = await prepareTransferDomainAPI(name, newOwner);

            if (!prepareResponse.success || !prepareResponse.data) {
                return { success: false, error: prepareResponse.error || "Failed to prepare domain transfer." };
            }
            
            // Step 2: Sign the data from the server and finalize
            const publicKey = phpcoinCrypto.getPublicKey(privateKey);
            const dataToSign = JSON.stringify(prepareResponse.data);
            const finalSignature = phpcoinCrypto.sign(dataToSign, privateKey);
            
            const finalizeResponse = await finalizeTransferDomainAPI({
                dataToSign,
                finalSignature,
                publicKey
            });
            
            if (finalizeResponse.success && finalizeResponse.data) {
                // The optimistic update that was here was removed.
                // It caused a premature redirect by changing the owner, which prevented the success modal from being seen.

                // Refresh the full domain list from the API in the background.
                // This will ensure that when the user navigates back to 'my-domains', the list is up-to-date.
                if (walletAddress) {
                    getAccountInfoAPI(walletAddress).then(accountInfo => {
                        if (accountInfo.success && accountInfo.data) {
                            setOwnedDomains(accountInfo.data.domains);
                        }
                    });
                }
                return { success: true, data: finalizeResponse.data };
            } else {
                return { success: false, error: finalizeResponse.error || "Failed to finalize domain transfer." };
            }
        } catch (e) {
            console.error("Error during transfer process:", e);
            return { success: false, error: "A client-side error occurred during the transfer." };
        }
    }, [apiStatus, walletAddress, setOwnedDomains]);


    return { domains, stats, trendingDomains, isLoading, apiStatus, searchDomain, registerDomain, getOwnedDomains, updateDomain, transferDomain, unregisterDomain, setOwnedDomains };
};