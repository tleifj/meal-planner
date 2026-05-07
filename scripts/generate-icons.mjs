// One-off: generates app icons from an inline SVG.
import sharp from "sharp"
import { writeFile, mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, "..", "public", "icons")

// Deep forest background, cream utensils, terracotta dot for warmth.
const FG = "#1f3d2a"
const STROKE = "#f3ecdb"
const ACCENT = "#c97c4a"

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${FG}"/>
  <g fill="none" stroke="${STROKE}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
    <path d="M160 160v192"/>
    <path d="M200 160v192"/>
    <path d="M160 160h40"/>
    <circle cx="340" cy="220" r="56"/>
    <path d="M340 276v76"/>
  </g>
  <circle cx="256" cy="430" r="14" fill="${ACCENT}"/>
</svg>
`.trim()

const maskable = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${FG}"/>
  <g transform="translate(96 96) scale(0.625)" fill="none" stroke="${STROKE}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
    <path d="M160 160v192"/>
    <path d="M200 160v192"/>
    <path d="M160 160h40"/>
    <circle cx="340" cy="220" r="56"/>
    <path d="M340 276v76"/>
  </g>
</svg>
`.trim()

await mkdir(outDir, { recursive: true })

const sizes = [192, 384, 512]
for (const size of sizes) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()
  await writeFile(resolve(outDir, `icon-${size}.png`), buf)
}
const mbuf = await sharp(Buffer.from(maskable)).resize(512, 512).png().toBuffer()
await writeFile(resolve(outDir, "maskable-512.png"), mbuf)

const apple = await sharp(Buffer.from(svg)).resize(180, 180).png().toBuffer()
await writeFile(resolve(outDir, "apple-touch-icon.png"), apple)

console.log("icons generated in", outDir)
