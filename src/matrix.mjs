import { AugmentedMatrix } from "./augmented-matrix.mjs";

export class Matrix {
    /**
     * 
     * @param {number} rows
     * @param {number} cols
     * @param {Float32Array} data
     * @param {number} dataRowSize
     * @param {number} rowOffset
     * @param {number} colOffset
     */
    constructor(rows, cols, data = undefined, dataRowSize = undefined, rowOffset = 0, colOffset = 0) {
        this._rows = rows;
        this._cols = cols;
        if (!data) {
            data = new Float32Array(rows * cols);
        }
        if (!dataRowSize) {
            dataRowSize = cols;
        }
        this._dataRowSize = dataRowSize;
        this._rowOffset = rowOffset;
        this._colOffset = colOffset;
        this._data = data;
    }

    /**
     * 
     * @param {number} col
     * @param {number} row 
     * @throws {RangeError}
     */
    _checkBounds(col, row) {
        if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) {
            throw RangeError(`(${col},${row}) is out of range for ${this}`);
        }
    }

    /**
     * 
     * @param {number} col 
     * @param {number} row 
     */
    _computeDataIndex(col, row) {
        return this._dataRowSize * (row + this._rowOffset) + col + this._colOffset;
    }

    /**
     *
     * @param {number} col 
     * @param {number} row 
     * @returns {number}
     */
    get(col, row) {
        this._checkBounds(col, row);
        return this._data[this._computeDataIndex(col, row)];
    }

    /**
     * 
     * @param {number} col 
     * @param {number} row 
     * @param {number} value
     * 
     */
    set(col, row, value) {
        this._checkBounds(col, row);
        this._data[this._computeDataIndex(col, row)] = value;
    }

    /**
     * 
     * @param {number|Matrix} other
     * @param {Matrix=} outputMatrix
     * @return {Matrix}
     */
    multiply(other, outputMatrix) {
        if (typeof other === 'number') {
            const output = outputMatrix ?? new Matrix(this.rows, this.cols);
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    output.set(col, row, this.get(col, row) * other);
                }
            }
            return output;
        }
        if (!(other instanceof Matrix)) {
            throw Error('Can only multiply by matrix.');
        }
        if (other.rows !== this.cols) {
            throw Error(`The left matrices number of columns must equal the right's number of rows`);
        }
        if (outputMatrix && (outputMatrix.rows !== this.rows || outputMatrix.cols !== other.cols)) {
            throw Error('A output matrix with invalid dimensions was provided.');
        }
        const output = outputMatrix ?? new Matrix(this.rows, other.cols);
        for (let row = 0; row < output.rows; row++) {
            for (let col = 0; col < output.cols; col++) {
                const myRow = this.slice(0, this.cols, row, row+1);
                const otherCol = other.slice(col, col+1, 0, other.rows);
                output.set(col, row, myRow.dot(otherCol));
            }
        }
        return output;
    }

    /**
     * 
     * @param {number|Matrix} other
     * @param {Matrix=} outputMatrix
     * @return {Matrix}
     */
    add(other, outputMatrix) {
        if (outputMatrix && (outputMatrix.rows !== this.rows || outputMatrix.cols !== this.cols)) {
            throw Error('Output matrix provided with the wrong dimensions.');
        }
        const output = outputMatrix ?? new Matrix(this.rows, this.cols);
        if (typeof other === 'number') {
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    output.set(col, row, this.get(col, row) + other);
                }
            }
            return output;
        }
        if (!(other instanceof Matrix)) {
            throw Error('Can only add a number or matrix.');
        }
        if (other.rows !== this.rows || other.cols !== this.cols) {
            throw Error(`The matrices must have the same dimensions`);
        }
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                output.set(col, row, this.get(col, row) + other.get(col, row));
            }
        }
        return output;
    }

    /**
     * Assumes data from other matrix
     * @param {Matrix} other
     */
    assume(other) {
        if (other.cols !== this.cols || other.rows !== this.rows) {
            throw Error('Can only assume data from matrix with same dimensions.');
        }
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.set(col, row, other.get(col, row));
            }
        }
    }

    /**
     * 
     * @param {number} rowIndexOne 
     * @param {number} rowIndexTwo 
     */
    rowSwap(rowIndexOne, rowIndexTwo) {
        const rowOne = this.slice(0, this.cols+1, rowIndexOne, rowIndexOne+1);
        const rowOneCopy = rowOne.copy();
        const rowTwo = this.slice(0, this.cols+1, rowIndexTwo, rowIndexTwo+1);
        rowOne.assume(rowTwo);
        rowTwo.assume(rowOneCopy);
    }

    /**
     * Returns a view of a sub matrix.
     * IT'S NOT A COPY! mutations to the view will mutate the matrix.
     * This is intentional as it allows for easily performing elementary row operations on linear systems
     * @param {number} colStart
     * @param {number} colEnd
     * @param {number} rowStart
     * @param {number} rowEnd
     * @returns {Matrix}
     */
    slice(colStart, colEnd, rowStart, rowEnd) {
        return new Matrix(rowEnd - rowStart, colEnd - colStart, this._data, this._dataRowSize, rowStart, colStart);
    }

    /**
     * 
     * @param {Matrix} vector
     * @return {number}
     */
    dot(vector) {
        /** @type {number|undefined} */
        let myDimensions;
        /** @type {(i: number) => number|undefined} */
        let getMyValue;
        /** @type {number|undefined} */
        let vectorDimensions;
        /** @type {(i: number) => number|undefined} */
        let getVectorValue;
        if (this.cols === 1) {
            myDimensions = this.rows;
            getMyValue = i => this.get(0, i);
        } 
        if (this.rows === 1) {
            myDimensions = this.cols;
            getMyValue = i => this.get(i, 0);
        }
        if (vector.cols === 1) {
            vectorDimensions = vector.rows;
            getVectorValue = i => vector.get(0, i);
        }
        if (vector.rows === 1) {
            vectorDimensions = vector.cols;
            getVectorValue = i => vector.get(i, 0);
        }
        if (vectorDimensions === undefined || myDimensions === undefined || vectorDimensions !== myDimensions) {
            throw Error('Invalid matrices provided for dot product');
        }
        let dotProduct = 0;
        for (let i = 0; i < myDimensions; i++) {
            dotProduct += getMyValue(i) * getVectorValue(i);
        }
        return dotProduct;
    }

    /**
     * Finds the index of the first row with a pivot
     * @param {number} column 
     * @return {number|undefined} index if found otherwise undefined
     */
    findFirstRowWithPivot(column) {
        for (let row = column; row < this.rows; row++) {
            if (Math.abs(this.get(column, row)) >= Number.EPSILON) {
                return row;
            }
        }
    }

    det() {
        if (this.rows !== this.cols) {
            throw Error('Can only compute the determinant of a square matrix');
        }
        const augmentedMatrix = new AugmentedMatrix(this.copy());
        const { leftHandSide, scaledDown } = augmentedMatrix.gje();
        let determinant = 1;
        for (let i = 0; i < this.rows; i++) {
            determinant *= leftHandSide.get(i, i);
        }
        return determinant * scaledDown;
    }

    /**
     * 
     * @returns {Matrix}
     */
    inverse() {
        if (this.rows !== this.cols) {
            throw Error('Can only compute inverse of a square matrix');
        }
        const augmentedMatrix = new AugmentedMatrix(this.copy(), Matrix.identity(this.rows));
        const { rightHandSide } = augmentedMatrix.gje();
        return rightHandSide;
    }

    copy() {
        return new Matrix(this.rows, this.cols, new Float32Array(this._data), this._dataRowSize, this._rowOffset, this._colOffset);
    }

    toString() {
        let matrixBody = '';
        for (let row = 0; row < this.rows; row++) {
            matrixBody += '\t';
            for (let col = 0; col < this.cols; col++) {
                if (col !== 0) {
                    matrixBody += ', ';
                }
                matrixBody += this.get(col, row);
            }
            matrixBody += '\n';
        }
        return `Matrix(rows: ${this.rows}, cols:${this.cols}) {\n${matrixBody}}`;
    }

    /**
     * @returns {number}
     */
    get rows() {
        return this._rows;
    }

    /**
     * @returns {number}
     */
    get cols() {
        return this._cols;
    }

    /**
     * @param {number} size 
     * @returns {Matrix}
     */
    static identity(size) {
        const identity = new Matrix(size, size);
        for (let i = 0; i < size; i++) {
            identity.set(i, i, 1);
        }
        return identity;
    } 
}
