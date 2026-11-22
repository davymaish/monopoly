import { readFileSync } from 'node:fs'

const stylesheet = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8')

function getColorToken(name) {
  const match = stylesheet.match(new RegExp(`--${name}:\\s*(#[\\da-fA-F]{6})`))

  if (!match?.[1]) {
    throw new Error(`Missing color token --${name}`)
  }

  return match[1]
}

function relativeLuminance(color) {
  const channels = [1, 3, 5].map((index) => {
    const channel = Number.parseInt(color.slice(index, index + 2), 16) / 255

    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function contrastRatio(foreground, background) {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (first, second) => second - first,
  )

  return (lighter + 0.05) / (darker + 0.05)
}

const checks = [
  { label: 'Body text on page', foreground: 'color-text', background: 'color-page', minimum: 4.5 },
  {
    label: 'Muted text on surface',
    foreground: 'color-muted',
    background: 'color-surface',
    minimum: 4.5,
  },
  {
    label: 'Accent text on page',
    foreground: 'color-accent',
    background: 'color-page',
    minimum: 4.5,
  },
  {
    label: 'Control text on control background',
    foreground: 'color-control-text',
    background: 'color-control-background',
    minimum: 4.5,
  },
  {
    label: 'Focus ring on surface',
    foreground: 'color-focus',
    background: 'color-surface',
    minimum: 3,
  },
]

let hasFailures = false

for (const check of checks) {
  const ratio = contrastRatio(getColorToken(check.foreground), getColorToken(check.background))
  const result = ratio >= check.minimum ? 'PASS' : 'FAIL'

  console.log(`${result} ${check.label}: ${ratio.toFixed(2)}:1 (minimum ${check.minimum}:1)`)
  hasFailures ||= ratio < check.minimum
}

if (hasFailures) {
  process.exitCode = 1
}
