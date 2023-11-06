import { imageDataToImage } from "./bitmap.mjs";
import { transform } from "./transform.mjs";

/**
 * 
 * @param {ImageData} imageData
 * @param {number} angle
 * @param {number} lastFrame
 */
export function animateImageData(imageData, angle, lastFrame) {
    const { newImageData, left, top } = transform(imageData, `translate(${angle*0.5}, ${angle*0.5}) scale(1.2) rotate(${angle})`);
    const animation = document.querySelector('#animation');
    const animationWrapper = document.querySelector('#animationWrapper');
    animationWrapper.style.width = `${imageData.width}px`;
    animationWrapper.style.height = `${imageData.height}px`;
    animationWrapper.style.position = 'relative';
    animation.src = imageDataToImage(newImageData);
    animation.style.position = 'absolute';
    animation.style.top = `${top}px`;
    animation.style.left = `${left}px`;
    const now = Date.now();
    requestAnimationFrame(() => animateImageData(imageData, angle + 0.1 * (now - lastFrame), now));
}