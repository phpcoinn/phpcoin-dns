import React from 'react';
import { motion } from 'framer-motion';
import { SearchIcon, WalletIcon, SettingsIcon, ShieldIcon } from '../components/Icons';

type StepCardProps = {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    delay: number;
};

// FIX: Explicitly type StepCard as a React.FC to align with project patterns and resolve an issue where the `children` prop was not being correctly inferred.
const StepCard: React.FC<StepCardProps> = ({ icon, title, children, delay }) => (
    <motion.div
        className="bg-white dark:bg-navy-800/50 rounded-2xl border border-slate-200 dark:border-navy-700 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay }}
    >
        <div className="flex items-center space-x-4 mb-4">
            <div className="bg-primary-start/10 p-3 rounded-full">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <div className="text-slate-600 dark:text-slate-400 space-y-3">
            {children}
        </div>
    </motion.div>
);

const HowItWorksPage: React.FC = () => {
    return (
        <div>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
            >
                <h1 className="text-4xl font-bold mb-4">How It Works</h1>
                <p className="max-w-3xl mx-auto text-lg text-slate-600 dark:text-slate-400">
                    Your guide to searching, registering, and managing decentralized domains on the PHP Coin network. It's simple, secure, and gives you full control.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <StepCard
                    icon={<SearchIcon className="w-6 h-6 text-primary-start" />}
                    title="1. Search for a Domain"
                    delay={0.2}
                >
                    <p>Begin your journey by using the intuitive search bar on our homepage. Type in your desired domain name, and our system will perform a real-time check against the PHP Coin blockchain to verify its availability.</p>
                    <p>The search result will clearly indicate if the domain is available, already taken by another user, or a reserved name. Our pricing is transparent and based on the length of the domain name—shorter, more premium names have a higher value.</p>
                </StepCard>
                
                <StepCard
                    icon={<WalletIcon className="w-6 h-6 text-primary-start" />}
                    title="2. Register Your Domain"
                    delay={0.4}
                >
                    <p>Once you've found an available domain, connect your Web3 wallet with a single click. We support a wide range of popular wallets for your convenience. After connecting, click 'Register' to start the process.</p>
                    <p>This action initiates a secure blockchain transaction. Upon your confirmation in the wallet, the domain is minted as a unique NFT (Non-Fungible Token) and sent directly to your address. You are now the verifiable and sole owner of the domain.</p>
                </StepCard>

                <StepCard
                    icon={<SettingsIcon className="w-6 h-6 text-primary-start" />}
                    title="3. Manage Your Domain"
                    delay={0.6}
                >
                    <p>Your registered domains are neatly organized in the 'My Domains' dashboard. Here, you have complete control to configure DNS records. Point your domain to a traditional server IP address, decentralized IPFS content, or simply redirect it to another website.</p>
                    <p>Ownership is flexible. You can securely transfer your domain to any other PHP Coin wallet address. Please note that this is a permanent, on-chain transaction that cannot be reversed.</p>
                </StepCard>

                <StepCard
                    icon={<ShieldIcon className="w-6 h-6 text-primary-start" />}
                    title="4. Security & Ownership"
                    delay={0.8}
                >
                    <p>Your domain is more than just a name; it's a digital asset secured on the blockchain. Management rights are tied exclusively to the wallet that holds the domain NFT, ensuring unparalleled security and resistance to censorship.</p>
                    <p>Experience true digital ownership. Unlike the legacy domain system, there's no central registrar with the power to revoke your name. You can even unregister a domain at any time to recover a percentage of its original registration cost.</p>
                </StepCard>
            </div>
        </div>
    );
};

export default HowItWorksPage;