import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StreamPay",
  description: "Privacy-first recurring payments on Solana powered by Cloak.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Suppress 'Cannot redefine property: ethereum' and related extension errors
                const handleExtensionError = (e) => {
                  const message = e.message || (e.reason && e.reason.message);
                  if (message && (message.includes('ethereum') || message.includes('defineProperty'))) {
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                    if (e.preventDefault) e.preventDefault();
                    console.warn('Suppressed extension conflict error:', message);
                    return true;
                  }
                };
                window.addEventListener('error', handleExtensionError, true);
                window.addEventListener('unhandledrejection', handleExtensionError, true);
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}