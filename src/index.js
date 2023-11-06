import { getBitmap } from "./bitmap.js";
import { animateImageData } from "./animation.js";

async function main() {
    const imageData = await getBitmap('#src');
    animateImageData(imageData, 0, Date.now());
}

window.onload = () => {
    main();
}
