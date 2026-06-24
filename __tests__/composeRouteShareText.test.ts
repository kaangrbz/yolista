import {
  composeRouteShareBody,
  composeRouteShareText,
  extractShareMetaFromStops,
} from '../src/utils/composeRouteShareText';

const SAMPLE_URL = 'https://web.youlistaapp.com/post/abc';

describe('composeRouteShareText', () => {
  it('builds a rich share message for multi-stop routes', () => {
    const message = composeRouteShareText({
      cityName: 'İstanbul',
      stopCount: 5,
      stopTitles: ['Kadıköy', 'Moda', 'Balat', 'Beşiktaş', 'Ortaköy'],
      url: SAMPLE_URL,
    });

    expect(message).toContain("İstanbul'da 5 duraklı bir rota");
    expect(message).toContain('Kadıköy → Moda → Balat...');
    expect(message).toContain("Yolista'da keşfet:");
    expect(message).toContain(SAMPLE_URL);
  });

  it('omits the arrow chain for single-stop routes', () => {
    const message = composeRouteShareText({
      cityName: 'İzmir',
      stopCount: 1,
      stopTitles: ['Alsancak'],
      url: SAMPLE_URL,
    });

    expect(message).toContain("İzmir'de 1 duraklı bir rota");
    expect(message).not.toContain('→');
    expect(message).not.toContain('Alsancak →');
  });

  it('falls back when city and category are missing', () => {
    const body = composeRouteShareBody({
      stopCount: 0,
      stopTitles: [],
    });

    expect(body).toBe("Yolista'da bir rota");
  });

  it('places custom message before the rich body and link', () => {
    const message = composeRouteShareText({
      cityName: 'Ankara',
      stopCount: 2,
      stopTitles: ['Kızılay', 'Ulus'],
      url: SAMPLE_URL,
      customMessage: 'Bunu mutlaka dene',
    });

    expect(message.startsWith('Bunu mutlaka dene')).toBe(true);
    expect(message).toContain("Ankara'da 2 duraklı bir rota");
    expect(message).toContain('Kızılay → Ulus');
    expect(message.endsWith(SAMPLE_URL)).toBe(true);
  });

  it('includes author attribution when provided', () => {
    const body = composeRouteShareBody({
      cityName: 'Bursa',
      stopCount: 3,
      stopTitles: ['Osmangazi', 'Nilüfer', 'Mudanya'],
      authorUsername: 'gezgin',
    });

    expect(body).toContain('@gezgin önerdi');
  });

  it('extracts stop metadata in route order', () => {
    const meta = extractShareMetaFromStops([
      { title: '  Moda ', order_index: 2 },
      { title: 'Kadıköy', order_index: 1 },
      { title: '', order_index: 3 },
    ]);

    expect(meta.stopCount).toBe(3);
    expect(meta.stopTitles).toEqual(['Kadıköy', 'Moda']);
  });
});
