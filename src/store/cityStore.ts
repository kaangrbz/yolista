import { create } from 'zustand';

export interface CityState {
  selectedCityId: number | null;
  setSelectedCityId: (cityId: number | null) => void;
}

export const useCityStore = create<CityState>((set) => ({
  selectedCityId: null, // Initial state
  setSelectedCityId: (cityId) => set({ selectedCityId: cityId }),
}));
