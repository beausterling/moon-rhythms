const fs = require('fs');
const https = require('https');
const path = require('path');

const BASE_URL = 'https://svs.gsfc.nasa.gov/vis/a000000/a004600/a004605/frames/730x730_1x1_30p/';
const TOTAL_IMAGES = 8761;
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'moon-phases');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Find the last downloaded image
function findLastDownloadedImage() {
  const files = fs.readdirSync(OUTPUT_DIR);
  if (files.length === 0) return 0;
  
  const numbers = files
    .map(f => parseInt(f.match(/moon\.(\d+)\.jpg/)?.[1] || '0'))
    .filter(n => !isNaN(n));
  
  return Math.max(0, ...numbers);
}

async function downloadImage(imageNumber, retries = 3) {
  const paddedNumber = String(imageNumber).padStart(4, '0');
  const fileName = `moon.${paddedNumber}.jpg`;
  const url = BASE_URL + fileName;
  const outputPath = path.join(OUTPUT_DIR, fileName);

  return new Promise((resolve, reject) => {
    const download = () => {
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          if (retries > 0) {
            console.log(`Retrying ${fileName} (${retries} attempts left)`);
            setTimeout(() => {
              downloadImage(imageNumber, retries - 1)
                .then(resolve)
                .catch(reject);
            }, 1000);
            return;
          }
          reject(new Error(`Failed to download ${fileName}`));
          return;
        }

        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`Downloaded ${fileName}`);
          resolve();
        });
      }).on('error', (err) => {
        if (retries > 0) {
          console.log(`Retrying ${fileName} (${retries} attempts left)`);
          setTimeout(() => {
            downloadImage(imageNumber, retries - 1)
              .then(resolve)
              .catch(reject);
          }, 1000);
        } else {
          reject(err);
        }
      });
    };

    download();
  });
}

async function downloadAllImages() {
  const startFrom = findLastDownloadedImage() + 1;
  console.log(`Starting download from image ${startFrom} of ${TOTAL_IMAGES}...`);
  
  // Download images in batches to avoid overwhelming the server
  const BATCH_SIZE = 5;
  
  for (let i = startFrom; i <= TOTAL_IMAGES; i += BATCH_SIZE) {
    const batch = [];
    for (let j = i; j < Math.min(i + BATCH_SIZE, TOTAL_IMAGES + 1); j++) {
      batch.push(downloadImage(j));
    }
    try {
      await Promise.all(batch);
      console.log(`Completed batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(TOTAL_IMAGES/BATCH_SIZE)}`);
    } catch (error) {
      console.error('Error in batch:', error);
      // Continue with next batch even if current batch had errors
    }
  }

  console.log('All images downloaded successfully!');
}

downloadAllImages().catch(console.error); 