import { setPixel } from "../src/bitmap.mjs";
import { transform } from "../src/transform.mjs";
import { CSVLogger } from "./csv-logger.mjs";
import { HTML5TableLogger } from "./html5-table-logger.mjs";
import { SVGLineChartLogger } from "./svg-line-chart-logger.mjs";
import { Logger } from "./logger.mjs";

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

 let animationFrameHandle;
 /**
  * 
  * @param {number} scaleFactor 
  * @param {Logger[]} loggers 
  * @param {() => void=} onFinish 
  * @returns 
  */
 function timeRuns(scaleFactor, loggers, onFinish) {
    if (scaleFactor > 5 + Number.EPSILON) {
        cancelAnimationFrame(animationFrameHandle);
        if (onFinish) {
            onFinish();
        }
        return;
    }
    const runs = 20;
    const totalTimeInMs = timeTransform(runs, scaleFactor);
    loggers.forEach(l => l.log({ scaleFactor, totalTimeInMs, averageTimeInMs: totalTimeInMs / runs }));
    animationFrameHandle = requestAnimationFrame(() => timeRuns(scaleFactor + 0.2, loggers, onFinish));
 }

function main() {
    const csvLogger = new CSVLogger(['scaleFactor', 'totalTimeInMs', 'averageTimeInMs']);
    const htmlTableLogger = new HTML5TableLogger(['scaleFactor', 'totalTimeInMs', 'averageTimeInMs'], { scaleFactor: 'Scale Factor', totalTimeInMs: 'Total Time (ms)', averageTimeInMs: 'Average Time (ms)'});
    const lineChartLogger = new SVGLineChartLogger('scaleFactor', 'averageTimeInMs', [0, 1000], { value: 'Average Time (ms)', seriesValue: 'Scale Factor' });
    document.body.appendChild(htmlTableLogger.element);
    document.body.appendChild(lineChartLogger.element);
    /** @type {Logger[]} */
    const loggers = [csvLogger, htmlTableLogger, lineChartLogger];
    timeRuns(0.2, loggers, () => console.log(csvLogger.toString()));
}

window.onload = () => {
    main();
}
