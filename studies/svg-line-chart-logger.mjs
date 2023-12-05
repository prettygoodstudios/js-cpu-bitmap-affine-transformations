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
        this._margin = {
            top: 15,
            right: 0,
            bottom: 70,
            left: 70,
        };
        this._yAxisTickLabelOffset = 5;
        this._yAxisLabelOffset = 15;
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

    _domain() {
        if (this._data.length === 0) {
            return [0, 1];
        }
        if (this._data.length === 1) {
            return [0, this._data[0][this._seriesValue] * 2];
        }
        const inputs = this._data.map(d => d[this._seriesValue]);
        return [0, Math.ceil(Math.max(...inputs) * 10) / 10];
    }

    _computeMaxYAxisWidth() {
        const largestMagnitude = Math.max(...this._range().map(Math.abs));
        const digits = largestMagnitude.toString().length;
        return digits * 10;
    }

    /**
     * 
     * @param {number} value
     * @returns {number} 
     */
    _yScale(value) {
        const pixels = this._height - this._margin.top - this._margin.bottom;
        const [start, end] = this._range();
        return this._height - this._margin.bottom - (value - start) / (end - start) * pixels;
    }

    /**
     * 
     * @param {unknown} seriesValue 
     */
    _xScale(seriesValue) {
        if (typeof seriesValue === 'number') {
            const padding = 20;
            const pixels = this._width - this._margin.left - this._margin.right - padding * 2;
            const [start, end] = this._domain();
            return this._margin.left + padding + (seriesValue - start) / (end - start) * pixels;
        }
        return 0;
    }

    _drawLine() {
        this._lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this._line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this._line.setAttribute('stroke', '#00f');
        this._line.setAttribute('fill', 'none');
        this._lineGroup.appendChild(this._line);
        this._element.appendChild(this._lineGroup);
    }

    _drawYAxis() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const ticks = 5;
        const [start, end] = this._range();
        for (let tick = 0; tick <= ticks; tick++) {
            const value = (end - start) / ticks * tick;
            const y = this._yScale(value);
            const tickLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            tickLabel.setAttribute('x', this._margin.left - this._computeMaxYAxisWidth() - this._yAxisTickLabelOffset);
            tickLabel.setAttribute('y', y);
            tickLabel.textContent = value;
            tickLabel.setAttribute('stroke', '#000');
            tickLabel.setAttribute('alignment-baseline', 'middle');
            group.appendChild(tickLabel);
            const tickNode = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            tickNode.setAttribute('d', `
                M ${this._margin.left - 5}, ${y}
                L ${this._margin.left}, ${y}
            `);
            tickNode.setAttribute('stroke', '#000');
            group.appendChild(tickNode);
            this._drawHorizontalGridLine(y);
        }
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('d', `
            M ${this._margin.left}, ${this._margin.top}
            L ${this._margin.left}, ${this._height - this._margin.bottom}
        `);
        line.setAttribute('stroke', '#000');
        group.appendChild(line);
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const labelPosition = this._margin.left - this._computeMaxYAxisWidth() - this._yAxisTickLabelOffset - this._yAxisLabelOffset;
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

    /**
     * 
     * @param {number} y 
     */
    _drawHorizontalGridLine(y) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('d', `
            M ${this._margin.left}, ${y}
            L ${this._width - this._margin.right}, ${y}
        `);
        line.setAttribute('stroke', '#bbb');
        line.setAttribute('stroke-dasharray', '15, 10, 5, 10');
        this._element.appendChild(line);
    }

    /**
     * 
     * @param {number} x
     */
    _drawVerticalGridLine(x) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('d', `
            M ${x}, ${this._margin.top}
            L ${x}, ${this._height - this._margin.bottom}
        `);
        line.setAttribute('stroke', '#bbb');
        line.setAttribute('stroke-dasharray', '15, 10, 5, 10');
        this._element.appendChild(line);
    }

    /**
     * 
     * @param {number|string} seriesValue 
     */
    _drawXAxisLabel(seriesValue) {
        const x = this._xScale(seriesValue);
        this._drawVerticalGridLine(x);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', this._height - this._margin.bottom + 20);
        text.textContent = Math.round(seriesValue * 100) / 100;
        text.setAttribute('stroke', '#000');
        text.setAttribute('text-anchor', 'middle');
        this._xAxisGroup.appendChild(text);
        this._drawVerticalGridLine(x);
    }

    _drawXAxis() {
        this._xAxisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('d', `
            M ${this._margin.left}, ${this._height - this._margin.bottom}
            L ${this._width - this._margin.right}, ${this._height - this._margin.bottom}
        `);
        line.setAttribute('stroke', '#000');
        this._xAxisGroup.appendChild(line);
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', (this._width - this._margin.right + this._margin.left) / 2);
        label.setAttribute('y', this._height - this._margin.bottom + 40);
        label.textContent = this._labels.seriesValue ?? this._seriesValue;
        label.setAttribute('stroke', '#000');
        label.setAttribute('text-anchor', 'middle');
        this._xAxisGroup.appendChild(label);
        this._element.appendChild(this._xAxisGroup);
        const [start, end] = this._domain();
        const difference = end - start;
        const tickSpacing = (() => {
            if (difference <= 1) {
                return 0.1;
            }
            if (difference <= 2) {
                return 0.2;
            }
            if (difference <= 5) {
                return 0.5;
            }
            if (difference <= 10) {
                return 1;
            }
            if (difference <= 50) {
                return 5;
            }
            if (difference <= 100) {
                return 10;
            }
            if (difference <= 500) {
                return 50;
            }
            return 100;
        })();
        for (let seriesValue = start; seriesValue < end; seriesValue += tickSpacing) {
            this._drawXAxisLabel(seriesValue);
        }
        this._drawXAxisLabel(end);
    }

    /**
     * 
     * @param {Record<string, unknown>} result 
     * @param {number} index
     */
    _drawPoint(result, index) {
        const value = result[this._value];
        const y = this._yScale(value);
        const seriesValue = result[this._seriesValue];
        const x = this._xScale(seriesValue);
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

    _computeLeftMargin() {
        const { left } = this._margin;
        this._margin.left = Math.max(left,  this._computeMaxYAxisWidth() + this._yAxisLabelOffset + this._yAxisTickLabelOffset + 20);
    }

    _render() {
        const oldElement = this._element;
        this._element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this._element.setAttribute('width', this._width);
        this._element.setAttribute('height', this._height);
        this._computeLeftMargin();
        this._drawYAxis();
        this._drawXAxis();
        this._drawLine();
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
        // Should probably use a heap data structure instead to make this op cheaper
        this._data.sort((a, b) => a[this._seriesValue] - b[this._seriesValue]);
        this._render();
    }
    
    /**
     * @returns {HTMLTableElement}
     */
    get element () {
        return this._element;
    }
 }