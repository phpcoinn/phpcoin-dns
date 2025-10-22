import { Domain, DomainStatus } from './types';

export const MOCK_WALLET_ADDRESS = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";

export const MOCK_DOMAINS: { [key: string]: Omit<Domain, 'name' | 'status'> & { status: DomainStatus.Taken | DomainStatus.Reserved } } = {
  "dapp.phpcoin": { 
    owner: MOCK_WALLET_ADDRESS, 
    status: DomainStatus.Taken,
    created: "2023-01-15",
    transactionId: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    linkedSite: "https://phpcoin.net",
    dns: { ip: "192.168.1.1" }
  },
  "web3.phpcoin.net": { 
    owner: "0x1234567890abcdef1234567890abcdef12345678", 
    status: DomainStatus.Taken,
    created: "2022-08-20",
    transactionId: "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
    linkedSite: "https://ethereum.org"
  },
  "test.dap.ad": { 
    owner: MOCK_WALLET_ADDRESS, 
    status: DomainStatus.Taken,
    created: "2023-05-01",
    transactionId: "0x7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b",
    linkedSite: null
  },
  "admin.phpcoin": { owner: null, status: DomainStatus.Reserved, created: null },
  "system.dap.ad": { owner: null, status: DomainStatus.Reserved, created: null },
};

export const TRENDING_DOMAINS: string[] = [
    "defi.phpcoin", "metaverse.dap.ad", "gaming.phpcoin.net", "dao.dap.ad", "nft.phpcoin", "crypto.dap.ad"
];