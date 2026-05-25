export interface CityCenter {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

export const CITY_CENTERS: CityCenter[] = [
  { id: 1, name: 'Adana', latitude: 37.0, longitude: 35.3213 },
  { id: 2, name: 'Adıyaman', latitude: 37.7648, longitude: 38.2786 },
  { id: 3, name: 'Afyonkarahisar', latitude: 38.7507, longitude: 30.5567 },
  { id: 4, name: 'Ağrı', latitude: 39.7191, longitude: 43.0503 },
  { id: 5, name: 'Amasya', latitude: 40.6499, longitude: 35.8353 },
  { id: 6, name: 'Ankara', latitude: 39.9334, longitude: 32.8597 },
  { id: 7, name: 'Antalya', latitude: 36.8969, longitude: 30.7133 },
  { id: 8, name: 'Artvin', latitude: 41.1828, longitude: 41.8183 },
  { id: 9, name: 'Aydın', latitude: 37.856, longitude: 27.8416 },
  { id: 10, name: 'Balıkesir', latitude: 39.6484, longitude: 27.8826 },
  { id: 11, name: 'Bilecik', latitude: 40.1451, longitude: 29.9793 },
  { id: 12, name: 'Bingöl', latitude: 38.8855, longitude: 40.4966 },
  { id: 13, name: 'Bitlis', latitude: 38.4011, longitude: 42.1078 },
  { id: 14, name: 'Bolu', latitude: 40.7392, longitude: 31.6089 },
  { id: 15, name: 'Burdur', latitude: 37.7203, longitude: 30.2908 },
  { id: 16, name: 'Bursa', latitude: 40.1828, longitude: 29.0665 },
  { id: 17, name: 'Çanakkale', latitude: 40.1553, longitude: 26.4142 },
  { id: 18, name: 'Çankırı', latitude: 40.6013, longitude: 33.6134 },
  { id: 19, name: 'Çorum', latitude: 40.5499, longitude: 34.9537 },
  { id: 20, name: 'Denizli', latitude: 37.7765, longitude: 29.0864 },
  { id: 21, name: 'Diyarbakır', latitude: 37.9144, longitude: 40.2306 },
  { id: 22, name: 'Edirne', latitude: 41.6764, longitude: 26.5559 },
  { id: 23, name: 'Elazığ', latitude: 38.681, longitude: 39.2264 },
  { id: 24, name: 'Erzincan', latitude: 39.75, longitude: 39.5 },
  { id: 25, name: 'Erzurum', latitude: 39.9043, longitude: 41.2679 },
  { id: 26, name: 'Eskişehir', latitude: 39.7767, longitude: 30.5206 },
  { id: 27, name: 'Gaziantep', latitude: 37.0662, longitude: 37.3833 },
  { id: 28, name: 'Giresun', latitude: 40.9128, longitude: 38.3895 },
  { id: 29, name: 'Gümüşhane', latitude: 40.4386, longitude: 39.5086 },
  { id: 30, name: 'Hakkari', latitude: 37.5833, longitude: 43.7333 },
  { id: 31, name: 'Hatay', latitude: 36.2025, longitude: 36.1606 },
  { id: 32, name: 'Isparta', latitude: 37.7648, longitude: 30.5566 },
  { id: 33, name: 'Mersin', latitude: 36.8121, longitude: 34.6415 },
  { id: 34, name: 'İstanbul', latitude: 41.0082, longitude: 28.9784 },
  { id: 35, name: 'İzmir', latitude: 38.4192, longitude: 27.1287 },
  { id: 36, name: 'Kars', latitude: 40.6013, longitude: 43.097 },
  { id: 37, name: 'Kastamonu', latitude: 41.3887, longitude: 33.7827 },
  { id: 38, name: 'Kayseri', latitude: 38.7312, longitude: 35.4787 },
  { id: 39, name: 'Kırklareli', latitude: 41.7351, longitude: 27.2257 },
  { id: 40, name: 'Kırşehir', latitude: 39.1425, longitude: 34.1709 },
  { id: 41, name: 'Kocaeli', latitude: 40.8533, longitude: 29.8815 },
  { id: 42, name: 'Konya', latitude: 37.8716, longitude: 32.4847 },
  { id: 43, name: 'Kütahya', latitude: 39.4242, longitude: 29.9833 },
  { id: 44, name: 'Malatya', latitude: 38.3552, longitude: 38.3095 },
  { id: 45, name: 'Manisa', latitude: 38.6191, longitude: 27.4289 },
  { id: 46, name: 'Kahramanmaraş', latitude: 37.5858, longitude: 36.9371 },
  { id: 47, name: 'Mardin', latitude: 37.3212, longitude: 40.7245 },
  { id: 48, name: 'Muğla', latitude: 37.2153, longitude: 28.3636 },
  { id: 49, name: 'Muş', latitude: 38.7432, longitude: 41.5065 },
  { id: 50, name: 'Nevşehir', latitude: 38.6939, longitude: 34.6857 },
  { id: 51, name: 'Niğde', latitude: 37.9667, longitude: 34.6833 },
  { id: 52, name: 'Ordu', latitude: 40.9839, longitude: 37.8764 },
  { id: 53, name: 'Rize', latitude: 41.0201, longitude: 40.5234 },
  { id: 54, name: 'Sakarya', latitude: 40.7569, longitude: 30.3783 },
  { id: 55, name: 'Samsun', latitude: 41.2867, longitude: 36.33 },
  { id: 56, name: 'Siirt', latitude: 37.9333, longitude: 41.95 },
  { id: 57, name: 'Sinop', latitude: 42.0231, longitude: 35.1531 },
  { id: 58, name: 'Sivas', latitude: 39.7477, longitude: 37.0179 },
  { id: 59, name: 'Tekirdağ', latitude: 40.978, longitude: 27.5111 },
  { id: 60, name: 'Tokat', latitude: 40.3167, longitude: 36.55 },
  { id: 61, name: 'Trabzon', latitude: 41.0015, longitude: 39.7178 },
  { id: 62, name: 'Tunceli', latitude: 39.1079, longitude: 39.5401 },
  { id: 63, name: 'Şanlıurfa', latitude: 37.1591, longitude: 38.7969 },
  { id: 64, name: 'Uşak', latitude: 38.6823, longitude: 29.4082 },
  { id: 65, name: 'Van', latitude: 38.4942, longitude: 43.38 },
  { id: 66, name: 'Yozgat', latitude: 39.8181, longitude: 34.8147 },
  { id: 67, name: 'Zonguldak', latitude: 41.4564, longitude: 31.7987 },
  { id: 68, name: 'Aksaray', latitude: 38.3687, longitude: 34.037 },
  { id: 69, name: 'Bayburt', latitude: 40.2552, longitude: 40.2249 },
  { id: 70, name: 'Karaman', latitude: 37.1759, longitude: 33.2287 },
  { id: 71, name: 'Kırıkkale', latitude: 39.8468, longitude: 33.5153 },
  { id: 72, name: 'Batman', latitude: 37.8812, longitude: 41.1351 },
  { id: 73, name: 'Şırnak', latitude: 37.5164, longitude: 42.4611 },
  { id: 74, name: 'Bartın', latitude: 41.6344, longitude: 32.3375 },
  { id: 75, name: 'Ardahan', latitude: 41.1105, longitude: 42.7022 },
  { id: 76, name: 'Iğdır', latitude: 39.9237, longitude: 44.045 },
  { id: 77, name: 'Yalova', latitude: 40.65, longitude: 29.2667 },
  { id: 78, name: 'Karabük', latitude: 41.2061, longitude: 32.6204 },
  { id: 79, name: 'Kilis', latitude: 36.7184, longitude: 37.1212 },
  { id: 80, name: 'Osmaniye', latitude: 37.0742, longitude: 36.2467 },
  { id: 81, name: 'Düzce', latitude: 40.8438, longitude: 31.1565 },
];

const CITY_CENTER_BY_ID = new Map<number, CityCenter>(
  CITY_CENTERS.map((city) => [city.id, city]),
);

export const getCityCenter = (cityId?: number | null): CityCenter | undefined => {
  if (cityId == null) {
    return undefined;
  }

  return CITY_CENTER_BY_ID.get(cityId);
};

export const getCityIdsInBbox = (bbox: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}): number[] => {
  return CITY_CENTERS.filter(
    (city) =>
      city.latitude >= bbox.minLat &&
      city.latitude <= bbox.maxLat &&
      city.longitude >= bbox.minLng &&
      city.longitude <= bbox.maxLng,
  ).map((city) => city.id);
};
