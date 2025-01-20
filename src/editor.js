import { imageDataToImage, getBitmapFromImageSource } from './bitmap.mjs';
import { computeTransformMatrix, transform } from './transform.mjs';

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
            image.src = event.target.result?.toString();
        });
        const imageListener = async () => {
            transformWrapper.replaceChildren(image);
            transformWrapper.setAttribute('width', `${image.clientWidth}px`);
            transformWrapper.setAttribute('height', `${image.clientHeight}px`);
            const bitmap = await createImageBitmap(image)
            selectedImageData = getBitmapFromImageSource(bitmap);
            image.removeEventListener('load', imageListener);
        };
        image.addEventListener('load', imageListener);
        if (e.target instanceof HTMLInputElement) {
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    imageForm.onsubmit = (e) => {
        e.preventDefault();
        if (selectedImageData) {
            const copyOfSelectedImageData = new ImageData(selectedImageData.width, selectedImageData.height);
            copyOfSelectedImageData.data.set(selectedImageData.data);
            const commandString = `${transformInput.value} scale(1)`;
            const { newImageData, left, top } = transform(copyOfSelectedImageData, commandString);
            const transformMatrix = computeTransformMatrix(commandString);
            /** @type {HTMLTableSectionElement} */
            const transformMatrixBody = document.querySelector('#transformMatrixBody');
            const tableRows = [];
            for (let row = 0; row < transformMatrix.rows; row++) {
                const tableRow = document.createElement('tr');
                for (let col = 0; col < transformMatrix.cols; col++) {
                    const tableCell = document.createElement('td');
                    tableCell.textContent = transformMatrix.get(col, row)?.toLocaleString();
                    tableRow.appendChild(tableCell);
                }
                tableRows.push(tableRow);
            }
            transformMatrixBody.replaceChildren(...tableRows);
            const newImage = imageDataToImage(newImageData);
            const targetElement = transformWrapper.querySelector('img');
            targetElement.src = newImage;
            targetElement.style.left = `${left}px`;
            targetElement.style.top = `${top}px`;
            /** @type {HTMLAnchorElement} */
            const downloadButton = document.querySelector('#download') ?? imageForm.appendChild(document.createElement(('a')));
            downloadButton.id = 'download';
            downloadButton.href = newImage;
            downloadButton.download = 'transformed';
            downloadButton.innerText = 'Download Transformed Image';
            /** @type {HTMLParagraphElement} */
            const downloadDisclaimer = document.querySelector('#downloadDisclaimer') ?? imageForm.appendChild(document.createElement(('p')));
            downloadDisclaimer.innerText = 'Note: The download only includes the portion of the transformed image in the bounding box. Therefore, translations won\'t show up in the the download.';
            downloadDisclaimer.id = 'downloadDisclaimer';
        }
    };
}
