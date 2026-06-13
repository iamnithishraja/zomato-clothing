import { useCallback } from 'react';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types/user';

/** Fetch latest user profile from backend and update auth state + storage. */
export function useRefreshUserProfile() {
  const { token, updateUser } = useAuth();

  return useCallback(async (): Promise<User | null> => {
    if (!token) return null;

    const response = await apiClient.get('/api/v1/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data?.success && response.data.user) {
      const updatedUser = response.data.user as User;
      await updateUser(updatedUser);
      return updatedUser;
    }

    return null;
  }, [token, updateUser]);
}
