// client/src/index.tsx - Remove StrictMode to prevent double renders
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './App';
import { SocketProvider } from './contexts/SocketContext';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Remove React.StrictMode to prevent double rendering in development
root.render(
  <QueryClientProvider client={queryClient}>
    <SocketProvider>
      <App />
    </SocketProvider>
  </QueryClientProvider>
);