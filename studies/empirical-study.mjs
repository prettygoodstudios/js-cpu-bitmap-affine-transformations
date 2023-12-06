import { CSVLogger } from "./csv-logger.mjs";
import { HTML5TableLogger } from "./html5-table-logger.mjs";
import { SVGLineChartLogger } from "./svg-line-chart-logger.mjs";
import { Logger } from "./logger.mjs";

function setupEditor() {
    /**
     * @type {HTMLInputElement}
     */
    const threadsInput = document.querySelector('#threads');
    threadsInput.max = navigator.hardwareConcurrency;
    threadsInput.value = navigator.hardwareConcurrency;
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
        const threads = parseInt(threadsInput.value);
        form.inert = true;
        form.style.opacity = 0.2;
        const { terminate } = runStudy(scaleFactorMax, scaleFactorDelta, runs, threads);
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
 * @param {number} threads
 * @returns {{
 *  terminate: () => void;
 * }}
 */
function runStudy(scaleFactorMax, scaleFactorDelta, runs, threads) {
    const csvLogger = new CSVLogger(['scaleFactor', 'totalTimeInMs', 'averageTimeInMs']);
    const htmlTableLogger = new HTML5TableLogger(['scaleFactor', 'totalTimeInMs', 'averageTimeInMs'], { scaleFactor: 'Scale Factor', totalTimeInMs: 'Total Time (ms)', averageTimeInMs: 'Average Time (ms)'});
    const lineChartLogger = new SVGLineChartLogger('scaleFactor', 'averageTimeInMs', { value: 'Average Time (ms)', seriesValue: 'Scale Factor' });
    const lineChartContainer = document.querySelector('#empiricalStudyLineChart');
    const tableContainer = document.querySelector('#empiricalStudyTable');
    lineChartContainer.replaceChildren(lineChartLogger.element);
    tableContainer.replaceChildren(htmlTableLogger.element);
    /** @type {Logger[]} */
    const loggers = [csvLogger, htmlTableLogger, lineChartLogger];
    const orchestrator = new Worker('./studies/study-orchestrator.mjs', { type: 'module'});
    orchestrator.postMessage({action: 'start', data: { scaleFactorMax, scaleFactorDelta, runs, threads }});
    orchestrator.onmessage = e => {
        loggers.forEach(l => l.log(e.data));
    }
    return {
        terminate: () => {
            orchestrator.postMessage({ action: 'stop' });
            orchestrator.terminate();
        },
    }
}

function main() {
    setupEditor();
}

window.onload = () => {
    main();
}

