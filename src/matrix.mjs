export class Matrix {
    /**
     * 
     * @param {number} rows
     * @param {number} cols
     * @param {Float32Array} data
     * @param {number} dataRowSize
     * @param {rowOffset} rowOffset
     * @param {colOffset} colOffset
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
     * @returns {number}
     */
    set(col, row, value) {
        this._checkBounds(col, row);
        this._data[this._computeDataIndex(col, row)] = value;
    }

    /**
     * 
     * @param {Matrix} other
     * @return {Matrix}
     */
    multiply(other) {
        if (other.rows !== this.cols) {
            throw Error(`The left matrices number of columns must equal the right's number of rows`);
        }
        const output = new Matrix(this.rows, other.cols);
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
        let myDimensions;
        let getMyValue;
        let vectorDimensions;
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
     * 
     * @returns {Matrix}
     */
    inverse() {
        if (this.rows !== this.cols) {
            throw Error('Can only compute inverse of a square matrix');
        }
        const identity = new Matrix(this.rows, this.rows);
        for (let i = 0; i < this.rows; i++) {
            identity.set(i, i, 1);
        }
        const clone = this.copy();
        // put left matrix into reduced row echelon
        for (let i = 0; i < this.rows; i++) {
            let scaleFactor = clone.get(i, i);
            // We need to perform a row swap
            if (Math.abs(scaleFactor) < Number.EPSILON) {
                let swap;
                for (let r = i; r < this.rows; r++) {
                    if (Math.abs(clone.get(i, r)) >= Number.EPSILON) {
                        swap = r;
                        break;
                    }
                }
                if (swap === undefined) {
                    throw Error(`Can't compute inverse of singular matrix`);
                }
                for (let c = 0; c < this.rows; c++) {
                    const myValue = clone.get(c, i);
                    const identityMyValue = identity.get(c, i);
                    clone.set(c, i, clone.get(c, swap));
                    clone.set(c, swap, myValue);
                    identity.set(c, i, identity.get(c, swap));
                    identity.set(c, swap, identityMyValue);
                }
                scaleFactor = clone.get(i, i);
            }

            for (let c = 0; c < this.rows; c++) {
                clone.set(c, i, clone.get(c, i) / scaleFactor);
                identity.set(c, i, identity.get(c, i) / scaleFactor);
            }
            if (i === this.rows - 1) {
                continue;
            }
            for (let j = i+1; j < this.rows; j++) {
                const multiples = clone.get(i, j);
                for (let c = 0; c < this.rows; c++) {
                    const subtract = clone.get(c, i) * multiples;
                    const subtractIdentity = identity.get(c, i) * multiples;
                    clone.set(c, j, clone.get(c, j) - subtract);
                    identity.set(c, j, identity.get(c, j) - subtractIdentity);
                }
            }
        }
        // convert left matrix into an identity matrix
        for (let i = this.rows - 1; i > 0; i--) {
            for (let r = i-1; r >= 0; r--) {
                const multiples = clone.get(i, r);
                for (let c = 0; c < this.rows; c++) {
                    const subtract = clone.get(c, i) * multiples;
                    const subtractIdentity = identity.get(c, i) * multiples;
                    clone.set(c, r, clone.get(c, r) - subtract);
                    identity.set(c, r, identity.get(c, r) - subtractIdentity);
                }
            }
        }
        
        return identity;
    }

    copy() {
        return new Matrix(this.rows, this.cols, new Float32Array(this._data));
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
}