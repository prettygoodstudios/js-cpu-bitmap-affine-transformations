import { Logger } from "./logger.mjs";

export class SVGLineChartLogger extends Logger {
    /**
     * 
     * @param {string} seriesValue 
     * @param {string} value
     * @param {[number, number]} range
     * @param {{seriesValue?: string, value?: string}=} labels
     */
    constructor(seriesValue, value, range, labels) {
        super();
        this._labels = labels ?? {};
        this._seriesValue = seriesValue;
        this._value = value;
        // this._range = range;
        this._margin = 70;
        this._width = 1000;
        this._height = 500;
        this._points = 0;
        /** @type {Record<string, unknown>[]} */
        this._data = [];
        this._render();
    }

    _range() {
        if (this._data.length === 0) {
            return [0, 100];
        }
        const values = this._data.map(d => d[this._value]);
        return [0, Math.ceil(Math.max(...values) / 10) * 10];
    }

    /**
     * 
     * @param {number} value
     * @returns {number} 
     */
    _yScale(value) {
        const pixels = this._height - this._margin * 2;
        const [start, end] = this._range();
        return this._height - this._margin - (value - start) / (end - start) * pixels;
    }

    _setupLine() {
        this._lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this._line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this._line.setAttribute('stroke', '#00f');
        this._line.setAttribute('fill', 'none');
        this._lineGroup.appendChild(this._line);
        this._element.appendChild(this._lineGroup);
    }

    _setupYAxis() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const ticks = 5;
        const [start, end] = this._range();
        for (let tick = 0; tick <= ticks; tick++) {
            const value = (end - start) / ticks * tick;
            const y = this._yScale(value);
            const tickLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            tickLabel.setAttribute('x', this._margin - 40);
            tickLabel.setAttribute('y', y);
            tickLabel.textContent = value;
            tickLabel.setAttribute('stroke', '#000');
            tickLabel.setAttribute('alignment-baseline', 'middle');
            group.appendChild(tickLabel);
            const tickNode = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            tickNode.setAttribute('d', `
                M ${this._margin - 5}, ${y}
                L ${this._margin}, ${y}
            `);
            tickNode.setAttribute('stroke', '#000');
            group.appendChild(tickNode);
        }
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('d', `
            M ${this._margin}, ${this._margin}
            L ${this._margin}, ${this._height - this._margin}
        `);
        line.setAttribute('stroke', '#000');
        group.appendChild(line);
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const labelPosition = this._margin - 55;
        label.setAttribute('x', labelPosition);
        label.setAttribute('y', this._height / 2);
        label.textContent = this._labels.value ?? this._value;
        label.setAttribute('stroke', '#000');
        label.setAttribute('alignment-baseline', 'middle');
        label.setAttribute('visibility', 'hidden');
        group.appendChild(label);
        this._element.appendChild(group);
        setTimeout(() => {
            label.setAttribute('transform-origin', `${labelPosition} ${this._height / 2}`);
            const textBBox = label.getBBox();
            label.setAttribute('transform', `translate(0, ${textBBox.width / 2}) rotate(270)`);
            label.setAttribute('visibility', 'visible');
        });
    }

    _setupXAxis() {
        this._xAxisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('d', `
            M ${this._margin}, ${this._height - this._margin}
            L ${this._width - this._margin}, ${this._height - this._margin}
        `);
        line.setAttribute('stroke', '#000');
        this._xAxisGroup.appendChild(line);
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', this._width / 2);
        label.setAttribute('y', this._height - this._margin + 40);
        label.textContent = this._labels.seriesValue ?? this._seriesValue;
        label.setAttribute('stroke', '#000');
        label.setAttribute('text-anchor', 'middle');
        this._xAxisGroup.appendChild(label);
        this._element.appendChild(this._xAxisGroup);
    }

    /**
     * 
     * @param {Record<string, unknown>} result 
     * @param {number} index
     */
    _drawPoint(result, index) {
        const seriesValue = (Math.round(result[this._seriesValue] * 100) / 100).toFixed(1);
        const value = result[this._value];
        const y = this._yScale(value);
        const columnWidth = (this._width - this._margin * 2) / (this._data.length + 1);
        const x = (index + 1) * columnWidth + this._margin;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', this._height - this._margin + 20);
        text.textContent = seriesValue;
        text.setAttribute('stroke', '#000');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('width', columnWidth);
        this._xAxisGroup.appendChild(text);

        const path = this._line.getAttribute('d');
        if (!path) {
            this._line.setAttribute('d', `M ${x}, ${y}`);
        } else {
            this._line.setAttribute('d', path + `\nL ${x}, ${y}`);
        }
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', 4);
        circle.setAttribute('fill', '#00f');
        this._element.appendChild(circle);
    }

    _render() {
        const oldElement = this._element;
        this._element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this._element.setAttribute('width', this._width);
        this._element.setAttribute('height', this._height);
        this._setupYAxis();
        this._setupXAxis();
        this._setupLine();
        this._data.forEach(this._drawPoint.bind(this));
        if (oldElement) {
            oldElement.replaceWith(this._element);
        }
    }

    /**
     * 
     * @param {Record<string, unknown>} result
     */
    log(result) {
        this._data.push(result);
        this._render();
    }
    
    /**
     * @returns {HTMLTableElement}
     */
    get element () {
        return this._element;
    }
 }