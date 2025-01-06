import { ImagePool } from '@squoosh/lib';
import fs from 'fs/promises';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

async function checkFFmpeg() {
	try {
		await execPromise('ffmpeg -version');
	} catch (error) {
		console.error('ffmpeg is not installed or not found in PATH. Please install ffmpeg and try again.');
		process.exit(1);
	}
}

await checkFFmpeg();

const threads = parseInt(process.argv[2], 10) || 15;
const quality = parseInt(process.argv[3], 10) || 75;

console.log('Threads:', threads);
console.log('Quality:', quality);

const files = await fs.readdir('./images');
const jpgImages = files.filter(file => file.endsWith('.JPG') || file.endsWith('.jpg'));
const videoFiles = files.filter(file => file.endsWith('.mp4') || file.endsWith('.avi'));

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

await Promise.all(videoFiles.map(async (videoFile) => {
	try {
		console.log('Compressing video:', videoFile);
		const outputFilePath = `./output/${videoFile}`;
		const command = `ffmpeg -i ./images/${videoFile} -vcodec libx265 -crf 28 ${outputFilePath}`;
		await execPromise(command);
	} catch (error) {
		console.error(`Failed to compress video ${videoFile}:`, error);
	}
}));

await imagePool.close();
