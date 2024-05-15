const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
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

  manifest.screenshots = gameImgsInfo
    .filter(img => {
      if (!img) return false;
      const { width, height, ext = '' } = img;
      if (
        width < 320 ||
        width > 3840 ||
        height < 320 ||
        height > 3840 ||
        Math.max(width, height) > Math.min(width, height) * 2.3 ||
        !['jpg', 'jpeg', 'png'].includes(ext.toLocaleLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .map(({ width, height, ext }, index) => ({
      src: gameImgs[index],
      sizes: `${width}x${height}`,
      type: ext && `image/${ext}`,
    }));

  fs.writeFileSync('./manifest.json', JSON.stringify(manifest, null, 2), 'utf-8');
}

transformManifest();

const html = ejs.render(template, pageConfig);

/** build actions */
console.log('build starting');
// 创建 build 文件夹, 并将运行时依赖文件移动到 build 文件夹下
const buildPath = './build';

try {
  fs.rmSync('./build', { recursive: true });
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw error;
  }
}
fs.mkdirSync('./build');
fs.writeFileSync(`${buildPath}/install.html`, html, 'utf-8');
['./manifest.json', './service-worker.js', './index.html'].forEach(path =>
  fs.copyFileSync(path, `${buildPath}/${path}`),
);
['./css', './img', './js'].forEach(path => copyDir(path, `${buildPath}/${path}`));
// 将模板生成到 build 文件夹下
console.log('build success');

function copyDir(originPath, targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });

  const files = fs.readdirSync(originPath);
  files.forEach(file => {
    const originFilePath = path.join(originPath, file);
    const targetFilePath = path.join(targetPath, file);

    const stats = fs.statSync(originFilePath);
    if (stats.isDirectory()) {
      copyDir(originFilePath, targetFilePath);
    } else {
      fs.copyFileSync(originFilePath, targetFilePath);
    }
  });
}
