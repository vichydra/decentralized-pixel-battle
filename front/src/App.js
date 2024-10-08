import React from 'react';
import './App.css';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, ConnectButton, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { base, baseSepolia } from 'wagmi/chains';
import PixelCanvas from './components/PixelCanvas.js';
import logo from './assets/logo.svg'; // Import logo.svg

const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: '2e9700383ee3aee70aff7f69991330d3',
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
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#EA5A47',
            accentColorForeground: 'white',
            borderRadius: 'small',
          })} 
        >
          <div className="App">
            <header className="App-header">
              <div className="logo-container">
                <img src={logo} alt="Logo" className="logo-icon" />
                <span className="logo-text">PIXELSPACE</span>
              </div>
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
