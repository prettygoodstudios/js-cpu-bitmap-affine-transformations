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
     * @param {number|Matrix} other
     * @return {Matrix}
     */
    multiply(other) {
        if (typeof other === 'number') {
            const output = new Matrix(this.rows, this.cols);
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    output.set(col, row, this.get(col, row) * other);
                }
            }
            return output;
        }
        if (!other instanceof Matrix) {
            throw Error('Can only multiply by matrix.');
        }
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
     * @param {number|Matrix} other
     * @return {Matrix}
     */
    add(other) {
        const output = new Matrix(this.rows, this.cols);
        if (typeof other === 'number') {
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    output.set(col, row, this.get(col, row) + other);
                }
            }
            return output;
        }
        if (!other instanceof Matrix) {
            throw Error('Can only multiply by matrix.');
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
        for (let row = 0; row < Math.min(leftHandSide.rows, leftHandSide.cols); row++) {
            let scaleFactor = leftHandSide.get(row, row);
            // We need to perform a row swap
            if (Math.abs(scaleFactor) < Number.EPSILON) {
                // Finding row to swap
                let swap;
                for (let r = row; r < leftHandSide.rows; r++) {
                    if (Math.abs(leftHandSide.get(row, r)) >= Number.EPSILON) {
                        swap = r;
                        break;
                    }
                }
                if (swap === undefined) {
                    throw Error('The matrix is singular. There is not a unique solution to the system.');
                }
                leftHandSide.rowSwap(row, swap);
                rightHandSide.rowSwap(row, swap);
                scaleFactor = leftHandSide.get(row, row);
            }

            const leftHandRow = leftHandSide.slice(0, leftHandSide.cols, row, row+1);
            leftHandRow.assume(leftHandRow.multiply(1 / scaleFactor ));
            const rightHandRow = rightHandSide.slice(0, rightHandSide.cols, row, row+1);
            rightHandRow.assume(rightHandRow.multiply(1 / scaleFactor ));

            if (row === leftHandSide.rows - 1) {
                continue;
            }
            for (let bottomRow = row+1; bottomRow < leftHandSide.rows; bottomRow++) {
                const multiples = leftHandSide.get(row, bottomRow);
                const leftHandBottomRow = leftHandSide.slice(0, leftHandSide.cols, bottomRow, bottomRow+1);
                leftHandBottomRow.assume(leftHandBottomRow.add(leftHandRow.multiply(-multiples)));
                const rightHandBottomRow = rightHandSide.slice(0, rightHandSide.cols, bottomRow, bottomRow+1);
                rightHandBottomRow.assume(rightHandBottomRow.add(rightHandRow.multiply(-multiples)));
            }
        }
        // convert left into reduced row echelon
        for (let row = leftHandSide.rows - 1; row > 0; row--) {
            const leftHandRow = leftHandSide.slice(0, leftHandSide.cols, row, row+1);
            const rightHandRow = rightHandSide.slice(0, rightHandSide.cols, row, row+1);
            for (let topRow = row-1; topRow >= 0; topRow--) {
                const multiples = leftHandSide.get(row, topRow);
                const leftHandTopRow = leftHandSide.slice(0, leftHandSide.cols, topRow, topRow+1);
                leftHandTopRow.assume(leftHandTopRow.add(leftHandRow.multiply(-multiples)));
                const rightHandTopRow = rightHandSide.slice(0, rightHandSide.cols, topRow, topRow+1);
                rightHandTopRow.assume(rightHandTopRow.add(rightHandRow.multiply(-multiples)));
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
}
