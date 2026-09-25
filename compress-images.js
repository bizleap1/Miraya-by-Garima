import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, 'public');

// We want to compress high-quality images (e.g. > 500KB)
const MIN_SIZE_TO_COMPRESS = 300 * 1024; // 300KB

async function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      await processDirectory(fullPath);
    } else if (stat.isFile() && stat.size > MIN_SIZE_TO_COMPRESS) {
      const ext = path.extname(fullPath).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        try {
          console.log(`Compressing: ${fullPath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
          const tmpPath = fullPath + '.tmp';
          
          let pipeline = sharp(fullPath);
          
          if (ext === '.jpg' || ext === '.jpeg') {
            pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
          } else if (ext === '.png') {
            pipeline = pipeline.png({ quality: 82, compressionLevel: 8 });
          }
          
          await pipeline.toFile(tmpPath);
          fs.renameSync(tmpPath, fullPath);
          
          const newStat = fs.statSync(fullPath);
          console.log(`  -> New size: ${(newStat.size / 1024 / 1024).toFixed(2)} MB`);
        } catch (err) {
          console.error(`Failed to compress ${fullPath}:`, err);
        }
      }
    }
  }
}

async function main() {
  console.log('Starting image compression in public directory...');
  await processDirectory(PUBLIC_DIR);
  console.log('Image compression complete.');
}

main();
