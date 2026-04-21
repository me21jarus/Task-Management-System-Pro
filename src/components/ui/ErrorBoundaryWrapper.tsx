import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { logger } from "../../lib/logger";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center text-danger mb-4">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-xl font-bold text-text mb-2">Something went wrong</h2>
      <p className="text-sm text-text-muted max-w-md mb-8">
        We encountered an unexpected error while loading this page. 
        {/* Do not show raw stack trace in prod. */}
        {process.env.NODE_ENV !== "production" && (
          <span className="block mt-2 font-mono text-[10px] bg-bg p-2 rounded text-left overflow-auto break-all">
            {(error as Error).message}
          </span>
        )}
      </p>
      <Button onClick={resetErrorBoundary} className="gap-2">
        <RefreshCw size={16} />
        Try Again
      </Button>
    </div>
  );
}

export function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        logger.error("Route Error Boundary caught error:", error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
