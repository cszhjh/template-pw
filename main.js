const ejs = require('ejs');
const fs = require('fs');
const sharp = require('sharp');
const pageConfig = require('./config/page.config.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const template = fs.readFileSync('./template.ejs', 'utf-8');

async function getImageInfo(url) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const { width, height, format } = await sharp(buffer).metadata();

    return {
      width,
      height,
      ext: format,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function transformManifest() {
  const { name, icon, gameImgs } = pageConfig;
  const manifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf-8'));
  const iconInfo = await getImageInfo(icon);
  const gameImgsInfo = await Promise.all(gameImgs.map(getImageInfo));

  manifest.name = manifest.short_name = name;

  iconInfo &&
    (manifest.icons = [
      {
        src: icon,
        sizes: `${iconInfo.width}x${iconInfo.height}`,
        type: iconInfo.ext && `image/${iconInfo.ext}`,
      },
    ]);

  manifest.screenshots = gameImgsInfo.filter(Boolean).map(({ width, height, ext }, index) => ({
    src: gameImgs[index],
    sizes: `${width}x${height}`,
    type: ext && `image/${ext}`,
  }));

  fs.writeFileSync('./manifest.json', JSON.stringify(manifest, null, 2), 'utf-8');
}

transformManifest();

const html = ejs.render(template, pageConfig);
fs.writeFileSync('./install.html', html, 'utf-8');
