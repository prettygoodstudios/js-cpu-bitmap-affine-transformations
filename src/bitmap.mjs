
/**
 * 
 * @param {CanvasImageSource} image
 * @returns {Promise<ImageData>}
 */
export function getBitmapFromImageSource(bitmap) {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0);
    const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
    return imageData;
}

/**
 * 
 * @param {string} selector 
 * @returns {Promise<ImageData>}
 */
export async function getBitmap(selector) {
    const bitmap = await createImageBitmap(document.querySelector(selector));
    return getBitmapFromImageSource(bitmap);
}

/**
 * 
 * @param {ImageData} imageData
 * @return {string}
 */
export function imageDataToImage(imageData) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const context = canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}

/**
 * 
 * @param {ImageData} imageData
 * @param {number} x 
 * @param {number} y
 * @return {Uint8ClampedArray}
 */
export function getPixel(imageData, x, y) {
    const pixel = y * imageData.width + x;
    const colorChannels = 4;
    return imageData.data.subarray(pixel * colorChannels, (pixel + 1) * colorChannels);
}

/**
 * 
 * @param {ImageData} imageData
 * @param {number} x 
 * @param {number} y
 * @param {Uint8ClampedArray} colors 
 */
export function setPixel(imageData, x, y, colors) {
    if (x < 0 || y < 0) {
        return;
    }
    if (x >= imageData.width || y >= imageData.height) {
        return;
    }
    const pixel = y * imageData.width + x;
    const colorChannels = 4;
    imageData.data.set(colors, pixel * colorChannels);
}
