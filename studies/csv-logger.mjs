import { Logger } from "./logger.mjs";

export class CSVLogger extends Logger {
    /**
     * 
     * @param {string[]} columns 
     */
    constructor(columns) {
        super();
        this._columns = columns;
        /** @type {Array<Record<string, unknown>>} */
        this._data = [];
    }

    /**
     * 
     * @param {Record<string, unknown>} result 
     */
    log(result) {
        this._data.push(result);
    }

    toString() {
        const header = this._columns.join(', ');
        const body = this._data.map((row) => {
            const cells = this._columns.map(c => row[c]);
            return cells.join(', ');
        }).join('\n');
        return `${header}\n${body}`;
    }
 }