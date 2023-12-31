import { Matrix } from "../src/matrix.mjs";

describe('Testing Matrix', () => {
    describe('constructor', () => {
        test('square matrix', () => {
            const matrix = new Matrix(3, 3, new Float32Array([
                1, 2, 3,
                4, 5, 6,
                7, 8, 9,
            ]));
            expect(matrix.rows).toBe(3);
            expect(matrix.cols).toBe(3);
            expect(matrix.get(0, 0)).toBe(1);
            expect(matrix.get(1, 0)).toBe(2);
            expect(matrix.get(2, 0)).toBe(3);
            expect(matrix.get(0, 1)).toBe(4);
            expect(matrix.get(1, 1)).toBe(5);
            expect(matrix.get(2, 1)).toBe(6);
            expect(matrix.get(0, 2)).toBe(7);
            expect(matrix.get(1, 2)).toBe(8);
            expect(matrix.get(2, 2)).toBe(9);
        });
        test('column vector', () => {
            // The matrix class supports dot product for row and column vectors so this is a common use case
            const vector = new Matrix(3, 1, new Float32Array([
                1,
                2,
                3,
            ]));
            expect(vector.rows).toBe(3);
            expect(vector.cols).toBe(1);
            expect(vector.get(0, 0)).toBe(1);
            expect(vector.get(0, 1)).toBe(2);
            expect(vector.get(0, 2)).toBe(3);
        });
        test('row vector', () => {
            // The matrix class supports dot product for row and column vectors so this is a common use case
            const vector = new Matrix(1, 3, new Float32Array([
                1, 2, 3,
            ]));
            expect(vector.rows).toBe(1);
            expect(vector.cols).toBe(3);
            expect(vector.get(0, 0)).toBe(1);
            expect(vector.get(1, 0)).toBe(2);
            expect(vector.get(2, 0)).toBe(3);
        });
    });
    describe('multiply', () => {
        test("doesn't mutate", () => {
            const originalData = new Float32Array([
                1, 2, 3,
                4, 5, 6,
                7, 8, 9,
            ]);
            const matrix = new Matrix(3, 3, new Float32Array(originalData));
            const scaleUp = new Matrix(3, 3, new Float32Array([
                2, 0, 0,
                0, 2, 0,
                0, 0, 1,
            ]));
            matrix.multiply(scaleUp);
            expect(matrix._data).toStrictEqual(originalData);
        });
        test('by identity', () => {
            const matrix = new Matrix(3, 3, new Float32Array([
                1, 2, 3,
                4, 5, 6,
                7, 8, 9,
            ]));
            const identity = new Matrix(3, 3, new Float32Array([
                1, 0, 0,
                0, 1, 0,
                0, 0, 1,
            ]));
            expect(matrix.multiply(identity)._data).toStrictEqual(matrix._data);
        });
        test('scale up', () => {
            const matrix = new Matrix(3, 3, new Float32Array([
                1, 2, 0,
                4, 5, 0,
                0, 0, 1,
            ]));
            const scaleUp = new Matrix(3, 3, new Float32Array([
                2, 0, 0,
                0, 2, 0,
                0, 0, 1,
            ]));
            expect(matrix.multiply(scaleUp)._data).toStrictEqual(new Float32Array([
                2, 4, 0,
                8, 10, 0,
                0, 0, 1,
            ]));
        });
        test('rotate 90', () => {
            const matrix = new Matrix(3, 3, new Float32Array([
                1, 2, 0,
                4, 5, 0,
                0, 0, 1,
            ]));
            const rotate90 = new Matrix(3, 3, new Float32Array([
                0, -1, 0,
                1, 0, 0,
                0, 0, 1,
            ]));
            expect(matrix.multiply(rotate90)._data).toStrictEqual(new Float32Array([
                2, -1, 0,
                5, -4, 0,
                0, 0, 1,
            ]));
        });
        test('by scalar', () => {
            const matrix = new Matrix(3, 3, new Float32Array([
                1, 2, 0,
                4, 5, 0,
                0, 0, 1,
            ]));
            expect(matrix.multiply(3)).toStrictEqual(new Matrix(3, 3, new Float32Array([
                3, 6, 0,
                12, 15, 0,
                0, 0, 3,
            ])));
        });
    });
    describe('add', () => {
        test('scalar', () => {
            const matrix = new Matrix(3, 3, new Float32Array([
                1, 2, 0,
                4, 5, 0,
                0, 0, 1,
            ]));
            expect(matrix.add(3)).toStrictEqual(new Matrix(3, 3, new Float32Array([
                4, 5, 3,
                7, 8, 3,
                3, 3, 4,
            ])));
        });
        test('matrix', () => {
            const matrix = new Matrix(3, 3, new Float32Array([
                1, 2, 0,
                4, 5, 0,
                0, 0, 1,
            ]));
            const identity = new Matrix(3, 3, new Float32Array([
                1, 0, 0,
                0, 1, 0,
                0, 0, 1,
            ]));
            expect(matrix.add(identity)).toStrictEqual(new Matrix(3, 3, new Float32Array([
                2, 2, 0,
                4, 6, 0,
                0, 0, 2,
            ])));
        });
    });
    describe('dot', () => {
        test('both column', () => {
            const vector1 = new Matrix(3, 1, new Float32Array([
                1,
                2,
                3,
            ]));
            const vector2 = new Matrix(3, 1, new Float32Array([
                3,
                2,
                1,
            ]));
            expect(vector1.dot(vector2)).toBe(10);
        });
        test('both row', () => {
            const vector1 = new Matrix(1, 3, new Float32Array([
                1, 2, 3,
            ]));
            const vector2 = new Matrix(1, 3, new Float32Array([
                1, 2, 3,
            ]));
            expect(vector1.dot(vector2)).toBe(14);
        });
        test('mixed', () => {
            const vector1 = new Matrix(3, 1, new Float32Array([
                1,
                2,
                3,
            ]));
            const vector2 = new Matrix(1, 3, new Float32Array([
                1, 2, 3,
            ]));
            expect(vector1.dot(vector2)).toBe(14);
        });
    });
    describe('det', () => {
        test('matrix with one out of 3 pivots', () => {
            expect(new Matrix(3, 3, new Float32Array([
                1, 2, 3,
                3, 6, 9,
                2, 4, 6,
            ])).det()).toBeCloseTo(0);
        });
        test('matrix with missing pivot in the middle', () => {
            expect(new Matrix(3, 3, new Float32Array([
                1, 2, 3,
                3, 6, 7,
                2, 4, 6,
            ])).det()).toBeCloseTo(0);
        });
        test('matrix with missing pivot in last col', () => {
            expect(new Matrix(3, 3, new Float32Array([
                1, 2, 3,
                3, 6, 9,
                2, 4, 2,
            ])).det()).toBeCloseTo(0);
        });
        test('scale matrix with scale factor of 2', () => {
            expect(new Matrix(3, 3, new Float32Array([
                2, 0, 0,
                0, 2, 0,
                0, 0, 1,
            ])).det()).toBeCloseTo(4);
        });
        test('scale matrix with scale factor of 1/4', () => {
            expect(new Matrix(3, 3, new Float32Array([
                1/4, 0, 0,
                0, 1/4, 0,
                0, 0, 1,
            ])).det()).toBeCloseTo(1/16);
        });
        test('rotation of 45 degrees', () => {
            expect(new Matrix(3, 3, new Float32Array([
                Math.sqrt(2)/2, -Math.sqrt(2)/2, 0,
                Math.sqrt(2)/2, Math.sqrt(2)/2, 0,
                0, 0, 1,
            ])).det()).toBeCloseTo(1);
        });
        test('matrix with zeroes in the middle column', () => {
            expect(new Matrix(3, 3, new Float32Array([
                2, 0, -2,
                2, 0, 2,
                0, 1, 0,
            ])).det()).toBeCloseTo(-8);
            expect(new Matrix(3, 3, new Float32Array([
                2, 0, -2,
                0, 1, 0,
                2, 0, 2,
            ])).det()).toBeCloseTo(8);
            expect(new Matrix(3, 3, new Float32Array([
                2, 0, -2,
                55, 1, 23,
                2, 0, 2,
            ])).det()).toBeCloseTo(8);
        });
    });
    describe('inverse', () => {
        test('identity', () => {
            expect(new Matrix(3, 3, new Float32Array([
                1, 0, 0,
                0, 1, 0,
                0, 0, 1,
            ])).inverse()._data).toStrictEqual(new Float32Array([
                1, 0, 0,
                0, 1, 0,
                0, 0, 1,
            ]));
        });
        test('scaled identity', () => {
            expect(new Matrix(3, 3, new Float32Array([
                2, 0, 0,
                0, 2, 0,
                0, 0, 2,
            ])).inverse()._data).toStrictEqual(new Float32Array([
                0.5, 0, 0,
                0, 0.5, 0,
                0, 0, 0.5,
            ]));
        });
        test('two by two', () => {
            expect(new Matrix(2, 2, new Float32Array([
                1, 3,
                4, 6
            ])).inverse()._data).toStrictEqual(new Float32Array([
                -1, 1/2,
                2/3, -1/6,
            ]));
        });
        test('45 degree rotation matrix', () => {
            const inverse = new Matrix(3, 3, new Float32Array([
                Math.sqrt(2)/2, -Math.sqrt(2)/2, 0,
                Math.sqrt(2)/2, Math.sqrt(2)/2, 0,
                0, 0, 1,
            ])).inverse();
            expect(inverse.get(0, 0)).toBeCloseTo(Math.sqrt(2)/2);
            expect(inverse.get(1, 0)).toBeCloseTo(Math.sqrt(2)/2);
            expect(inverse.get(2, 0)).toBeCloseTo(0);
            expect(inverse.get(0, 1)).toBeCloseTo(-Math.sqrt(2)/2);
            expect(inverse.get(1, 1)).toBeCloseTo(Math.sqrt(2)/2);
            expect(inverse.get(2, 1)).toBeCloseTo(0);
            expect(inverse.get(0, 2)).toBeCloseTo(0);
            expect(inverse.get(1, 2)).toBeCloseTo(0);
            expect(inverse.get(2, 2)).toBeCloseTo(1);
        });
        test('rotation and scale', () => {
            const inverse = new Matrix(3, 3, new Float32Array([
                Math.sqrt(2), -Math.sqrt(2), 0,
                Math.sqrt(2), Math.sqrt(2), 0,
                0, 0, 1,
            ])).inverse();
            expect(inverse.get(0, 0)).toBeCloseTo(Math.sqrt(2)/4);
            expect(inverse.get(1, 0)).toBeCloseTo(Math.sqrt(2)/4);
            expect(inverse.get(2, 0)).toBeCloseTo(0);
            expect(inverse.get(0, 1)).toBeCloseTo(-Math.sqrt(2)/4);
            expect(inverse.get(1, 1)).toBeCloseTo(Math.sqrt(2)/4);
            expect(inverse.get(2, 1)).toBeCloseTo(0);
            expect(inverse.get(0, 2)).toBeCloseTo(0);
            expect(inverse.get(1, 2)).toBeCloseTo(0);
            expect(inverse.get(2, 2)).toBeCloseTo(1);
        });
        test('rotation, scale and translate', () => {
            const inverse = new Matrix(3, 3, new Float32Array([
                Math.sqrt(2), -Math.sqrt(2), 1,
                Math.sqrt(2), Math.sqrt(2), 2,
                0, 0, 1,
            ])).inverse();
            expect(inverse.get(0, 0)).toBeCloseTo(Math.sqrt(2)/4);
            expect(inverse.get(1, 0)).toBeCloseTo(Math.sqrt(2)/4);
            expect(inverse.get(2, 0)).toBeCloseTo(-3*Math.sqrt(2)/4);
            expect(inverse.get(0, 1)).toBeCloseTo(-Math.sqrt(2)/4);
            expect(inverse.get(1, 1)).toBeCloseTo(Math.sqrt(2)/4);
            expect(inverse.get(2, 1)).toBeCloseTo(-Math.sqrt(2)/4);
            expect(inverse.get(0, 2)).toBeCloseTo(0);
            expect(inverse.get(1, 2)).toBeCloseTo(0);
            expect(inverse.get(2, 2)).toBeCloseTo(1);
        });
        test('more complex matrix', () => {
            const inverse = new Matrix(3, 3, new Float32Array([
                1, 5, 2,
                4, 8, 3,
                7, 4, 12,
            ])).inverse();
            expect(inverse.get(0, 0)).toBeCloseTo(-0.64122137404580152666);
            expect(inverse.get(1, 0)).toBeCloseTo(0.3969465648854961832);
            expect(inverse.get(2, 0)).toBeCloseTo(0.0076335877862595419821);
            expect(inverse.get(0, 1)).toBeCloseTo(0.2061068702290076336);
            expect(inverse.get(1, 1)).toBeCloseTo(0.015267175572519083969);
            expect(inverse.get(2, 1)).toBeCloseTo(-0.038167938931297709925);
            expect(inverse.get(0, 2)).toBeCloseTo(0.30534351145038167937);
            expect(inverse.get(1, 2)).toBeCloseTo(-0.23664122137404580153);
            expect(inverse.get(2, 2)).toBeCloseTo(0.091603053435114503822);
        });
    });
    describe('slice', () => {
        test('slicing a row vector', () => {
            expect(new Matrix(3, 3, new Float32Array([
                1, 5, 2,
                4, 8, 3,
                7, 4, 12,
            ])).slice(0, 3, 0, 1).toString()).toBe(new Matrix(1, 3, new Float32Array([
                1, 5, 2,
            ])).toString());
        });
        test('slicing a column vector', () => {
            expect(new Matrix(3, 3, new Float32Array([
                1, 5, 2,
                4, 8, 3,
                7, 4, 12,
            ])).slice(0, 1, 0, 3).toString()).toBe(new Matrix(3, 1, new Float32Array([
                1,
                4,
                7,
            ])).toString());
        });
    });
});