import { ImagePool } from '@squoosh/lib';
import fs from 'fs/promises';

const threads = parseInt(process.argv[2], 10) || 15;
const quality = parseInt(process.argv[3], 10) || 75;

console.log('Threads:', threads);
console.log('Quality:', quality);

const files = await fs.readdir('./images');
const jpgImages = files.filter(file => file.endsWith('.JPG') || file.endsWith('.jpg'));
const imagePool = new ImagePool(threads);

for (const jpgImage of jpgImages) {
	console.log('Percentage:', jpgImages.indexOf(jpgImage) / jpgImages.length * 100 + '%');

	const readedFile = await fs.readFile(`./images/${jpgImage}`);
	const image = imagePool.ingestImage(readedFile);
	
	await image.encode({
		mozjpeg: {
			quality
		}
	});

	const encodedImage = image.encodedWith.mozjpeg.binary;
	
	await fs.writeFile(`./output/${jpgImage}`, encodedImage);
}

await imagePool.close();