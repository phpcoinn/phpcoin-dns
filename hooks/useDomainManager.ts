import { useState, useCallback, useEffect } from 'react';
import { Domain, DomainStatus } from '../types';
import { MOCK_DOMAINS } from '../constants';

const LOCAL_STORAGE_KEY = 'phpcoin_domains';

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

    useEffect(() => {
        try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(domains));
        } catch (error) {
            console.error("Could not save domains to localStorage", error);
        }
    }, [domains]);

    const searchDomain = useCallback(async (name: string): Promise<Domain> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const normalizedName = name.toLowerCase();
                if (domains[normalizedName]) {
                    resolve(domains[normalizedName]);
                } else {
                    resolve({ name: normalizedName, status: DomainStatus.Available, owner: null, created: null });
                }
            }, 500); // Simulate network delay
        });
    }, [domains]);

    const registerDomain = useCallback(async (name: string): Promise<{ success: boolean; error?: string }> => {
        if (!walletAddress) {
            return { success: false, error: "Please connect your wallet to register a domain." };
        }

        return new Promise(resolve => {
            setTimeout(() => {
                // Simulate a 80% success rate
                if (Math.random() < 0.8) {
                    const normalizedName = name.toLowerCase();
                    const newTransactionId = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
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
                    resolve({ success: true });
                } else {
                    resolve({ success: false, error: "Transaction failed due to network congestion. Please try again." });
                }
            }, 2000); // Simulate 2 second payment processing
        });
    }, [walletAddress]);

    const unregisterDomain = useCallback(async (name: string): Promise<{ success: boolean; error?: string }> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const normalizedName = name.toLowerCase();
                if (domains[normalizedName] && domains[normalizedName].owner === walletAddress) {
                    setDomains(prev => {
                        const newDomains = { ...prev };
                        delete newDomains[normalizedName];
                        return newDomains;
                    });
                    resolve({ success: true });
                } else {
                    resolve({ success: false, error: "Domain not found or you are not the owner." });
                }
            }, 1000); // Simulate network delay
        });
    }, [domains, walletAddress]);


    const getOwnedDomains = useCallback((): Domain[] => {
        if (!walletAddress) return [];
        // FIX: Cast the result of Object.values to Domain[] to fix an issue where the type of `d` was being inferred as `unknown`.
        return (Object.values(domains) as Domain[]).filter(d => d.owner === walletAddress);
    }, [domains, walletAddress]);
    
    const updateDomain = useCallback(async (name: string, data: Partial<Domain['dns']>) => {
        return new Promise<void>(resolve => {
            setTimeout(() => {
                const normalizedName = name.toLowerCase();
                setDomains(prev => {
                    if (prev[normalizedName]) {
                        const updatedDomain = { ...prev[normalizedName] };
                        updatedDomain.dns = { ...updatedDomain.dns, ...data };
                        return { ...prev, [normalizedName]: updatedDomain };
                    }
                    return prev;
                });
                resolve();
            }, 1500); // Simulate network delay for saving
        });
    }, []);

    const transferDomain = useCallback(async (name: string, newOwner: string) => {
         return new Promise<void>(resolve => {
            setTimeout(() => {
                const normalizedName = name.toLowerCase();
                setDomains(prev => {
                    if (prev[normalizedName]) {
                        const updatedDomain = { ...prev[normalizedName], owner: newOwner };
                        return { ...prev, [normalizedName]: updatedDomain };
                    }
                    return prev;
                });
                resolve();
            }, 2000); // Simulate network delay for transfer
        });
    }, []);


    return { domains, searchDomain, registerDomain, getOwnedDomains, updateDomain, transferDomain, unregisterDomain };
};