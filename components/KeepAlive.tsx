"use client";

import { useEffect } from 'react';

/**
 * KeepAlive Component
 * Pings the backend every 10 minutes to prevent Hugging Face Space from sleeping
 * Add this component to your root layout
 */
export default function KeepAlive() {
  useEffect(() => {
    // Ping immediately on mount
    const ping = async () => {
      try {
        await fetch('/api/keep-alive');
        console.log('[KeepAlive] Backend pinged successfully');
      } catch (error) {
        console.error('[KeepAlive] Ping failed:', error);
      }
    };

    // Initial ping
    ping();

    // Set up interval to ping every 10 minutes (600000ms)
    const interval = setInterval(ping, 10 * 60 * 1000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  // This component doesn't render anything
  return null;
}
