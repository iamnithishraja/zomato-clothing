import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from 'react';
import apiClient from '@/api/client';
import type { PendingStoreReviewOrder, PendingStoreReviewsResponse } from '@/types/storeReview';
import {
  getDeferredStoreReviewOrderIds,
  deferStoreReviewOrder,
  clearDeferredStoreReviewOrder,
} from '@/utils/storeReviewDeferUtils';

interface PendingStoreReviewsContextValue {
  totalPending: number;
  visiblePendingCount: number;
  orders: PendingStoreReviewOrder[];
  visibleOrders: PendingStoreReviewOrder[];
  deferredOrderIds: string[];
  isLoading: boolean;
  fetchPendingReviews: () => Promise<PendingStoreReviewsResponse | null>;
  deferOrder: (orderId: string) => Promise<void>;
  markOrderReviewed: (orderId: string) => Promise<void>;
}

const PendingStoreReviewsContext = createContext<PendingStoreReviewsContextValue | null>(null);

export function PendingStoreReviewsProvider({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const [totalPending, setTotalPending] = useState(0);
  const [orders, setOrders] = useState<PendingStoreReviewOrder[]>([]);
  const [deferredOrderIds, setDeferredOrderIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDeferred = useCallback(async () => {
    const ids = await getDeferredStoreReviewOrderIds();
    setDeferredOrderIds(ids);
    return ids;
  }, []);

  const fetchPendingReviews = useCallback(async () => {
    if (!enabled) {
      setTotalPending(0);
      setOrders([]);
      return null;
    }
    try {
      setIsLoading(true);
      const response = await apiClient.get<PendingStoreReviewsResponse>(
        '/api/v1/stores/pending-reviews'
      );
      if (response.data.success) {
        await loadDeferred();
        setTotalPending(response.data.totalPending);
        setOrders(response.data.orders);
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching pending store reviews:', error);
      setTotalPending(0);
      setOrders([]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, loadDeferred]);

  const deferOrder = useCallback(async (orderId: string) => {
    await deferStoreReviewOrder(orderId);
    setDeferredOrderIds((prev) => (prev.includes(orderId) ? prev : [...prev, orderId]));
  }, []);

  const markOrderReviewed = useCallback(async (orderId: string) => {
    await clearDeferredStoreReviewOrder(orderId);
    setDeferredOrderIds((prev) => prev.filter((id) => id !== orderId));
  }, []);

  useEffect(() => {
    if (enabled) {
      loadDeferred();
      fetchPendingReviews();
    }
  }, [enabled, loadDeferred, fetchPendingReviews]);

  const deferredSet = useMemo(() => new Set(deferredOrderIds), [deferredOrderIds]);

  const visibleOrders = useMemo(
    () => orders.filter((o) => !deferredSet.has(o._id)),
    [orders, deferredSet]
  );

  const visiblePendingCount = Math.max(0, totalPending - deferredOrderIds.length);

  return (
    <PendingStoreReviewsContext.Provider
      value={{
        totalPending,
        visiblePendingCount,
        orders,
        visibleOrders,
        deferredOrderIds,
        isLoading,
        fetchPendingReviews,
        deferOrder,
        markOrderReviewed,
      }}
    >
      {children}
    </PendingStoreReviewsContext.Provider>
  );
}

export function usePendingStoreReviewsContext() {
  const ctx = useContext(PendingStoreReviewsContext);
  if (!ctx) {
    throw new Error('usePendingStoreReviewsContext must be used within PendingStoreReviewsProvider');
  }
  return ctx;
}
