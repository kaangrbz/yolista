import { create } from 'zustand';

export interface CityState {
  selectedCityId: number | null;
  selectedCityName: string | null;
  setSelectedCityId: (cityId: number | null, cityName?: string) => void;
}

export const useCityStore = create<CityState>((set) => ({
  selectedCityId: null, // Initial state
  selectedCityName: null,
  setSelectedCityId: (cityId, cityName) => set({ selectedCityId: cityId, selectedCityName: cityName }),
}));
