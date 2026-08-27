const fs = require('fs');
const path = require('path');

const imgDir = path.resolve('c:/Users/nguye/OneDrive/Documents/Máy tính/PROGRAM/ke-hoach-huan-luyen/army-tech/public/img');
const sourceLogo = path.join(imgDir, 'logo-removebg-preview.png');

if (fs.existsSync(sourceLogo)) {
  fs.copyFileSync(sourceLogo, path.join(imgDir, 'icon-192.png'));
  fs.copyFileSync(sourceLogo, path.join(imgDir, 'icon-512.png'));
  fs.copyFileSync(sourceLogo, path.join(imgDir, 'icon-maskable-192.png'));
  fs.copyFileSync(sourceLogo, path.join(imgDir, 'icon-maskable-512.png'));
  fs.copyFileSync(sourceLogo, path.join(imgDir, 'apple-touch-icon.png'));
  console.log('✅ Đã tạo các file icon PNG cho PWA.');
}

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14532d"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="red" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="190" fill="none" stroke="url(#gold)" stroke-width="12" opacity="0.4"/>
  <circle cx="256" cy="256" r="160" fill="url(#red)"/>
  <!-- Star -->
  <polygon points="256,130 286,218 378,218 304,272 332,360 256,306 180,360 208,272 134,218 226,218" fill="url(#gold)" stroke="#b45309" stroke-width="4"/>
  <text x="256" y="440" font-family="'Segoe UI', Arial, sans-serif" font-size="34" font-weight="900" fill="#f8fafc" text-anchor="middle" letter-spacing="3">ARMY TECH</text>
</svg>`;

fs.writeFileSync(path.join(imgDir, 'icon.svg'), svgIcon);
console.log('✅ Đã tạo icon.svg.');
