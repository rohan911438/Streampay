"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork, WalletReadyState } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { clusterApiUrl } from "@solana/web3.js";
import { CurrentUserProvider } from "@/components/current-user-provider";

const network = WalletAdapterNetwork.Devnet;

const endpoint =
  process.env.NEXT_PUBLIC_RPC_URL ??
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT ??
  clusterApiUrl(network);

if (typeof window !== "undefined") {
  const rpcLabel = endpoint && typeof endpoint === 'string' ? endpoint.split('?')[0] : 'Unknown';
  console.log("[StreamPay] Initializing frontend with RPC:", rpcLabel);
}

const WALLET_STORAGE_KEY = "walletName";
const CONNECT_TIMEOUT_MS = 12000;

function WalletConnectionGuard() {
  const { wallets, connected, connecting, disconnect } = useWallet();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const selectedWalletName = window.localStorage.getItem(WALLET_STORAGE_KEY);
    if (!selectedWalletName) return;

    const hasReadyStoredWallet = wallets.some(
      ({ adapter }) =>
        adapter.name === selectedWalletName &&
        (adapter.readyState === WalletReadyState.Installed ||
          adapter.readyState === WalletReadyState.Loadable)
    );

    if (!hasReadyStoredWallet) {
      window.localStorage.removeItem(WALLET_STORAGE_KEY);
    }
  }, [wallets]);

  useEffect(() => {
    if (!connecting || connected || typeof window === "undefined") return;

    const timeoutId = window.setTimeout(async () => {
      window.localStorage.removeItem(WALLET_STORAGE_KEY);

      try {
        await disconnect();
      } catch {
        // Ignore disconnect failures and still clear stale local wallet state.
      }
    }, CONNECT_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [connected, connecting, disconnect]);

  return null;
}

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <WalletConnectionGuard />
          <CurrentUserProvider>{children}</CurrentUserProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}