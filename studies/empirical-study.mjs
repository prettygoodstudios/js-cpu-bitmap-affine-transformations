import { CSVLogger } from "./csv-logger.mjs";
import { HTML5TableLogger } from "./html5-table-logger.mjs";
import { SVGLineChartLogger } from "./svg-line-chart-logger.mjs";
import { Logger } from "./logger.mjs";

function setupEditor() {
    /**
     * @type {HTMLInputElement}
     */
    const scaleFactorMaxInput = document.querySelector('#scaleFactorMax');
    /**
     * @type {HTMLInputElement}
     */
    const scaleFactorDeltaInput = document.querySelector('#scaleFactorDelta');
    /**
     * @type {HTMLInputElement}
     */
    const runsInput = document.querySelector('#runs');
    /**
     * @type {HTMLFormElement}
     */
    const form = document.querySelector('#empiricalStudyForm');
    form.onsubmit = (e) => {
        e.preventDefault();
        const scaleFactorMax = parseFloat(scaleFactorMaxInput.value);
        const scaleFactorDelta = parseFloat(scaleFactorDeltaInput.value);
        const runs = parseInt(runsInput.value);
        form.inert = true;
        form.style.opacity = 0.2;
        const { terminate } = runStudy(scaleFactorMax, scaleFactorDelta, runs);
        /**
         * @type {HTMLButtonElement}
         */
        const stopButton = document.querySelector('#empiricalStudyStopButton');
        stopButton.onclick = () => {
            terminate();
            form.inert = false;
            form.style.opacity = 1;
            stopButton.style.display = 'none';
        }
        stopButton.style.display = 'block';
    };
}

/**
 * 
 * @param {number} scaleFactorMax 
 * @param {number} scaleFactorDelta 
 * @param {number} runs
 * @returns {{
 *  terminate: () => void;
 * }}
 */
function runStudy(scaleFactorMax, scaleFactorDelta, runs) {
    const csvLogger = new CSVLogger(['scaleFactor', 'totalTimeInMs', 'averageTimeInMs']);
    const htmlTableLogger = new HTML5TableLogger(['scaleFactor', 'totalTimeInMs', 'averageTimeInMs'], { scaleFactor: 'Scale Factor', totalTimeInMs: 'Total Time (ms)', averageTimeInMs: 'Average Time (ms)'});
    const lineChartLogger = new SVGLineChartLogger('scaleFactor', 'averageTimeInMs', [0, 1000], { value: 'Average Time (ms)', seriesValue: 'Scale Factor' });
    const lineChartContainer = document.querySelector('#empiricalStudyLineChart');
    const tableContainer = document.querySelector('#empiricalStudyTable');
    lineChartContainer.replaceChildren(lineChartLogger.element);
    tableContainer.replaceChildren(htmlTableLogger.element);
    /** @type {Logger[]} */
    const loggers = [csvLogger, htmlTableLogger, lineChartLogger];
    /**
     * @type {Worker[]}
     */
    const workers = [];
    for (let scaleFactor = scaleFactorDelta; scaleFactor <= scaleFactorMax + Number.EPSILON; scaleFactor += scaleFactorDelta) {
        const worker = new Worker('./studies/study-worker.mjs', {type: 'module'});
        const currentScaleFactor = scaleFactor;
        worker.onmessage = (e) => {
            loggers.forEach(l => l.log({
                scaleFactor: currentScaleFactor,
                totalTimeInMs: e.data,
                averageTimeInMs: e.data / runs,
            }));
        }
        worker.postMessage({ scaleFactor, runs });
        workers.push(worker);
    }
    return {
        terminate: () => workers.forEach(w => w.terminate()),
    }
}

function main() {
    setupEditor();
}

window.onload = () => {
    main();
}
