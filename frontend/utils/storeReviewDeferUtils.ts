import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFERRED_STORE_REVIEWS_KEY = '@deferred_store_review_order_ids';

export async function getDeferredStoreReviewOrderIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(DEFERRED_STORE_REVIEWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export async function deferStoreReviewOrder(orderId: string): Promise<void> {
  const existing = await getDeferredStoreReviewOrderIds();
  if (existing.includes(orderId)) return;
  await AsyncStorage.setItem(
    DEFERRED_STORE_REVIEWS_KEY,
    JSON.stringify([...existing, orderId])
  );
}

export async function clearDeferredStoreReviewOrder(orderId: string): Promise<void> {
  const existing = await getDeferredStoreReviewOrderIds();
  const next = existing.filter((id) => id !== orderId);
  await AsyncStorage.setItem(DEFERRED_STORE_REVIEWS_KEY, JSON.stringify(next));
}

export async function pruneDeferredStoreReviewOrders(validPendingIds: string[]): Promise<void> {
  const valid = new Set(validPendingIds);
  const existing = await getDeferredStoreReviewOrderIds();
  const next = existing.filter((id) => valid.has(id));
  if (next.length !== existing.length) {
    await AsyncStorage.setItem(DEFERRED_STORE_REVIEWS_KEY, JSON.stringify(next));
  }
}
