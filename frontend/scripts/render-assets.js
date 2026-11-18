/**
 * Renders the source SVGs in assets/ into the PNGs consumed by
 * `@capacitor/assets` (icon 1024x1024, splash 2732x2732).
 */
'use strict';

const path = require('path');
const sharp = require('sharp');

const assetsDir = path.join(__dirname, '..', 'assets');

async function render() {
  await sharp(path.join(assetsDir, 'icon-source.svg'))
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));

  await sharp(path.join(assetsDir, 'icon-source.svg'))
    .png()
    .toFile(path.join(assetsDir, 'icon-only.png'));

  await sharp(path.join(assetsDir, 'icon-foreground-source.svg'))
    .png()
    .toFile(path.join(assetsDir, 'icon-foreground.png'));

  await sharp(path.join(assetsDir, 'icon-background-source.svg'))
    .png()
    .toFile(path.join(assetsDir, 'icon-background.png'));

  await sharp(path.join(assetsDir, 'splash-source.svg'))
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));

  console.log('Rendered icon, adaptive icon and splash assets');
}

render().catch((error) => {
  console.error(error);
  process.exit(1);
});
