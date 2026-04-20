import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const assets = join(__dirname, '../assets')

// Main icon: blue rounded square + white line chart
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" rx="220" fill="#2563eb"/>
  <polyline
    points="160,730 330,590 510,635 690,455 860,375"
    fill="none" stroke="white" stroke-width="68" stroke-linecap="round" stroke-linejoin="round"
  />
  <circle cx="160" cy="730" r="52" fill="white"/>
  <circle cx="330" cy="590" r="52" fill="white"/>
  <circle cx="510" cy="635" r="52" fill="white"/>
  <circle cx="690" cy="455" r="52" fill="white"/>
  <circle cx="860" cy="375" r="52" fill="white"/>
</svg>`

// Adaptive icon foreground: white chart on transparent (background set in app.json)
const adaptiveSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <polyline
    points="210,760 370,635 512,672 654,508 814,440"
    fill="none" stroke="white" stroke-width="68" stroke-linecap="round" stroke-linejoin="round"
  />
  <circle cx="210" cy="760" r="52" fill="white"/>
  <circle cx="370" cy="635" r="52" fill="white"/>
  <circle cx="512" cy="672" r="52" fill="white"/>
  <circle cx="654" cy="508" r="52" fill="white"/>
  <circle cx="814" cy="440" r="52" fill="white"/>
</svg>`

// Splash icon: same as main icon
const splashSvg = iconSvg

await sharp(Buffer.from(iconSvg)).resize(1024, 1024).png().toFile(join(assets, 'icon.png'))
console.log('✓ icon.png')

await sharp(Buffer.from(adaptiveSvg)).resize(1024, 1024).png().toFile(join(assets, 'adaptive-icon.png'))
console.log('✓ adaptive-icon.png')

await sharp(Buffer.from(splashSvg)).resize(1024, 1024).png().toFile(join(assets, 'splash-icon.png'))
console.log('✓ splash-icon.png')

await sharp(Buffer.from(iconSvg)).resize(48, 48).png().toFile(join(assets, 'favicon.png'))
console.log('✓ favicon.png')

console.log('Done.')
