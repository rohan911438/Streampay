export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-6xl font-black text-primary mb-4">404</h1>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h2>
      <p className="text-slate-500 max-w-md mx-auto mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <a 
        href="/"
        className="inline-flex items-center justify-center h-12 rounded-xl bg-slate-900 px-8 text-sm font-bold text-white transition-all hover:bg-slate-800"
      >
        Return Home
      </a>
    </div>
  );
}
