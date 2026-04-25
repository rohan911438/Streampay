export {};

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
    };
    phantom?: {
      solana?: {
        isPhantom?: boolean;
      };
    };
  }
}
