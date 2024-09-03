import React from 'react';
import './App.css';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { base, baseSepolia } from 'wagmi/chains';
import PixelCanvas from './components/PixelCanvas.js';

const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: 'd36e53f0e6cdc4c98b832336017f232c',
  chains: [
    base, baseSepolia
  ],
  ssr: true,
});

// this fixes error swallowing https://github.com/wevm/wagmi/issues/3674
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
}
);

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="App">
            <header className="App-header">
              <ConnectButton />
            </header>
            <main>
              <PixelCanvas/>
            </main>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
