import { WorkerPool } from "./worker-pool.mjs";

/**
 * 
 * @param {number} scaleFactorMax 
 * @param {number} scaleFactorDelta 
 * @param {number} runs
 * @param {threads} thread
 * @returns {WorkerPool}
*/
function runStudy(scaleFactorMax, scaleFactorDelta, runs, threads) {
   /**
    * @type {(() => Worker)[]}
    */
   const workers = [];
   for (let scaleFactor = scaleFactorDelta; scaleFactor <= scaleFactorMax + Number.EPSILON; scaleFactor += scaleFactorDelta) {
       const currentScaleFactor = scaleFactor;
       workers.push(() => {
            const worker = new Worker('/studies/study-worker.mjs', {type: 'module'});
            worker.addEventListener('message', (e) => {
                postMessage({
                    scaleFactor: currentScaleFactor,
                    totalTimeInMs: e.data,
                    averageTimeInMs: e.data / runs,
                });
            });
            worker.postMessage({ scaleFactor: currentScaleFactor, runs });
            return worker;
       });
   }
   const workerPool = new WorkerPool(workers, threads);
   return workerPool;
}

/**
 * @type {WorkerPool|undefined}
 */
let workerPool;

/**
 * 
 * @param {string} action 
 * @param {unknown} data 
 */
function dispatch(action, data) {
    if (action === 'start') {
        const { scaleFactorMax, scaleFactorDelta, runs, threads } = data;
        workerPool = runStudy(scaleFactorMax, scaleFactorDelta, runs, threads);
        workerPool.init();
        return;
    }
    if (action === 'stop') {
        if (workerPool) {
            workerPool.terminate();
        }
        return;
    }
    throw Error('Unsupported Action!');
}


function main() {
    self.addEventListener('message', (e) => {
        const { action, data } = e.data;
        dispatch(action, data);
    });
}

main();
