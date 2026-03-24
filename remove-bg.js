const Jimp = require('jimp');

async function removeBackground() {
  const imagePath = 'public/logo.png';
  console.log('Reading image:', imagePath);
  
  try {
    const image = await Jimp.read(imagePath);
    const { width, height } = image.bitmap;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 2; // -2 for slight anti-aliasing edge

    image.scan(0, 0, width, height, function (x, y, idx) {
      // Calculate distance from center
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

      // If outside the circle, set alpha to 0 (transparent)
      if (distance > radius) {
        this.bitmap.data[idx + 3] = 0; // Alpha channel
      }
    });

    await image.writeAsync(imagePath);
    console.log('Background removed successfully and saved to:', imagePath);
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

removeBackground();
