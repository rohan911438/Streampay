"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

const endpoint =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT ??
  "https://api.devnet.solana.com";

function AutoSelectPhantom() {
  const { wallet, wallets, select } = useWallet();

  useEffect(() => {
    if (wallet) {
      return;
    }

    const phantomWallet = wallets.find((item) => item.adapter.name === "Phantom");

    if (!phantomWallet) {
      return;
    }

    const isAvailable =
      phantomWallet.readyState === WalletReadyState.Installed ||
      phantomWallet.readyState === WalletReadyState.Loadable;

    if (isAvailable) {
      select(phantomWallet.adapter.name);
    }
  }, [wallet, wallets, select]);

  return null;
}

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <AutoSelectPhantom />
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}