const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const sharp = require('sharp');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const pageConfig = require('./config/page.config.js');

const buildFolderPath = path.resolve(__dirname, 'build');

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
  const manifestFilename = path.resolve(__dirname, 'manifest.json');
  const manifest = await fs.promises.readFile(manifestFilename, 'utf-8');
  const manifestJson = JSON.parse(manifest);
  const [iconInfo, ...gameImgsInfo] = await Promise.all([
    getImageInfo(icon),
    ...gameImgs.map(getImageInfo),
  ]);

  manifestJson.name = manifestJson.short_name = name;
  iconInfo &&
    (manifestJson.icons = [
      {
        src: icon,
        sizes: `${iconInfo.width}x${iconInfo.height}`,
        type: iconInfo.ext && `image/${iconInfo.ext}`,
      },
    ]);

  manifestJson.screenshots = gameImgsInfo
    .filter(img => {
      if (!img) return false;
      const { width, height, ext = '' } = img;

      /**
          宽度和高度必须介于 320 像素到 3840 像素之间。
          最大尺寸不能超过最小尺寸长度的 2.3 倍。
          与相应设备规格匹配的所有屏幕截图都必须具有相同的宽高比。
          从 Chrome 109 开始，桌面设备上只会显示 form_factor 设置为 "wide" 的屏幕截图。
          从 Chrome 109 开始，在 Android 设备上将忽略 form_factor 设置为 "wide" 的屏幕截图。
          为了向后兼容，系统仍会显示不含 form_factor 的屏幕截图。
         */
      return (
        width >= 320 &&
        width <= 3840 &&
        height >= 320 &&
        height <= 3840 &&
        Math.max(width, height) <= Math.min(width, height) * 2.3 &&
        ['jpg', 'jpeg', 'png'].includes(ext.toLocaleLowerCase())
      );
    })
    .map(({ width, height, ext }, index) => ({
      src: gameImgs[index],
      sizes: `${width}x${height}`,
      type: ext && `image/${ext}`,
    }));

  return manifestJson;
}

async function writeFileToTheBuildFolder(filename, content) {
  console.log('---- 向 build 文件夹中写入文件: ', filename, ' ----');
  const targetFilename = path.resolve(buildFolderPath, filename);
  await fs.promises.writeFile(targetFilename, content, 'utf-8');
}

async function copyFileToTheBuildFolder(filename) {
  console.log('---- 向 build 文件夹写入文件: ', filename, ' ----');
  const originDirname = path.resolve(__dirname, filename);
  const targetFilename = path.resolve(buildFolderPath, filename);
  await fs.promises.copyFile(originDirname, targetFilename);
}

async function copyDirToTheBuildFolder(dirname) {
  console.log('---- 向 build 文件夹写入文件夹内容: ', dirname, ' ----');
  const originDirname = path.resolve(__dirname, dirname);
  const targetDirname = path.resolve(buildFolderPath, dirname);
  await fs.promises.mkdir(targetDirname, { recursive: true });

  const files = await fs.promises.readdir(originDirname);
  return files?.map(async filename => {
    const originFilename = path.resolve(originDirname, filename);
    const targetFilename = path.resolve(targetDirname, filename);
    const stat = await fs.promises.stat(originFilename);
    if (stat.isDirectory()) {
      await copyDirToTheBuildFolder(path.join(dirname, filename));
    } else {
      await fs.promises.copyFile(originFilename, targetFilename);
    }
  });
}

(async function () {
  const templateFilename = path.resolve(__dirname, 'template.ejs');
  const burialPointFilename = path.resolve(__dirname, 'js/burial-point.js');
  const webPushFilename = path.resolve(__dirname, 'js/web-push.js');
  const staticResources = ['css', 'img', 'js', 'game'];

  const [htmlTemplate, burialPointTemplate, webPushTemplate, manifestJson] = await Promise.all([
    fs.promises.readFile(templateFilename, 'utf-8'),
    fs.promises.readFile(burialPointFilename, 'utf-8'),
    fs.promises.readFile(webPushFilename, 'utf-8'),
    transformManifest(),
  ]);

  // 渲染模板
  const installHtml = ejs.render(htmlTemplate, pageConfig);
  const burialPointJs = ejs.render(burialPointTemplate, pageConfig);
  const webPushJs = ejs.render(webPushTemplate, pageConfig);

  /** build actions */
  console.log('build starting');
  // 创建 build 文件夹, 并将运行时依赖文件添加到 build 文件夹下
  const buildPath = path.resolve(__dirname, 'build');

  try {
    console.log('---- 删除旧的 build 文件夹 ----');
    await fs.promises.rm(buildPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  console.log('---- 创建新的 build 文件夹 ----');
  await fs.promises.mkdir(buildPath);
  await Promise.all(staticResources.map(filename => copyDirToTheBuildFolder(filename)));
  await Promise.all([
    writeFileToTheBuildFolder('install.html', installHtml),
    writeFileToTheBuildFolder('js/burial-point.js', burialPointJs),
    writeFileToTheBuildFolder('js/web-push.js', webPushJs),
    writeFileToTheBuildFolder('manifest.json', JSON.stringify(manifestJson)),
    copyFileToTheBuildFolder('service-worker.js'),
  ]);

  console.log('---- build end ----');
})();
