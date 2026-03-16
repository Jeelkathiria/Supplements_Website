import { apiCall } from './apiClient';

export interface FavoriteItem {
  id: string;
  userId: string;
  productId: string;
  product: any;
  createdAt: string;
}

// Get all favorites for user
export const getFavorites = async (): Promise<FavoriteItem[]> => {
  return apiCall<FavoriteItem[]>('/favorites');
};

// Add product to favorites
export const addFavorite = async (productId: string): Promise<FavoriteItem> => {
  return apiCall<FavoriteItem>('/favorites', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
};

// Remove product from favorites
export const removeFavorite = async (productId: string): Promise<void> => {
  return apiCall<void>(`/favorites/${productId}`, {
    method: 'DELETE',
  });
};

// Check if product is favorited
export const checkFavorite = async (productId: string): Promise<{ isFavorited: boolean }> => {
  return apiCall<{ isFavorited: boolean }>(`/favorites/${productId}/check`);
};
