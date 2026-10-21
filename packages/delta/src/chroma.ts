/**
 * Chroma - Color utility class for Delta Design System
 * Provides color manipulation, conversion, and mathematical operations
 * optimized for design system color relationships
 */

export type RGB = [number, number, number];
export type HSL = [number, number, number];

export class Chroma {
  private _rgb: RGB;

  constructor(color: string | RGB | Chroma) {
    if (color instanceof Chroma) {
      this._rgb = [...color._rgb] as RGB;
    } else if (typeof color === "string") {
      this._rgb = this.parseColor(color);
    } else {
      this._rgb = [...color] as RGB;
    }
  }

  private parseColor(color: string): RGB {
    // Remove whitespace and convert to lowercase
    const cleanColor = color.trim().toLowerCase();

    // Handle hex colors (#rgb, #rrggbb, #rrggbbaa)
    if (cleanColor.startsWith("#")) {
      const hex = cleanColor.slice(1);

      switch (hex.length) {
        case 3: {
          // #rgb -> #rrggbb
          const r = Number.parseInt(hex[0]! + hex[0]!, 16);
          const g = Number.parseInt(hex[1]! + hex[1]!, 16);
          const b = Number.parseInt(hex[2]! + hex[2]!, 16);
          return [r, g, b];
        }
        case 6: {
          // #rrggbb
          const r = Number.parseInt(hex.slice(0, 2), 16);
          const g = Number.parseInt(hex.slice(2, 4), 16);
          const b = Number.parseInt(hex.slice(4, 6), 16);
          return [r, g, b];
        }
        case 8: {
          // #rrggbbaa (ignore alpha for now)
          const r = Number.parseInt(hex.slice(0, 2), 16);
          const g = Number.parseInt(hex.slice(2, 4), 16);
          const b = Number.parseInt(hex.slice(4, 6), 16);
          return [r, g, b];
        }
        // No default
      }
    }

    // Handle rgb() and rgba() functions
    const rgbMatch = cleanColor.match(/rgba?\(([^)]+)\)/);
    if (rgbMatch) {
      const values = rgbMatch[1]!.split(",").map((v) => Number.parseFloat(v.trim()));
      return [
        Math.max(0, Math.min(255, values[0] || 0)),
        Math.max(0, Math.min(255, values[1] || 0)),
        Math.max(0, Math.min(255, values[2] || 0)),
      ];
    }

    // Handle hsl() and hsla() functions
    const hslMatch = cleanColor.match(/hsla?\(([^)]+)\)/);
    if (hslMatch) {
      const values = hslMatch[1]!.split(",").map((v) => Number.parseFloat(v.trim()));
      const h = values[0] || 0;
      const s = (values[1] || 0) / 100;
      const l = (values[2] || 0) / 100;
      return this.hslToRgb(h, s, l);
    }

    // Handle named colors (basic set)
    const namedColors: Record<string, RGB> = {
      black: [0, 0, 0],
      white: [255, 255, 255],
      red: [255, 0, 0],
      green: [0, 128, 0],
      blue: [0, 0, 255],
      yellow: [255, 255, 0],
      cyan: [0, 255, 255],
      magenta: [255, 0, 255],
      silver: [192, 192, 192],
      gray: [128, 128, 128],
      grey: [128, 128, 128],
    };

    return namedColors[cleanColor] || [128, 128, 128]; // Default gray
  }

  private hslToRgb(h: number, s: number, l: number): RGB {
    const hue = ((h % 360) + 360) % 360; // Normalize to 0-360
    const saturation = Math.max(0, Math.min(1, s));
    const lightness = Math.max(0, Math.min(1, l));

    const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = lightness - c / 2;

    let r = 0,
      g = 0,
      b = 0;

    if (hue < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (hue < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (hue < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (hue < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (hue < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }

  private rgbToHsl(): HSL {
    const [r = 0, g = 0, b = 0] = this._rgb.map((x) => x / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    const l = sum / 2;

    let h = 0;
    let s = 0;

    if (diff !== 0) {
      s = l > 0.5 ? diff / (2 - sum) : diff / sum;

      switch (max) {
        case r:
          h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
          break;
        case g:
          h = ((b - r) / diff + 2) * 60;
          break;
        case b:
          h = ((r - g) / diff + 4) * 60;
          break;
      }
    }

    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }

  // Output methods
  hex(): string {
    const [r, g, b] = this._rgb;
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  rgb(): string {
    const [r, g, b] = this._rgb;
    return `rgb(${r}, ${g}, ${b})`;
  }

  hsl(): string {
    const [h, s, l] = this.rgbToHsl();
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  // Get raw values
  getRgb(): RGB {
    return [...this._rgb] as RGB;
  }

  getHsl(): HSL {
    return this.rgbToHsl();
  }

  // Color manipulation methods
  lighten(amount: number): Chroma {
    const [h, s, l] = this.rgbToHsl();
    const newL = Math.max(0, Math.min(100, l + amount));
    return Chroma.hsl(h, s, newL);
  }

  darken(amount: number): Chroma {
    return this.lighten(-amount);
  }

  saturate(amount: number): Chroma {
    const [h, s, l] = this.rgbToHsl();
    const newS = Math.max(0, Math.min(100, s + amount));
    return Chroma.hsl(h, newS, l);
  }

  desaturate(amount: number): Chroma {
    return this.saturate(-amount);
  }

  rotate(degrees: number): Chroma {
    const [h, s, l] = this.rgbToHsl();
    const newH = (((h + degrees) % 360) + 360) % 360;
    return Chroma.hsl(newH, s, l);
  }

  // Static constructor methods
  static rgb(r: number, g: number, b: number): Chroma {
    return new Chroma([
      Math.max(0, Math.min(255, Math.round(r))),
      Math.max(0, Math.min(255, Math.round(g))),
      Math.max(0, Math.min(255, Math.round(b))),
    ]);
  }

  static hsl(h: number, s: number, l: number): Chroma {
    const instance = new Chroma([0, 0, 0]);
    instance._rgb = instance.hslToRgb(h, s / 100, l / 100);
    return instance;
  }

  // Color mixing
  static mix(color1: Chroma | string, color2: Chroma | string, ratio: number = 0.5): Chroma {
    const c1 = color1 instanceof Chroma ? color1 : new Chroma(color1);
    const c2 = color2 instanceof Chroma ? color2 : new Chroma(color2);

    const [r1, g1, b1] = c1._rgb;
    const [r2, g2, b2] = c2._rgb;

    const t = Math.max(0, Math.min(1, ratio));

    return new Chroma([
      Math.round(r1 * (1 - t) + r2 * t),
      Math.round(g1 * (1 - t) + g2 * t),
      Math.round(b1 * (1 - t) + b2 * t),
    ]);
  }

  // Contrast and accessibility
  getLuminance(): number {
    const [r = 0, g = 0, b = 0] = this._rgb.map((val) => {
      const normalized = val / 255;
      return normalized <= 0.039_28 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  getContrast(other: Chroma | string): number {
    const otherColor = other instanceof Chroma ? other : new Chroma(other);
    const l1 = this.getLuminance();
    const l2 = otherColor.getLuminance();

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  // Utility methods
  toString(): string {
    return this.hex();
  }

  equals(other: Chroma | string): boolean {
    const otherColor = other instanceof Chroma ? other : new Chroma(other);
    const [r1, g1, b1] = this._rgb;
    const [r2, g2, b2] = otherColor._rgb;
    return r1 === r2 && g1 === g2 && b1 === b2;
  }
}
