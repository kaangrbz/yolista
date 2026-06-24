type StopLabelSource = {
  order_index?: number;
  title?: string | null;
};

/** Durak sırası için standart harf etiketi: 0 → A, 1 → B, … */
export function getStopLetterLabel(orderIndex: number): string {
  const index = Math.max(0, Math.floor(orderIndex));

  if (index < 26) {
    return String.fromCharCode(65 + index);
  }

  const first = Math.floor(index / 26) - 1;
  const second = index % 26;

  return (
    String.fromCharCode(65 + Math.max(0, first)) +
    String.fromCharCode(65 + second)
  );
}

/** Yol tarifi / timeline için: harf + varsa kısa başlık. */
export function getStandardStopSegmentLabel(stop: StopLabelSource): string {
  const letter = getStopLetterLabel(stop.order_index ?? 0);
  const title = stop.title?.trim();

  return title ? `${letter} · ${title}` : letter;
}
