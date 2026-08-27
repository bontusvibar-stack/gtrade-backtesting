export function momentum(values: number[], period = 10): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period; i < values.length; i++) {
    out[i] = values[i] - values[i - period];
  }
  return out;
}
