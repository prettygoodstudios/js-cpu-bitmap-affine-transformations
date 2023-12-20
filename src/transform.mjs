import { Matrix } from "./matrix.mjs";
import { setPixel, getPixel } from "./bitmap.mjs";

/**
 * 
 * @param {number} x
 * @param {number} y
 */
export function scale(x, y) {
    if (y === undefined) {
        y = x;
    }
    return new Matrix(3, 3, new Float32Array([
        x, 0, 0,
        0, y, 0,
        0, 0, 1,
    ]));
}

/**
 * 
 * @param {number} degrees 
 */
export function rotate(degrees) {
    const radians = degrees * Math.PI / 180;
    return new Matrix(3, 3, new Float32Array([
        Math.cos(radians), -Math.sin(radians), 0,
        Math.sin(radians), Math.cos(radians), 0,
        0, 0, 1,
    ]));
}

/**
 * 
 * @param {number} x 
 * @param {number} y 
 */
export function translate(x, y) {
    return new Matrix(3, 3, new Float32Array([
        1, 0, x,
        0, 1, y,
        0, 0, 1,
    ]));
}

/**
 * 
 * @param {string} commands 
 */
export function parseTransformCommands(commands) {
    const matches = commands.matchAll(/(\w+)\(([^\)]*)\)/g);
    const commandList = [];
    for (let match of matches) {
        const inputMatches =  match[2].matchAll(/(\-?\d+\.?\d*)(\s*,|\s*$)/g);
        const inputs = [];
        for (let inputMatch of inputMatches) {
            inputs.push(parseFloat(inputMatch[1]));
        }
        commandList.push({
            name: match[1],
            inputs,
        });
    }
    return commandList;
}

/**
 * 
 * @param {string} commands
 * @return {Matrix}
 */
export function computeTransformMatrix(commands) {
    const commandMap = {
        'scale': scale,
        'scaleX': (x) => scale(x, 1),
        'scaleY': (y) => scale(1, y),
        'rotate': rotate,
        'translate': translate,
        'translateX': (x) => translate(x, 0),
        'translateY': (y) => translate(0, y),
    }
    let transformMatrix = scale(1, 1);
    for (const {inputs, name} of parseTransformCommands(commands)) {
        if (!commandMap[name]) {
            throw Error(`Unsupported command provided to transform: ${name}`);
        }
        /**
         * @type {Matrix}
         */
        const rightMatrix = commandMap[name](...inputs);
        transformMatrix = transformMatrix.multiply(rightMatrix);
    }
    return transformMatrix;
}

/**
 * 
 * @param {Matrix[]} extrema
 * @returns {{
 *  top: number;
 *  right: number;
 *  bottom: number;
 *  left: number;
 * }}
 */
export function computeBoundingBox(extrema) {
    const left = Math.min(...extrema.map(m => m.get(0, 0)))|0;
    const top = Math.min(...extrema.map(m => m.get(0, 1)))|0;
    const right = Math.ceil(Math.max(...extrema.map(m => m.get(0, 0))));
    const bottom = Math.ceil(Math.max(...extrema.map(m => m.get(0, 1))));
    return {
        top,
        right,
        bottom,
        left,
    }
}

/**
 * @param {ImageData} imageData
 * @param {string} commands 
 * @param {[number, number]|undefined} origin 
 */
export function transform(imageData, commands, origin) {
    if (!origin) {
        origin = [imageData.width/2, imageData.height/2];
    }
    const transformMatrix = computeTransformMatrix(commands);
    const [originX, originY] = origin;
    const extrema = [
        new Matrix(3, 1, new Float32Array([
            0 - originX,
            0 - originY,
            1,
        ])),
        new Matrix(3, 1, new Float32Array([
            imageData.width - originX,
            0 - originY,
            1,
        ])),
        new Matrix(3, 1, new Float32Array([
            0 - originX,
            imageData.height - originY,
            1,
        ])),
        new Matrix(3, 1, new Float32Array([
            imageData.width - originX,
            imageData.height - originY,
            1,
        ])),
    ].map(m => transformMatrix.multiply(m)).map(m => {
        m.set(0, 0, m.get(0, 0) + originX);
        m.set(0, 1, m.get(0, 1) + originY);
        return m;
    });

    const {top, right, bottom, left} = computeBoundingBox(extrema);
    // The ImageData constructor doesn't permit images with a dimension of 0
    const newImageData = new ImageData((right - left) || 1, (bottom - top) || 1);
    if (Math.abs(transformMatrix.det()) < Number.EPSILON) {
        // The transform matrix is singular. This can only occur if it's scaled to 0.
        return {
            newImageData,
            left,
            top,
        }
    }

    const inverseTransformMatrix = transformMatrix.inverse();
    console.time('Loop');
    for (let row = top; row < bottom; row++) {
        for (let col = left; col < right; col++) {
            const positionVector = new Matrix(3, 1, new Float32Array([
                col - originX,
                row - originY,
                1,
            ]));
            const originalPosition = inverseTransformMatrix.multiply(positionVector);
            const originalX = Math.round(originalPosition.get(0, 0) + originX);
            const originalY = Math.round(originalPosition.get(0, 1) + originY);
            const outsideImageBounds = originalX < 0 || originalY < 0 || originalX >= imageData.width || originalY >= imageData.height;
            if (!outsideImageBounds) {
                setPixel(newImageData, col - left, row - top, getPixel(imageData, originalX, originalY));
            }
        }
    }
    console.timeEnd('Loop');

    return {
        newImageData,
        left,
        top,
    };
}
