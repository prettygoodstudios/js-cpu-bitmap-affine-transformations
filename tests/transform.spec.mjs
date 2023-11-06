import { computeTransformMatrix, parseTransformCommands } from "../src/transform.mjs";

describe('Testing transform', () => {
    describe('parsing commands', () => {
        test('one command', () => {
            expect(parseTransformCommands('scaleX(4)')).toStrictEqual([
                {
                    name: 'scaleX',
                    inputs: [4],
                }
            ]);
            expect(parseTransformCommands('scale(1, 1)')).toStrictEqual([
                {
                    name: 'scale',
                    inputs: [1, 1],
                }
            ]);
            expect(parseTransformCommands('translate(20, 60)')).toStrictEqual([
                {
                    name: 'translate',
                    inputs: [20, 60],
                }
            ]);
        });
        test('multiple commands', () => {
            expect(parseTransformCommands('translateX(10) scaleX(4) rotate(20)')).toStrictEqual([
                {
                    name: 'translateX',
                    inputs: [10],
                },
                {
                    name: 'scaleX',
                    inputs: [4],
                },
                {
                    name: 'rotate',
                    inputs: [20],
                },
            ]);
        });
        test('irregular whitespace', () => {
            expect(parseTransformCommands(`
            translateX(10    ) scale(    4,
                50)
                rotate(
                    
                    20
                    
                    
                    )`)).toStrictEqual([
                {
                    name: 'translateX',
                    inputs: [10],
                },
                {
                    name: 'scale',
                    inputs: [4, 50],
                },
                {
                    name: 'rotate',
                    inputs: [20],
                },
            ]);
        });
    });
    describe('computing transform matrix', () => {
        test('scale and rotate', () => {
            const matrix = computeTransformMatrix('scale(2) rotate(90)');
            expect(matrix.get(0, 0)).toBeCloseTo(0);
            expect(matrix.get(1, 0)).toBeCloseTo(-2);
            expect(matrix.get(2, 0)).toBeCloseTo(0);
            expect(matrix.get(0, 1)).toBeCloseTo(2);
            expect(matrix.get(1, 1)).toBeCloseTo(0);
            expect(matrix.get(2, 1)).toBeCloseTo(0);
            expect(matrix.get(0, 2)).toBeCloseTo(0);
            expect(matrix.get(1, 2)).toBeCloseTo(0);
            expect(matrix.get(2, 2)).toBeCloseTo(1);
            const matrix2 = computeTransformMatrix('rotate(90) scale(2)');
            expect(matrix2.get(0, 0)).toBeCloseTo(0);
            expect(matrix2.get(1, 0)).toBeCloseTo(-2);
            expect(matrix2.get(2, 0)).toBeCloseTo(0);
            expect(matrix2.get(0, 1)).toBeCloseTo(2);
            expect(matrix2.get(1, 1)).toBeCloseTo(0);
            expect(matrix2.get(2, 1)).toBeCloseTo(0);
            expect(matrix2.get(0, 2)).toBeCloseTo(0);
            expect(matrix2.get(1, 2)).toBeCloseTo(0);
            expect(matrix2.get(2, 2)).toBeCloseTo(1);
        });
        test('translate after scaling and rotating', () => {
            const matrix = computeTransformMatrix('translate(5, 10) scale(2) rotate(90)');
            expect(matrix.get(0, 0)).toBeCloseTo(0);
            expect(matrix.get(1, 0)).toBeCloseTo(-2);
            expect(matrix.get(2, 0)).toBeCloseTo(5);
            expect(matrix.get(0, 1)).toBeCloseTo(2);
            expect(matrix.get(1, 1)).toBeCloseTo(0);
            expect(matrix.get(2, 1)).toBeCloseTo(10);
            expect(matrix.get(0, 2)).toBeCloseTo(0);
            expect(matrix.get(1, 2)).toBeCloseTo(0);
            expect(matrix.get(2, 2)).toBeCloseTo(1);
        });
        test('translate before scaling and rotating', () => {
            const matrix = computeTransformMatrix('scale(2) rotate(90) translate(5, 10)');
            expect(matrix.get(0, 0)).toBeCloseTo(0);
            expect(matrix.get(1, 0)).toBeCloseTo(-2);
            expect(matrix.get(2, 0)).toBeCloseTo(-20);
            expect(matrix.get(0, 1)).toBeCloseTo(2);
            expect(matrix.get(1, 1)).toBeCloseTo(0);
            expect(matrix.get(2, 1)).toBeCloseTo(10);
            expect(matrix.get(0, 2)).toBeCloseTo(0);
            expect(matrix.get(1, 2)).toBeCloseTo(0);
            expect(matrix.get(2, 2)).toBeCloseTo(1);
        });
    });
});
