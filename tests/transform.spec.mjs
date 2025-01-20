import { getPixel } from "../src/bitmap.mjs";
import { computeTransformMatrix, parseTransformCommands, transform } from "../src/transform.mjs";

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
    describe('Transforming bitmap', () => {
        beforeAll(() => {
            globalThis.ImageData = function() {
                if (arguments.length === 3) {
                    const [data, sw,  sh] = arguments;
                    this.data = data;
                    this.width = sw;
                    this.height = sh;
                    return;
                }
                if (arguments.length === 2) {
                    const [sw,  sh] = arguments;
                    this.data = new Uint8ClampedArray(4 * sw * sh);
                    this.width = sw;
                    this.height = sh;
                    return;
                }
                throw new Error(`Invalid number of arguments supplied ${[...arguments]}`);
            };
        });
        test('90 degree rotation', () => {
            const originalImageData = new ImageData(new Uint8ClampedArray([
                0, 0, 0, 0,    0, 0, 0, 0,    255, 255, 255, 255,   0, 0, 0, 0,     0, 0, 0, 0,
                0, 0, 0, 0,    0, 0, 0, 0,    0, 0, 0, 0,           0, 0, 0, 0,     0, 0, 0, 0,
                0, 0, 0, 0,    0, 0, 0, 0,    0, 0, 0, 0,           0, 0, 0, 0,     0, 0, 0, 0,
                0, 0, 0, 0,    0, 0, 0, 0,    0, 0, 0, 0,           0, 0, 0, 0,     0, 0, 0, 0,
                0, 0, 0, 0,    0, 0, 0, 0,    0, 0, 0, 0,           0, 0, 0, 0,     0, 0, 0, 0,
            ]), 5, 5);

            const { newImageData } = transform(originalImageData, 'rotate(90)');

            expect(getPixel(newImageData, 4, 2)[0]).toBe(255);
            expect(getPixel(newImageData, 4, 2)[1]).toBe(255);
            expect(getPixel(newImageData, 4, 2)[2]).toBe(255);
            expect(getPixel(newImageData, 4, 2)[3]).toBe(255);
        });
    });
    test('scaling to 0 in both directions', () => {
        const originalImageData = new ImageData(new Uint8ClampedArray([
            0, 0, 0, 0,    0, 0, 0, 0,    255, 255, 255, 255,   0, 0, 0, 0,     0, 0, 0, 0,
            0, 0, 0, 0,    0, 0, 0, 0,    0, 0, 0, 0,           0, 0, 0, 0,     0, 0, 0, 0,
            0, 0, 0, 0,    0, 0, 0, 0,    0, 0, 0, 0,           0, 0, 0, 0,     0, 0, 0, 0,
            0, 0, 0, 0,    0, 0, 0, 0,    0, 0, 0, 0,           0, 0, 0, 0,     0, 0, 0, 0,
            0, 0, 0, 0,    0, 0, 0, 0,    0, 0, 0, 0,           0, 0, 0, 0,     0, 0, 0, 0,
        ]), 5, 5);

        const { newImageData } = transform(originalImageData, 'scale(0)');
        
        expect(newImageData.width).toBe(1);
        expect(newImageData.height).toBe(1);
        expect(getPixel(newImageData, 0, 0)[0]).toBe(0);
        expect(getPixel(newImageData, 0, 0)[1]).toBe(0);
        expect(getPixel(newImageData, 0, 0)[2]).toBe(0);
        expect(getPixel(newImageData, 0, 0)[3]).toBe(0);
    });
    test('scaling to 0 in one direction', () => {
        const originalImageData = new ImageData(new Uint8ClampedArray([
            0, 0, 0, 0,    0, 0, 0, 0,    255, 255, 255, 255,   0, 0, 0, 0,     0, 0, 0, 0,
            0, 0, 0, 0,    0, 0, 0, 0,    0, 0, 0, 0,           0, 0, 0, 0,     0, 0, 0, 0,
            0, 0, 0, 0,    0, 0, 0, 0,    0, 0, 0, 0,           0, 0, 0, 0,     0, 0, 0, 0,
            0, 0, 0, 0,    0, 0, 0, 0,    0, 0, 0, 0,           0, 0, 0, 0,     0, 0, 0, 0,
            0, 0, 0, 0,    0, 0, 0, 0,    0, 0, 0, 0,           0, 0, 0, 0,     0, 0, 0, 0,
        ]), 5, 5);

        const { newImageData } = transform(originalImageData, 'scaleX(0)');
        
        expect(newImageData.width).toBe(1);
        expect(newImageData.height).toBe(5);
        expect(getPixel(newImageData, 0, 0)[0]).toBe(0);
        expect(getPixel(newImageData, 0, 0)[1]).toBe(0);
        expect(getPixel(newImageData, 0, 0)[2]).toBe(0);
        expect(getPixel(newImageData, 0, 0)[3]).toBe(0);
    });
});
