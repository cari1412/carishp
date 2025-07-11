// store/favorites.ts
import { Product } from 'lib/shopify/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface FavoritesStore {
  favorites: Product[];
  isLoading: boolean;
  isHydrated: boolean;
  addToFavorites: (product: Product) => void;
  removeFromFavorites: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => boolean; // returns new state
  clearFavorites: () => void;
  getFavoritesCount: () => number;
  setHydrated: (state: boolean) => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      isLoading: false,
      isHydrated: false,
      
      addToFavorites: (product: Product) => {
        set(state => {
          // Проверяем, есть ли уже товар в избранном
          if (state.favorites.some(fav => fav.id === product.id)) {
            return state;
          }
          return { favorites: [...state.favorites, product] };
        });
      },
      
      removeFromFavorites: (productId: string) => {
        set(state => ({
          favorites: state.favorites.filter(fav => fav.id !== productId)
        }));
      },
      
      isFavorite: (productId: string) => {
        return get().favorites.some(fav => fav.id === productId);
      },
      
      toggleFavorite: (product: Product) => {
        const isFav = get().isFavorite(product.id);
        if (isFav) {
          get().removeFromFavorites(product.id);
        } else {
          get().addToFavorites(product);
        }
        return !isFav; // возвращаем новое состояние
      },
      
      clearFavorites: () => {
        set({ favorites: [] });
      },
      
      getFavoritesCount: () => {
        return get().favorites.length;
      },
      
      setHydrated: (state: boolean) => {
        set({ isHydrated: state });
      }
    }),
    {
      name: 'shopify-favorites',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Опционально: можно добавить миграцию данных между версиями
      migrate: (persistedState: any, version: number) => {
        return persistedState;
      },
      // Частичная гидратация - загружаем только нужные поля
      partialize: (state) => ({ favorites: state.favorites }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);