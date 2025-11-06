export function applyAlpha(color: string, alpha: number): string {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));

  if (typeof color !== 'string') {
    return color as unknown as string;
  }

  if (color.includes('gradient')) {
    return color;
  }

  if (color.startsWith('#')) {
    let hex = color.slice(1);

    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }

    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
    }
  }

  const rgbaMatch = color.match(/rgba?\(([^)]+)\)/);
  if (rgbaMatch) {
    const values = rgbaMatch[1].split(',').map(part => part.trim());
    if (values.length >= 3) {
      const [r, g, b] = values;
      return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
    }
  }

  return color;
}
