import { Logger } from "./logger.mjs";

/**
 * 
 * @param {SVGElement} element 
 * @param {Record<string, string>} attributes 
 */
const setSvgAttributes = (element, attributes) => {
    const properties = ['textContent'];
    for (const [attribute, value] of Object.entries(attributes)) {
        if (properties.includes(attribute)) {
            element[attribute] = value;
            continue;
        }
        element.setAttribute(attribute, value);
    }
}

/**
 * 
 * @param {string} tag 
 * @param {Record<string, string>=} attributes
 * @returns {SVGElement}
 */
const createSvgElement = (tag, attributes = {}) => {
    /** @type {SVGElement} */
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    setSvgAttributes(element, attributes);
    return element;
}

export class SVGLineChartLogger extends Logger {
    /**
     * 
     * @param {string} seriesValue 
     * @param {string} value
     * @param {{seriesValue?: string, value?: string}=} labels
     */
    constructor(seriesValue, value, labels) {
        super();
        this._labels = labels ?? {};
        this._seriesValue = seriesValue;
        this._value = value;
        this._margin = {
            top: 15,
            right: 0,
            bottom: 27,
            left: 0,
        };
        this._axisColor = '#000';
        this._seriesColor = '#00f';
        this._gridColor = '#bbb';
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
        const tickSpacing = this._tickSpacing(Math.max(...values));
        return [0, Math.ceil(Math.max(...values) / tickSpacing) * tickSpacing];
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
        this._lineGroup = createSvgElement('g');
        this._line = createSvgElement('path', {
            stroke: this._seriesColor,
            fill: 'none',
        });
        this._lineGroup.appendChild(this._line);
        this._element.appendChild(this._lineGroup);
    }

    /**
     * @param {SVGElement} group
     * @param {number} value 
     */
    _drawYAxisTick(group, value) {
        const y = this._yScale(value);
        const tickLabel = createSvgElement('text', {
            x: this._margin.left - this._computeMaxYAxisWidth() - this._yAxisTickLabelOffset,
            y,
            textContent: value,
            stroke: this._axisColor,
            'alignment-baseline': 'middle',
        });
        group.appendChild(tickLabel);
        const tickNode = createSvgElement('path', {
            d: `
            M ${this._margin.left - 5}, ${y}
            L ${this._margin.left}, ${y}
            `,
            stroke: this._axisColor,
        });
        group.appendChild(tickNode);
        this._drawHorizontalGridLine(y);
    }

    _drawYAxis() {
        const group = createSvgElement('g');
        const [,end] = this._range();
        const tickSpacing = this._tickSpacing(end);
        for (let value = 0; value < end; value += tickSpacing) {
            this._drawYAxisTick(group, value);
        }
        this._drawYAxisTick(group, end);
        const line = createSvgElement('path', {
            'd': `
            M ${this._margin.left}, ${this._margin.top}
            L ${this._margin.left}, ${this._height - this._margin.bottom}`,
            stroke: this._axisColor,
        });
        group.appendChild(line);
        const labelXPosition = this._margin.left - this._computeMaxYAxisWidth() - this._yAxisTickLabelOffset - this._yAxisLabelOffset;
        const label = createSvgElement('text', {
            x: labelXPosition,
            y: this._height / 2,
            textContent: this._labels.value ?? this._value,
            stroke: this._axisColor,
            'alignment-baseline': 'middle',
            visibility: 'hidden',
        });
        group.appendChild(label);
        this._element.appendChild(group);
        setTimeout(() => {
            const textBBox = label.getBBox();
            setSvgAttributes(label, {
                'transform-origin': `${labelXPosition} ${this._height / 2}`,
                transform: `translate(0, ${textBBox.width / 2}) rotate(270)`,
                visibility: 'visible',
            });
        });
    }

    /**
     * 
     * @param {number} y 
     */
    _drawHorizontalGridLine(y) {
        const line = createSvgElement('path', {
            d: `
            M ${this._margin.left}, ${y}
            L ${this._width - this._margin.right}, ${y}`,
            stroke: this._gridColor,
            'stroke-dasharray': '15, 10, 5, 10',
        });
        this._element.appendChild(line);
    }

    /**
     * 
     * @param {number} x
     */
    _drawVerticalGridLine(x) {
        const line = createSvgElement('path', {
            d: `
            M ${x}, ${this._margin.top}
            L ${x}, ${this._height - this._margin.bottom}`,
            stroke: this._gridColor,
            'stroke-dasharray': '15, 10, 5, 10',
        })
        this._element.appendChild(line);
    }

    /**
     * 
     * @param {number|string} seriesValue 
     */
    _drawXAxisLabel(seriesValue) {
        const x = this._xScale(seriesValue);
        this._drawVerticalGridLine(x);
        const text = createSvgElement('text', {
            x,
            y: this._height - this._margin.bottom + 20,
            textContent: Math.round(seriesValue * 100) / 100,
            stroke: this._axisColor,
            'text-anchor': 'middle',
        });
        this._xAxisGroup.appendChild(text);
        this._drawVerticalGridLine(x);
    }

    /**
     * 
     * @param {number} difference 
     */
    _tickSpacing(difference) {
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
        if (difference <= 1000) {
            return 100;
        }
        if (difference <= 2000) {
            return 500;
        }
        if (difference <= 10000) {
            return 1000;
        }
        if (difference <= 40000) {
            return 5000;
        }
        return 10000;
    }

    _drawXAxis() {
        this._xAxisGroup = createSvgElement('g');
        const line = createSvgElement('path', {
            d: `
            M ${this._margin.left}, ${this._height - this._margin.bottom}
            L ${this._width - this._margin.right}, ${this._height - this._margin.bottom}`,
            stroke: this._axisColor,

        });
        this._xAxisGroup.appendChild(line);
        const label = createSvgElement('text', {
            x: this._width + (this._width - this._margin.right + this._margin.left) / 2,
            y: this._height - this._margin.bottom + 40,
            textContent: this._labels.seriesValue ?? this._seriesValue,
            stroke: this._axisColor,
            'text-anchor': 'middle',
        });
        this._xAxisGroup.appendChild(label);
        this._element.appendChild(this._xAxisGroup);
        const [start, end] = this._domain();
        const difference = end - start;
        const tickSpacing = this._tickSpacing(difference);
        for (let seriesValue = start; seriesValue < end; seriesValue += tickSpacing) {
            this._drawXAxisLabel(seriesValue);
        }
        this._drawXAxisLabel(end);
    }

    /**
     * 
     * @param {Record<string, unknown>} result 
     */
    _drawPoint(result) {
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
        const circle = createSvgElement('circle', {
            cx: x,
            cy: y,
            r: 4,
            fill: this._seriesColor,
        });
        this._element.appendChild(circle);
    }

    _computeLeftMargin() {
        const { left } = this._margin;
        this._margin.left = Math.max(left,  this._computeMaxYAxisWidth() + this._yAxisLabelOffset + this._yAxisTickLabelOffset + 20);
    }

    _render() {
        const oldElement = this._element;
        this._element = createSvgElement('svg', {
            width: this._width,
            height: this._height,
        });
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
