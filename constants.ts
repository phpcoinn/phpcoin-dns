import { Domain, DomainStatus } from './types';
import { config } from './config';

const ext = config.defaultDomainExtension;

export const MOCK_WALLET_ADDRESS = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";

export const MOCK_DOMAINS: { [key: string]: Omit<Domain, 'name' | 'status'> & { status: DomainStatus.Taken | DomainStatus.Reserved } } = {
  [`dapp${ext}`]: { 
    owner: MOCK_WALLET_ADDRESS, 
    status: DomainStatus.Taken,
    created: "2023-01-15",
    price: "5.00",
    transactionId: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    linkedSite: "https://phpcoin.net",
    dns: { ip: "192.168.1.1" }
  },
  "web3.phpcoin.net": { 
    owner: "0x1234567890abcdef1234567890abcdef12345678", 
    status: DomainStatus.Taken,
    created: "2022-08-20",
    price: "5.00",
    transactionId: "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
    linkedSite: "https://ethereum.org"
  },
  "test.dap.ad": { 
    owner: MOCK_WALLET_ADDRESS, 
    status: DomainStatus.Taken,
    created: "2023-05-01",
    price: "5.00",
    transactionId: "0x7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b",
    linkedSite: null
  },
  [`admin${ext}`]: { owner: null, status: DomainStatus.Reserved, created: null, price: "2.50" },
  "system.dap.ad": { owner: null, status: DomainStatus.Reserved, created: null, price: "2.50" },
};


export const TEST_PRIVATE_KEY = "Lzhp9LopCGCuLJcGJiSCXJ35FggfcYfwppDKah1BykMr2Q8F4eHEBmraxxCkDFa27mKGdJYCrveZnL1SrPBqfon3vqorcsQVvLaw9irffxPQhAM8Y3z7RgENam5FKPap6zqbKynfeWjHUrgAU6Bn9Touyf4dgYQ1Z";
export const TEST_NEW_OWNER_ADDRESS = 'PhdjvrMRKHj6fm1jCSTteHqb5f3pPEQQZ5';