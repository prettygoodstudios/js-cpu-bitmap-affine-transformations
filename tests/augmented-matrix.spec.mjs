import { Matrix } from "../src/matrix.mjs";
import { AugmentedMatrix } from "../src/augmented-matrix.mjs";


describe('Testing AugmentedMatrix', () => {
    test('identity on left hand side', () => {
        const augmentedMatrix = new AugmentedMatrix(
            new Matrix(3, 3, new Float32Array([
                1, 0, 0,
                0, 1, 0,
                0, 0, 1,
            ])),
            new Matrix(3, 1, new Float32Array([
                3,
                2,
                1
            ])),
        );
        expect(augmentedMatrix.gje()).toStrictEqual({
            leftHandSide: new Matrix(3, 3, new Float32Array([
                1, 0, 0,
                0, 1, 0,
                0, 0, 1,
            ])),
            rightHandSide: new Matrix(3, 1, new Float32Array([
                3,
                2,
                1
            ])),
            scaledDown: 1,
        });
    });
    test('diagonal on left hand side', () => {
        const augmentedMatrix = new AugmentedMatrix(
            new Matrix(3, 3, new Float32Array([
                3, 0, 0,
                0, 2, 0,
                0, 0, 1,
            ])),
            new Matrix(3, 1, new Float32Array([
                3,
                2,
                1
            ])),
        );
        expect(augmentedMatrix.gje()).toStrictEqual({
            leftHandSide: new Matrix(3, 3, new Float32Array([
                1, 0, 0,
                0, 1, 0,
                0, 0, 1,
            ])),
            rightHandSide: new Matrix(3, 1, new Float32Array([
                1,
                1,
                1
            ])),
            scaledDown: 6,
        });
    });
    test('upper triangular on left hand side', () => {
        const augmentedMatrix = new AugmentedMatrix(
            new Matrix(3, 3, new Float32Array([
                3, 2, 3,
                0, 2, 1,
                0, 0, 1,
            ])),
            new Matrix(3, 1, new Float32Array([
                16,
                5,
                1,
            ])),
        );
        expect(augmentedMatrix.gje()).toStrictEqual({
            leftHandSide: new Matrix(3, 3, new Float32Array([
                1, 0, 0,
                0, 1, 0,
                0, 0, 1,
            ])),
            rightHandSide: new Matrix(3, 1, new Float32Array([
                3,
                2,
                1
            ])),
            scaledDown: 6,
        });
    });
    test('lower triangular on left hand side', () => {
        const augmentedMatrix = new AugmentedMatrix(
            new Matrix(3, 3, new Float32Array([
                1, 0, 0,
                1, 2, 0,
                3, 2, 3,
            ])),
            new Matrix(3, 1, new Float32Array([
                1,
                5,
                16,
            ])),
        );
        expect(augmentedMatrix.gje()).toStrictEqual({
            leftHandSide: new Matrix(3, 3, new Float32Array([
                1, 0, 0,
                0, 1, 0,
                0, 0, 1,
            ])),
            rightHandSide: new Matrix(3, 1, new Float32Array([
                1,
                2,
                3,
            ])),
            scaledDown: 6,
        });
    });
});