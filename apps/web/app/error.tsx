'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertCircle size={40} />
      </div>
      <h2 className="mb-2 text-2xl font-black tracking-tight text-slate-900">
        Something went wrong
      </h2>
      <p className="mb-8 max-w-md text-sm font-medium text-slate-500">
        We encountered an unexpected error while rendering the page. 
        Detailed technical information has been logged to the console.
      </p>
      <div className="flex gap-4">
        <Button
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-xl px-6 py-4 font-black uppercase tracking-widest"
        >
          <RefreshCcw size={16} />
          Try Again
        </Button>
        <Button
          variant="outline"
          onClick={() => window.location.href = '/'}
          className="rounded-xl px-6 py-4 font-black uppercase tracking-widest"
        >
          Go Home
        </Button>
      </div>
      {error.digest && (
        <p className="mt-8 text-[10px] font-bold uppercase tracking-widest text-slate-300">
          Error Digest: {error.digest}
        </p>
      )}
    </div>
  );
}
