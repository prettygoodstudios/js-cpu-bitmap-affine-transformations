import { setPixel } from "../src/bitmap.mjs";
import { transform } from "../src/transform.mjs";

/**
 * 
 * @param {() => void} runnable
 * @returns {number} Number of ms it took to compute
 */
function timeIt(runnable) {
    const start = Date.now();
    runnable();
    return Date.now() - start;
}

/**
 * 
 * @param {number} start inclusive
 * @param {end} end exclusive
 * @returns {number}
 */
function randInt(start, end) {
    return (Math.random() * (end - start) + start) | 0;
}

/**
 * 
 * @param {number} width 
 * @param {number} height
 * @returns {ImageData}
 */
function createRandomRGBAImage(width, height) {
    const imageData = new ImageData(width, height);
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const pixel = new Uint8Array(Array.from(Array(4), () => randInt(0, 256)));
            setPixel(imageData, col, row, pixel);
        }
    }
    return imageData;
}

/**
 * 
 * @param {number} n 
 * @param {number} width 
 * @param {number} height 
 * @returns {ImageData[]}
 */
function createBatchOfImages(n, width, height) {
    return Array.from(Array(n), () => createRandomRGBAImage(width, height));
}

function timeTransform(n, scaleFactor) {
    return createBatchOfImages(n, 100, 200)
        .reduce((acc, imageData) => 
            acc + timeIt(() => transform(imageData, `translate(100, 100) scale(${scaleFactor}) rotate(45)`))
        , 0);
}


self.onmessage = (event) => {
    const totalTimeInMs = timeTransform(event.data.runs, event.data.scaleFactor);
    self.postMessage(totalTimeInMs);
};

