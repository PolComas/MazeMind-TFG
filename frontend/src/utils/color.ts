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

type RgbColor = { r: number; g: number; b: number };

function parseColorToRgb(color: string): RgbColor | null {
  if (typeof color !== 'string') return null;

  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((char) => char + char)
        .join('');
    }
    if (hex.length !== 6 && hex.length !== 8) return null;
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  const rgbaMatch = color.match(/rgba?\(([^)]+)\)/);
  if (!rgbaMatch) return null;

  const values = rgbaMatch[1].split(',').map((part) => Number(part.trim()));
  if (values.length < 3 || values.some((value) => Number.isNaN(value))) return null;

  return {
    r: values[0],
    g: values[1],
    b: values[2],
  };
}

function luminanceChannel(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(color: RgbColor): number {
  return (
    0.2126 * luminanceChannel(color.r) +
    0.7152 * luminanceChannel(color.g) +
    0.0722 * luminanceChannel(color.b)
  );
}

export function getContrastRatio(foreground: string, background: string): number {
  const fg = parseColorToRgb(foreground);
  const bg = parseColorToRgb(background);
  if (!fg || !bg) return 1;

  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

export function pickReadableTextColor(
  background: string,
  options: { light?: string; dark?: string } = {},
): string {
  const light = options.light ?? '#FFFFFF';
  const dark = options.dark ?? '#0B1021';

  const lightContrast = getContrastRatio(light, background);
  const darkContrast = getContrastRatio(dark, background);

  return lightContrast >= darkContrast ? light : dark;
}

export function ensureContrastColor(
  foreground: string,
  background: string,
  minRatio = 4.5,
  fallback?: string,
): string {
  const ratio = getContrastRatio(foreground, background);
  if (ratio >= minRatio) return foreground;

  if (fallback) {
    const fallbackRatio = getContrastRatio(fallback, background);
    if (fallbackRatio >= minRatio) return fallback;
  }

  return pickReadableTextColor(background);
}
