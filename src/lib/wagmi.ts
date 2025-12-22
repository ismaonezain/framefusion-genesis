import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

export const config = createConfig({
  chains: [base],
  connectors: [
    // 1. Farcaster Connector - untuk Farcaster Mini App
    farcasterMiniApp(),
    
    // 2. Injected Connector - untuk browser wallets (MetaMask, Coinbase, Brave, Rainbow, dll)
    injected(),
    
    // 3. WalletConnect - untuk mobile wallets
    walletConnect({
      projectId: 'a01e2d3c4b5f6a7b8c9d0e1f2a3b4c5d', // Placeholder, bisa diupdate kalau ada
      showQrModal: true,
      metadata: {
        name: 'FrameFusion Genesis',
        description: 'Mint Your Mystical NFT Identity',
        url: 'https://framefusion-genesis.vercel.app',
        icons: ['https://framefusion-genesis.vercel.app/icon.png']
      }
    }),
  ],
  transports: {
    [base.id]: http(),
  },
  ssr: false,
  multiInjectedProviderDiscovery: true,
});
