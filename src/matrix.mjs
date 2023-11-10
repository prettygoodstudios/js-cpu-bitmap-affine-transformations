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
     * Performs Gauss Jordan Elimination on a linear system.
     * The matrix is the left hand side of the system.
     * Doesn't mutate matrix or right hand side.
     * @param {Matrix} rightHandSide 
     * @returns {{
     *  leftHandSide: Matrix;
     *  rightHandSide: Matrix;
     * }}
     */
    gje(rightHandSide) {
        rightHandSide = rightHandSide.copy();
        const leftHandSide = this.copy();
        if (leftHandSide.rows !== rightHandSide.rows) {
            throw Error('Invalid linear system.');
        }
        // put left matrix into row echelon
        for (let i = 0; i < Math.min(leftHandSide.rows, leftHandSide.cols); i++) {
            let scaleFactor = leftHandSide.get(i, i);
            // We need to perform a row swap
            if (Math.abs(scaleFactor) < Number.EPSILON) {
                // Finding row to swap
                let swap;
                for (let r = i; r < leftHandSide.rows; r++) {
                    if (Math.abs(leftHandSide.get(i, r)) >= Number.EPSILON) {
                        swap = r;
                        break;
                    }
                }
                if (swap === undefined) {
                    throw Error('The matrix is singular. There is not a unique solution to the system.');
                }
                for (let c = 0; c < leftHandSide.cols; c++) {
                    const myValue = leftHandSide.get(c, i);
                    leftHandSide.set(c, i, leftHandSide.get(c, swap));
                    leftHandSide.set(c, swap, myValue);
                }
                for (let c = 0; c < rightHandSide.cols; c++) {
                    const rightHandSideMyValue = rightHandSide.get(c, i);
                    rightHandSide.set(c, i, rightHandSide.get(c, swap));
                    rightHandSide.set(c, swap, rightHandSideMyValue);
                }
                scaleFactor = leftHandSide.get(i, i);
            }

            for (let c = 0; c < leftHandSide.cols; c++) {
                leftHandSide.set(c, i, leftHandSide.get(c, i) / scaleFactor);
            }
            for (let c = 0; c < rightHandSide.cols; c++) {
                rightHandSide.set(c, i, rightHandSide.get(c, i) / scaleFactor);
            }
            if (i === leftHandSide.rows - 1) {
                continue;
            }
            for (let j = i+1; j < leftHandSide.rows; j++) {
                const multiples = leftHandSide.get(i, j);
                for (let c = 0; c < leftHandSide.cols; c++) {
                    const subtract = leftHandSide.get(c, i) * multiples;
                    leftHandSide.set(c, j, leftHandSide.get(c, j) - subtract);
                }
                for (let c = 0; c < rightHandSide.cols; c++) {
                    const subtractRightHandSide = rightHandSide.get(c, i) * multiples;
                    rightHandSide.set(c, j, rightHandSide.get(c, j) - subtractRightHandSide);
                }
            }
        }
        // convert left into reduced row echelon
        for (let i = leftHandSide.rows - 1; i > 0; i--) {
            for (let r = i-1; r >= 0; r--) {
                const multiples = leftHandSide.get(i, r);
                for (let c = 0; c < leftHandSide.cols; c++) {
                    const subtract = leftHandSide.get(c, i) * multiples;
                    leftHandSide.set(c, r, leftHandSide.get(c, r) - subtract);
                }
                for (let c = 0; c < rightHandSide.cols; c++) {
                    const subtractRightHandSide = rightHandSide.get(c, i) * multiples;
                    rightHandSide.set(c, r, rightHandSide.get(c, r) - subtractRightHandSide);
                }
            }
        }
        return {
            leftHandSide,
            rightHandSide,
        }
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
        const { rightHandSide } = this.gje(identity);
        return rightHandSide;
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
