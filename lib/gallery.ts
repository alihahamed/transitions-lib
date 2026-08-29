export const items = [
  { id: 'aurora', name: 'Aurora', from: 'oklch(0.72 0.19 200)', to: 'oklch(0.55 0.24 300)', note: 'Cool cyan folding into deep violet.' },
  { id: 'ember', name: 'Ember', from: 'oklch(0.78 0.18 60)', to: 'oklch(0.55 0.23 25)', note: 'Warm amber burning down to red.' },
  { id: 'moss', name: 'Moss', from: 'oklch(0.80 0.15 140)', to: 'oklch(0.48 0.14 165)', note: 'Fresh green settling into pine.' },
  { id: 'dusk', name: 'Dusk', from: 'oklch(0.70 0.16 330)', to: 'oklch(0.42 0.15 265)', note: 'Pink horizon fading to night blue.' },
  { id: 'sand', name: 'Sand', from: 'oklch(0.88 0.08 85)', to: 'oklch(0.62 0.12 45)', note: 'Pale dune drifting to clay.' },
  { id: 'ink', name: 'Ink', from: 'oklch(0.55 0.02 260)', to: 'oklch(0.22 0.03 265)', note: 'Graphite dissolving into black.' },
] as const

export type Item = (typeof items)[number]
export const byId = (id: string) => items.find((i) => i.id === id)
export const gradient = (i: Item) =>
  `linear-gradient(140deg, ${i.from}, ${i.to})`
