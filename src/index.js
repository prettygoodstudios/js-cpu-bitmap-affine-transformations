import { getBitmap, getBitmapFromImageSource, imageDataToImage } from "./bitmap.mjs";
import { animateImageData } from "./animation.js";
import { transform } from "./transform.mjs";

async function main() {
    // const imageData = await getBitmap('#src');
    // animateImageData(imageData, 0, Date.now());
    /**
     * @type {HTMLInputElement}
     */
    const imageInput = document.querySelector('#imageInput');
    /**
     * @type {HTMLInputElement}
     */
    const transformInput = document.querySelector('#transform');
    /**
     * @type {HTMLDivElement}
     */
    const transformWrapper = document.querySelector('#transformWrapper');
    transformWrapper.style.position = 'relative';
    /**
     * @type {HTMLFormElement}
     */
    const imageForm = document.querySelector('#imageForm');
    /**
     * @type {undefined|ImageData}
     */
    let selectedImageData;
    imageInput.addEventListener('change', (e) => {
        const reader = new FileReader();
        const image = document.createElement('img');
        image.style.position = 'absolute';
        reader.addEventListener('load', async (event) => {
            image.src = event.target.result;
        });
        const imageListener = () => {
            transformWrapper.replaceChildren(image);
            transformWrapper.width = image.clientWidth;
            transformWrapper.height = image.clientHeight;
            transformWrapper.style.pointerEvents = 'none';
            selectedImageData = getBitmapFromImageSource(image);
            image.removeEventListener('load', imageListener);
        };
        image.addEventListener('load', imageListener);
        reader.readAsDataURL(e.target.files[0]);
    });
    imageForm.onsubmit = (e) => {
        e.preventDefault();
        if (selectedImageData) {
            const copyOfSelectedImageData = new ImageData(selectedImageData.width, selectedImageData.height);
            copyOfSelectedImageData.data.set(selectedImageData.data);
            const { newImageData, left, top } = transform(copyOfSelectedImageData, `${transformInput.value} scale(1)`);
            const newImage = imageDataToImage(newImageData);
            const targetElement = transformWrapper.querySelector('img');
            targetElement.src = newImage;
            targetElement.style.left = `${left}px`;
            targetElement.style.top = `${top}px`;
        }
    };
}

window.onload = () => {
    main();
}
