export function roc(values: number[], period = 9): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period; i < values.length; i++) {
    const prev = values[i - period];
    if (prev === 0) {
      out[i] = 0;
    } else {
      out[i] = ((values[i] - prev) / prev) * 100;
    }
  }
  return out;
}
