import { Logger } from "./logger.mjs";

export class HTML5TableLogger extends Logger {
    /**
     * 
     * @param {string[]} columns
     * @param {Record<string, string>=} labels
     */
    constructor(columns, labels) {
        super();
        this._columns = columns;
        this._labels = labels ?? {};
        this._element = document.createElement('table');
        this._setupHeader();
        this._body = document.createElement('tbody');
        this._element.appendChild(this._body);
    }

    _setupHeader() {
        const header = document.createElement('thead');
        const headerRow = document.createElement('tr');
        this._columns.forEach(c => {
            const headerCell = document.createElement('th');
            headerCell.innerText = this._labels[c] ?? c;
            headerRow.appendChild(headerCell);
        });
        header.appendChild(headerRow);
        this._element.appendChild(header);
    }

    /**
     * 
     * @param {Record<string, unknown>} result
     */
    log(result) {
        const tableRow = document.createElement('tr');
        this._columns.forEach(c => {
            const tableCell = document.createElement('th');
            let value = result[c];
            if (typeof value === 'number') {
                value = Math.round(value * 100) / 100;
            }
            tableCell.innerText = value;
            tableRow.appendChild(tableCell);
        });
        this._body.appendChild(tableRow);
    }
    
    /**
     * @returns {HTMLTableElement}
     */
    get element () {
        return this._element;
    }
 }
