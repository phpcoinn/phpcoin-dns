import { Domain, GlobalStats } from '../types';
import { config } from '../config';

// The base URL for the PHP Coin backend API is now sourced from the global config file.
const API_BASE_URL = config.apiBaseUrl;
const NETWORK_ERROR_MESSAGE = 'Network error. Could not connect to the server.';

/**
 * A generic type for API responses to ensure consistent error handling.
 * @template T The expected data type in a successful response.
 */
type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
};

/**
 * A centralized helper function to handle all `fetch` requests.
 * It sets default headers, stringifies the body, parses JSON responses,
 * and standardizes error handling.
 *
 * @param endpoint The API endpoint to call (will be appended to the base URL).
 * @param options Standard `fetch` options.
 * @returns A promise that resolves to an ApiResponse object.
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
        const url = endpoint ? `${API_BASE_URL}?${endpoint}` : API_BASE_URL;
        console.log('apiRequest', url, options.body || '');
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            let errorMessage = `Request failed with status: ${response.status}`;
            try {
                // Try to parse a more specific error message from the API response body.
                const errorBody = await response.json();
                errorMessage = errorBody.error || errorMessage;
            } catch (e) {
                // Ignore if the body isn't JSON or can't be parsed.
            }
            return { success: false, error: errorMessage };
        }
        
        // Handle responses that might not have a body (e.g., a successful DELETE request).
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
             const data = await response.json();
             // Assuming the backend response structure is { success: boolean, data: ... }
             if (data.success === false) {
                 return { success: false, error: data.error || 'API returned an error.' };
             }
             console.log(data.data);
             return { success: true, data: data.data };
        }

        // If no JSON body, return a success response with no data.
        return { success: true };

    } catch (error) {
        console.error('API request failed:', error);
        // This catch block is crucial for detecting when the server is down.
        // A TypeError often indicates a network failure (CORS, DNS, offline server).
        return { success: false, error: NETWORK_ERROR_MESSAGE };
    }
}

// Below are the specific, exported functions for each API endpoint.

/**
 * Authenticates a user using a challenge-response mechanism.
 * @param nonce A unique, single-use string.
 * @param signature The nonce signed by the user's private key.
 * @param publicKey The user's public key.
 */
export const authAPI = (nonce: string, signature: string, publicKey: string): Promise<ApiResponse<{ address: string }>> => {
    return apiRequest(`q=auth`, {
        method: 'POST',
        body: JSON.stringify({ nonce, signature, publicKey }),
    });
};


/**
 * Fetches global statistics like total registered domains and total funds collected.
 */
export const getGlobalStatsAPI = (): Promise<ApiResponse<GlobalStats>> => {
    return apiRequest(`q=stats`, { method: 'GET' });
};

/**
 * Searches for a domain on the backend.
 * @param name The domain name to search for.
 */
export const searchDomainAPI = (name: string): Promise<ApiResponse<Domain>> => {
    return apiRequest(`q=search&name=${encodeURIComponent(name)}`, { method: 'GET' });
};

/**
 * Fetches the list of trending domains.
 */
export const getTrendingDomainsAPI = (): Promise<ApiResponse<string[]>> => {
    return apiRequest(`q=trending`, { method: 'GET' });
};

/**
 * Registers a new domain for a given owner.
 * @param name The domain name to register.
 * @param owner The wallet address of the new owner.
 */
export const registerDomainAPI = (name: string, owner: string): Promise<ApiResponse<{ transactionId: string }>> => {
    return apiRequest('', {
        method: 'POST',
        body: JSON.stringify({ q: 'register', name, owner }),
    });
};

/**
 * Fetches all domains owned by a specific address.
 * @param owner The wallet address to query.
 */
export const getOwnedDomainsAPI = (owner: string): Promise<ApiResponse<Domain[]>> => {
    return apiRequest(`q=owned&owner=${encodeURIComponent(owner)}`, { method: 'GET' });
};

/**
 * Updates a domain's DNS records.
 * @param name The name of the domain to update.
 * @param dns The partial DNS data to update.
 */
export const updateDomainAPI = (name: string, dns: Partial<Domain['dns']>): Promise<ApiResponse<Domain>> => {
    return apiRequest(``, {
        method: 'PUT',
        body: JSON.stringify({ q: 'update', name, dns }),
    });
};

/**
 * Transfers a domain to a new owner.
 * @param name The name of the domain to transfer.
 * @param newOwner The wallet address of the recipient.
 */
export const transferDomainAPI = (name: string, newOwner: string): Promise<ApiResponse<Domain>> => {
    return apiRequest(``, {
        method: 'POST',
        body: JSON.stringify({ q: 'transfer', name, newOwner }),
    });
};

/**
 * Unregisters (deletes) a domain from the system.
 * @param name The name of the domain to unregister.
 */
export const unregisterDomainAPI = (name: string): Promise<ApiResponse<void>> => {
    return apiRequest(``, {
        method: 'DELETE',
        body: JSON.stringify({ q: 'unregister', name }),
    });
};