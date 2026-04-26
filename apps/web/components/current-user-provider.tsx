"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export type CurrentUser = {
  id: string;
  walletAddress: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type CurrentUserContextValue = {
  currentUser: CurrentUser | null;
  isSyncingUser: boolean;
  syncError: string | null;
  refreshCurrentUser: () => Promise<CurrentUser | null>;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);

  if (!context) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }

  return context;
}

export function CurrentUserProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { connected, publicKey } = useWallet();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isSyncingUser, setIsSyncingUser] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const walletAddress = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  const refreshCurrentUser = useCallback(async (): Promise<CurrentUser | null> => {
    if (!connected || !walletAddress) {
      setCurrentUser(null);
      setSyncError(null);
      return null;
    }

    setIsSyncingUser(true);
    setSyncError(null);

    try {
      const response = await fetch("/api/users/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress }),
        cache: "no-store",
      });

      const data = (await response.json()) as { user?: CurrentUser; error?: string };

      if (!response.ok || !data.user) {
        throw new Error(data.error ?? "Failed to sync current user.");
      }

      setCurrentUser(data.user);
      return data.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sync current user.";
      setSyncError(message);
      return null;
    } finally {
      setIsSyncingUser(false);
    }
  }, [connected, walletAddress]);

  useEffect(() => {
    if (!connected || !walletAddress) {
      setCurrentUser(null);
      setSyncError(null);
      return;
    }

    void refreshCurrentUser();
  }, [connected, walletAddress, refreshCurrentUser]);

  return (
    <CurrentUserContext.Provider
      value={{
        currentUser,
        isSyncingUser,
        syncError,
        refreshCurrentUser,
      }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}
