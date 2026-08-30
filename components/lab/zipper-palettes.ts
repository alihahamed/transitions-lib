/**
 * Every colour in the artwork comes from a CSS variable, so a palette is just a
 * set of values to drop on a wrapper — nothing in the SVG changes.
 */
export type Palette = Record<string, string>

export const PALETTES: Record<string, Palette> = {
  nickel: {
    '--zip-metal-hi': '#ffffff',
    '--zip-metal': '#d7d2c8',
    '--zip-metal-mid': '#8f887c',
    '--zip-metal-lo': '#4a453e',
    '--zip-metal-edge': '#211f1c',
    '--zip-tape': '#3d3d46',
    '--zip-tape-lo': '#26262c',
  },
  steel: {
    '--zip-metal-hi': '#f8fbfe',
    '--zip-metal': '#c3ced8',
    '--zip-metal-mid': '#7c8894',
    '--zip-metal-lo': '#3f4750',
    '--zip-metal-edge': '#171b20',
    '--zip-tape': '#2b313a',
    '--zip-tape-lo': '#191d23',
  },
  brass: {
    '--zip-metal-hi': '#fff8dd',
    '--zip-metal': '#eccb6f',
    '--zip-metal-mid': '#b8912f',
    '--zip-metal-lo': '#6b5115',
    '--zip-metal-edge': '#2b2107',
    '--zip-tape': '#3a3228',
    '--zip-tape-lo': '#231f18',
  },
  gunmetal: {
    '--zip-metal-hi': '#c6ccd4',
    '--zip-metal': '#848b95',
    '--zip-metal-mid': '#4f555d',
    '--zip-metal-lo': '#2a2d33',
    '--zip-metal-edge': '#101216',
    '--zip-tape': '#1f2228',
    '--zip-tape-lo': '#121418',
  },
  copper: {
    '--zip-metal-hi': '#ffe9d6',
    '--zip-metal': '#e2a179',
    '--zip-metal-mid': '#a95f37',
    '--zip-metal-lo': '#5d3018',
    '--zip-metal-edge': '#23110a',
    '--zip-tape': '#332822',
    '--zip-tape-lo': '#1d1714',
  },
}

export type PaletteName = keyof typeof PALETTES
export const PALETTE_NAMES = Object.keys(PALETTES) as PaletteName[]
