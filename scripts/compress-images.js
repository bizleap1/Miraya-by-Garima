import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve('public');

async function getFiles(dir) {
  const subdirs = await fs.promises.readdir(dir);
  const files = await Promise.all(
    subdirs.map(async (subdir) => {
      const res = path.resolve(dir, subdir);
      return (await fs.promises.stat(res)).isDirectory() ? getFiles(res) : res;
    })
  );
  return files.reduce((a, f) => a.concat(f), []);
}

async function compressImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return;

  const stat = await fs.promises.stat(filePath);
  const sizeMB = stat.size / (1024 * 1024);
  
  // Only compress images larger than 150 KB
  if (stat.size < 150 * 1024) return;

  try {
    const inputBuffer = await fs.promises.readFile(filePath);
    const metadata = await sharp(inputBuffer).metadata();
    let instance = sharp(inputBuffer);

    // Resize if width is larger than 1920px
    if (metadata.width && metadata.width > 1920) {
      instance = instance.resize({ width: 1920, withoutEnlargement: true });
    }

    let outputBuffer;
    if (ext === '.png') {
      // If PNG is fully opaque, converting to webp or compressed png is great
      outputBuffer = await instance
        .png({ quality: 80, compressionLevel: 9, palette: true })
        .toBuffer();
    } else {
      outputBuffer = await instance
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
    }

    // Only overwrite if compressed size is smaller
    if (outputBuffer.length < stat.size) {
      await fs.promises.writeFile(filePath, outputBuffer);
      const newSizeMB = outputBuffer.length / (1024 * 1024);
      const savedPercent = Math.round((1 - outputBuffer.length / stat.size) * 100);
      console.log(`[Compressed] ${path.relative(PUBLIC_DIR, filePath)}: ${sizeMB.toFixed(2)}MB → ${newSizeMB.toFixed(2)}MB (-${savedPercent}%)`);
    }
  } catch (err) {
    console.error(`[Error] Failed to compress ${filePath}:`, err.message);
  }
}

async function run() {
  console.log('🚀 Starting buffer-based image optimization magic with Sharp...');
  const allFiles = await getFiles(PUBLIC_DIR);
  const imageFiles = allFiles.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png'].includes(ext);
  });

  console.log(`Found ${imageFiles.length} image files to process...`);
  for (const file of imageFiles) {
    await compressImage(file);
  }
  console.log('✨ All images optimized successfully!');
}

run();
