import { Matrix } from "./matrix.mjs";

export class AugmentedMatrix {
    /**
     * 
     * @param {Matrix} leftHandSide 
     * @param {Matrix=} rightHandSide 
     */
    constructor(leftHandSide, rightHandSide) {
        if (rightHandSide && leftHandSide.rows !== rightHandSide.rows) {
            throw Error('The left hand side must have the same number of rows as the right hand side');
        }
        this._leftHandSide = leftHandSide;
        this._rightHandSide = rightHandSide ?? new Matrix(leftHandSide.rows, 0);
    }

    /**
     * Returns a view of the augmented matrix that only contains the selected row
     * @param {number} row 
     * @returns {AugmentedMatrix}
     */
    getRow(row) {
        const leftHandSide = this._leftHandSide.slice(0, this._leftHandSide.cols, row, row + 1);
        const rightHandSide = this._rightHandSide.slice(0, this._rightHandSide.cols, row, row + 1);
        return new AugmentedMatrix(leftHandSide, rightHandSide);
    }

    /**
     * Multiplies both sides of equation
     * @param {number} factor
     */
    multiply(factor) {
        this._leftHandSide.multiply(factor, this._leftHandSide);
        this._rightHandSide.multiply(factor, this._rightHandSide);
    }

    /**
     * 
     * @param {AugmentedMatrix} other
     */
    add(other) {
        this._leftHandSide.add(other._leftHandSide, this._leftHandSide);
        this._rightHandSide.add(other._rightHandSide, this._rightHandSide);
    }

    /**
     * 
     * @param {number} rowOne 
     * @param {number} rowTwo 
     */
    rowSwap(rowOne, rowTwo) {
        this._leftHandSide.rowSwap(rowOne, rowTwo);
        this._rightHandSide.rowSwap(rowOne, rowTwo);
    }

    /**
     * Deep copy of system
     * @returns {AugmentedMatrix}
     */
    copy() {
        return new AugmentedMatrix(this._leftHandSide.copy(), this._rightHandSide.copy());
    }

    /**
     * Clears out rows below or above pivot row.
     * @param {number} pivot
     * @param {'up'|'down'} direction the direction to go
     */
    clearOutRows(pivot, direction) {
        const delta = direction === 'up' ? -1 : 1;
        /**
         * @param {number} row 
         * @returns {boolean}
         */
        const condition = (row) => {
            if (direction === 'up') {
                return row >= 0;
            }
            return row < this._leftHandSide.rows;
        };
        const pivotRowEquation = this.getRow(pivot);
        const pivotValue = this._leftHandSide.get(pivot, pivot);
        if (pivotValue < Number.EPSILON) {
            return;
        }
        for (let targetRow = pivot+delta; condition(targetRow); targetRow += delta) {
            const multiples = this._leftHandSide.get(pivot, targetRow) / pivotValue;
            const targetRowEquation = this.getRow(targetRow);
            const subtractOff = pivotRowEquation.copy();
            subtractOff.multiply(-multiples);
            targetRowEquation.add(subtractOff);
        }
    }

    /**
     * Performs Gauss Jordan Elimination on linear system
     * @returns {{
     *  leftHandSide: Matrix,
     *  rightHandSide: Matrix,
     *  scaledDown: number,
     * }}
     */
    gje() {
        const rightHandSide = this._rightHandSide;
        const leftHandSide = this._leftHandSide;
        let swaps = 0;
        let totalScale = 1;
        // put left matrix into row echelon
        for (let row = 0; row < Math.min(leftHandSide.rows, leftHandSide.cols); row++) {
            let scaleFactor = leftHandSide.get(row, row);
            const pivot = leftHandSide.findFirstRowWithPivot(row);
            if (pivot === undefined) {
                // There's not a pivot for this row so no need to clear out the rows below
                continue;
            }
            if (pivot !== row) {
                swaps++;
                this.rowSwap(row, pivot);
                scaleFactor = leftHandSide.get(row, row);
            }
            totalScale *= scaleFactor;
            const equation = this.getRow(row);
            equation.multiply(1 / scaleFactor);
            this.clearOutRows(row, 'down');
        }
        // convert left into reduced row echelon
        for (let row = leftHandSide.rows - 1; row > 0; row--) {
            this.clearOutRows(row, 'up');
        }
        return {
            leftHandSide,
            rightHandSide,
            scaledDown: (-1) ** swaps * totalScale,
        }
    }
}
