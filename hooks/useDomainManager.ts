import { useState, useCallback, useEffect } from 'react';
import { Domain, DomainStatus, GlobalStats } from '../types';
import { MOCK_DOMAINS } from '../constants';
import { getGlobalStatsAPI, searchDomainAPI, getTrendingDomainsAPI, registerDomainAPI, unregisterDomainAPI, updateDomainAPI, transferDomainAPI } from '../utils/api';

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

    const registerDomain = useCallback(async (name: string): Promise<{ success: boolean; error?: string }> => {
        if (apiStatus === 'offline') {
            return { success: false, error: "The registration service is temporarily unavailable. Please try again later." };
        }

        if (!walletAddress) {
            return { success: false, error: "Please connect your wallet to register a domain." };
        }
        
        const response = await registerDomainAPI(name, walletAddress);

        if (response.success && response.data) {
            const newTransactionId = response.data.transactionId;
            const normalizedName = name.toLowerCase();
            setDomains(prev => ({
                ...prev,
                [normalizedName]: {
                    name: normalizedName,
                    owner: walletAddress,
                    status: DomainStatus.Taken,
                    created: new Date().toISOString().split('T')[0],
                    transactionId: newTransactionId,
                }
            }));
            return { success: true };
        } else {
            return { success: false, error: response.error || "An unknown error occurred during registration." };
        }
    }, [walletAddress, apiStatus]);

    const unregisterDomain = useCallback(async (name: string): Promise<{ success: boolean; error?: string }> => {
        if (apiStatus === 'offline') {
            return { success: false, error: "The service is temporarily unavailable. Please try again later." };
        }

        const normalizedName = name.toLowerCase();
        if (domains[normalizedName] && domains[normalizedName].owner === walletAddress) {
            const response = await unregisterDomainAPI(name);
            if(response.success) {
                setDomains(prev => {
                    const newDomains = { ...prev };
                    delete newDomains[normalizedName];
                    return newDomains;
                });
                return { success: true };
            } else {
                return { success: false, error: response.error || "Failed to unregister domain." };
            }
        } else {
            return { success: false, error: "Domain not found or you are not the owner." };
        }
    }, [domains, walletAddress, apiStatus]);


    const getOwnedDomains = useCallback((): Domain[] => {
        if (!walletAddress) return [];
        // FIX: Cast the result of Object.values to Domain[] to fix an issue where the type of `d` was being inferred as `unknown`.
        return (Object.values(domains) as Domain[]).filter(d => d.owner === walletAddress);
    }, [domains, walletAddress]);
    
    const updateDomain = useCallback(async (name: string, data: Partial<Domain['dns']>): Promise<{success: boolean, error?: string}> => {
        if (apiStatus === 'offline') {
            return { success: false, error: "The service is temporarily unavailable. Please try again later." };
        }

        const normalizedName = name.toLowerCase();
        const response = await updateDomainAPI(normalizedName, data);

        if (response.success && response.data) {
            setDomains(prev => ({
                ...prev,
                [normalizedName]: response.data!
            }));
            return { success: true };
        } else {
             return { success: false, error: response.error || "Failed to update domain." };
        }
    }, [apiStatus]);

    const transferDomain = useCallback(async (name: string, newOwner: string): Promise<{success: boolean, error?: string}> => {
        if (apiStatus === 'offline') {
            return { success: false, error: "The service is temporarily unavailable. Please try again later." };
        }

        const normalizedName = name.toLowerCase();
        const response = await transferDomainAPI(normalizedName, newOwner);

        if (response.success && response.data) {
             setDomains(prev => {
                const updatedDomain = { ...prev[normalizedName], owner: newOwner };
                return { ...prev, [normalizedName]: updatedDomain };
            });
            return { success: true };
        } else {
            return { success: false, error: response.error || "Failed to transfer domain." };
        }
    }, [apiStatus]);


    return { domains, stats, trendingDomains, isLoading, apiStatus, searchDomain, registerDomain, getOwnedDomains, updateDomain, transferDomain, unregisterDomain };
};