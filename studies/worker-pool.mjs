
export class WorkerPool {
    /**
     * 
     * @param {(() => Worker)[]} workers 
     * @param {number} threads 
     */
    constructor(workers, threads) {
        this._workers = workers;
        this._threads = threads;
        this._position = 0;
    }

    init() {
        this.__spawnWorker();
    }

    __spawnWorker() {
        if (this._threads > 0 && this._position < this._workers.length) {
            this._threads--;
            const worker = this._workers[this._position++]();
            worker.addEventListener('message', () => {
                worker.terminate();
                this._threads++;
                this.__spawnWorker();
            });
            this.__spawnWorker();
        } 
    }

    terminate() {
        this._workers.forEach(({worker}) => worker.terminate());
        this._workers = [];
    }
}
