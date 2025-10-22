export enum DomainStatus {
  Available = 'available',
  Taken = 'taken',
  Reserved = 'reserved',
  Searching = 'searching'
}

export type Domain = {
  name: string;
  owner: string | null;
  created: string | null;
  status: DomainStatus;
  transactionId?: string;
  linkedSite?: string | null;
  dns?: {
    ip?: string;
    ipfs?: string;
    redirect?: string;
  };
};

export type Page = 'home' | 'my-domains' | 'manage-domain' | 'explorer';