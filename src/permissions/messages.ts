import { PermissionKind } from './types';

interface PermissionMessage {
  title: string;
  body: string;
}

const messages: Record<PermissionKind, PermissionMessage> = {
  location: {
    title: 'Konum İzni Gerekli',
    body: 'Etrafındaki rotaları görebilmen için ayarlardan konum iznini aç.',
  },
  camera: {
    title: 'Kamera İzni Gerekli',
    body: 'Fotoğraf çekebilmen için ayarlardan kamera iznini aç.',
  },
  photos: {
    title: 'Galeri İzni Gerekli',
    body: 'Fotoğraflarına erişebilmemiz için ayarlardan galeri iznini aç.',
  },
  mediaLibrary: {
    title: 'Medya İzni Gerekli',
    body: 'Medya kütüphanesine erişebilmemiz için ayarlardan ilgili izni aç.',
  },
};

export const getBlockedMessage = (kind: PermissionKind): PermissionMessage => {
  return messages[kind];
};
