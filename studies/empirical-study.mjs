import { CSVLogger } from "./csv-logger.mjs";
import { HTML5TableLogger } from "./html5-table-logger.mjs";
import { SVGLineChartLogger } from "./svg-line-chart-logger.mjs";
import { Logger } from "./logger.mjs";

function main() {
    const csvLogger = new CSVLogger(['scaleFactor', 'totalTimeInMs', 'averageTimeInMs']);
    const htmlTableLogger = new HTML5TableLogger(['scaleFactor', 'totalTimeInMs', 'averageTimeInMs'], { scaleFactor: 'Scale Factor', totalTimeInMs: 'Total Time (ms)', averageTimeInMs: 'Average Time (ms)'});
    const lineChartLogger = new SVGLineChartLogger('scaleFactor', 'averageTimeInMs', [0, 1000], { value: 'Average Time (ms)', seriesValue: 'Scale Factor' });
    document.body.appendChild(htmlTableLogger.element);
    document.body.appendChild(lineChartLogger.element);
    /** @type {Logger[]} */
    const loggers = [csvLogger, htmlTableLogger, lineChartLogger];
    for (let scaleFactor = 0.2; scaleFactor <= 8 + Number.EPSILON; scaleFactor += 0.2) {
        const worker = new Worker('./studies/study-worker.mjs', {type: 'module'});
        const runs = 100;
        const currentScaleFactor = scaleFactor;
        worker.onmessage = (e) => {
            loggers.forEach(l => l.log({
                scaleFactor: currentScaleFactor,
                totalTimeInMs: e.data,
                averageTimeInMs: e.data / runs,
            }));
        }
        worker.postMessage({ scaleFactor, runs });
    }
}

window.onload = () => {
    main();
}
