import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product } from '../../types';
import * as favoritesService from "../../../services/favoritesService";
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface FavoritesContextType {
  favorites: Product[];
  isFavorited: (productId: string) => boolean;
  addFavorite: (productId: string) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  loadFavorites: () => Promise<void>;
}

const defaultFavoritesContext: FavoritesContextType = {
  favorites: [],
  isFavorited: () => false,
  addFavorite: async () => {},
  removeFavorite: async () => {},
  isLoading: false,
  error: null,
  loadFavorites: async () => {},
};

const FavoritesContext = createContext<FavoritesContextType>(defaultFavoritesContext);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  return context;
};

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, firebaseUser } = useAuth();

  // Load favorites when user logs in
  useEffect(() => {
    if (isAuthenticated && firebaseUser) {
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [isAuthenticated, firebaseUser?.uid]);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const favoriteItems = await favoritesService.getFavorites();
      if (favoriteItems && Array.isArray(favoriteItems)) {
        setFavorites(favoriteItems.map((item: any) => item.product));
        setError(null);
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const isFavorited = (productId: string): boolean => {
    return favorites.some(product => product.id === productId);
  };

  const addFavorite = async (productId: string) => {
    try {
      setError(null);
      
      if (!isAuthenticated) {
        toast.error('Please log in to add favorites');
        return;
      }

      // Check if already favorited locally
      if (isFavorited(productId)) {
        toast.info('Already in favorites');
        return;
      }

      await favoritesService.addFavorite(productId);
      
      // Reload favorites to get updated list with full product data
      await loadFavorites();
      toast.success('Added to favorites');
    } catch (err) {
      console.error('Failed to add favorite:', err);
      
      // Handle "already in favorites" error gracefully
      if (err instanceof Error && err.message.includes('already in favorites')) {
        await loadFavorites();
        toast.info('Already in favorites');
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to add favorite';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const removeFavorite = async (productId: string) => {
    try {
      setError(null);
      
      if (!isAuthenticated) {
        toast.error('Please log in to remove favorites');
        return;
      }

      await favoritesService.removeFavorite(productId);
      
      // Update local state immediately for better UX
      setFavorites(prev => prev.filter(p => p.id !== productId));
      toast.success('Removed from favorites');
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove favorite';
      setError(errorMessage);
      toast.error(errorMessage);
      // Reload to ensure sync if there's an error
      await loadFavorites();
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorited,
        addFavorite,
        removeFavorite,
        isLoading,
        error,
        loadFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
