import { imageDataToImage, getBitmapFromImageSource } from './bitmap.mjs';
import { transform } from './transform.mjs';

export function setupEditor() {
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
