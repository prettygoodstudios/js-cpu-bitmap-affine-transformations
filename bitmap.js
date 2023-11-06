

/**
 * 
 * @param {string} selector 
 * @returns {Promise<ImageData>}
 */
async function getBitmap(selector) {
    const bitmap = await createImageBitmap(document.querySelector(selector));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0);
    const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
    return imageData;
}

/**
 * 
 * @param {ImageData} imageData
 * @return {string}
 */
function imageDataToImage(imageData) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const context = canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}

/**
 * 
 * @param {ImageData} imageData
 * @param {number} x 
 * @param {number} y
 * @return {Uint8ClampedArray}
 */
function getPixel(imageData, x, y) {
    const pixel = y * imageData.width + x;
    const colorChannels = 4;
    return imageData.data.subarray(pixel * colorChannels, (pixel + 1) * colorChannels);
}

/**
 * 
 * @param {ImageData} imageData
 * @param {number} x 
 * @param {number} y
 * @param {Uint8ClampedArray} colors 
 */
function setPixel(imageData, x, y, colors) {
    if (x < 0 || y < 0) {
        return;
    }
    if (x >= imageData.width || y >= imageData.height) {
        return;
    }
    const pixel = y * imageData.width + x;
    const colorChannels = 4;
    imageData.data.set(colors, pixel * colorChannels);
}

/**
 * 
 * @param {ImageData} imageData 
 * @param {number} percent 
 */
function lighten(imageData, percent) {
    if (percent < 0 || percent > 1) {
        throw Error('Must lighten by value between 0 and 1');
    }
    for (let row = 0; row < imageData.height; row++) {
        for (let col = 0; col < imageData.width; col++) {
            const pixel = getPixel(imageData, col, row);
            for (let color = 0; color < pixel.length; color++) {
                pixel[color] *= (1-percent);
            }
            setPixel(imageData, col, row, pixel);
        }
    }
}

/**
 * 
 * @param {ImageData} imageData 
 * @param {number} percent 
 */
function makeBlue(imageData, percent) {
    if (percent < 0 || percent > 1) {
        throw Error('Must lighten by value between 0 and 1');
    }
    for (let row = 0; row < imageData.height; row++) {
        for (let col = 0; col < imageData.width; col++) {
            const pixel = getPixel(imageData, col, row);
            let notWhite = false;
            for (let color = 0; color < pixel.length; color++) {
                if (pixel[color] !== 0) {
                    notWhite = true;
                    break;
                }
            }
            // notWhite = true;
            if (notWhite) {
                pixel[0] = 0;
                pixel[1] = 0;
                pixel[2] = 255;
            }
            setPixel(imageData, col, row, pixel);
        }
    }
}

class Matrix {
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
            const multiples = clone.get(i, i+1);
            for (let c = 0; c < this.rows; c++) {
                const subtract = clone.get(c, i) * multiples;
                const subtractIdentity = identity.get(c, i) * multiples;
                clone.set(c, i+1, clone.get(c, i+1) - subtract);
                identity.set(c, i+1, identity.get(c, i+1) - subtractIdentity);
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

/**
 * 
 * @param {number} x 
 * @param {number} y 
 */
function scale(x, y) {
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
function rotate(degrees) {
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
function translate(x, y) {
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
function parseTransformCommands(commands) {
    const matches = commands.matchAll(/(\w+)\(([^\)]*)\)/g);
    const commandList = [];
    for (let match of matches) {
        const inputMatches =  match[2].matchAll(/(\-?\d+.?\d*)(\s*,|\s*$)/g);
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
function computeTransformMatrix(commands) {
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
 * @param {ImageData} imageData 
 * @param {number} scaleFactor 
 * @returns {ImageData}
 */
function createUpscaleOfImageData(imageData, scaleFactor) {
    scaleFactor = scaleFactor|0;
    const upscale = new ImageData(imageData.width * scaleFactor, imageData.height * scaleFactor);
    const colorChannels = 4;
    for (let row = 0; row < imageData.height; row++) {
        for (let col = 0; col < imageData.width; col++) {
            const pixel = getPixel(imageData, col, row);
            const pixelBaseLocation = row * scaleFactor * colorChannels * upscale.width + col * scaleFactor * colorChannels;
            for (let verticalOffset = 0; verticalOffset < scaleFactor; verticalOffset++) {
                for (let horizontalOffset = 0; horizontalOffset < scaleFactor; horizontalOffset++) {
                    upscale.data.set(pixel, pixelBaseLocation + verticalOffset * colorChannels * upscale.width + horizontalOffset * colorChannels);
                }
            }
        }
    }
    return upscale;
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
function computeBoundingBox(extrema) {
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
function transform(imageData, commands, origin) {
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

    // const {top, right, bottom, left} = { top: 0, right: imageData.width, left: 0, bottom: imageData.height};
    const {top, right, bottom, left} = computeBoundingBox(extrema);

    const inverseTransformMatrix = transformMatrix.inverse();
    const newImageData = new ImageData(right - left, bottom - top);
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

    return {
        newImageData,
        left,
        top,
    };
}

/**
 * 
 * @param {ImageData} imageData
 * @param {number} angle
 * @param {number} lastFrame
 */
function animateImageData(imageData, angle, lastFrame) {
    const { newImageData, left, top } = transform(imageData, `translateX(${angle*0.5}) scale(1.2) rotate(${angle})`);
    const animation = document.querySelector('#animation');
    const animationWrapper = document.querySelector('#animationWrapper');
    animationWrapper.style.width = `${imageData.width}px`;
    animationWrapper.style.height = `${imageData.height}px`;
    animationWrapper.style.position = 'relative';
    animation.src = imageDataToImage(newImageData);
    animation.style.position = 'absolute';
    animation.style.top = `${top}px`;
    animation.style.left = `${left}px`;
    const now = Date.now();
    requestAnimationFrame(() => animateImageData(imageData, angle + 0.1 * (now - lastFrame), now));
}

async function main() {
    const imageData = await getBitmap('#src');
    // makeBlue(imageData);
    // lighten(imageData, 0.55);
    console.log(rotate(90).toString());
    console.log(rotate(90).inverse().toString());
    console.log(translate(0, 50).inverse().toString());
    console.log(translate(50, 0).inverse().toString());
    // transform(imageData, 'rotate(0)', [50, 37.5]);
    // document.body.appendChild(imageDataToImage(imageData));
    // transform(imageData, 'rotate(80)', [50, 37.5]);
    // document.body.appendChild(imageDataToImage(imageData));
    animateImageData(imageData, 0, Date.now());
}

window.onload = () => {
    main();
    const testMatrix = new Matrix(3, 3, new Float32Array([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
    ]));
    const testMatrix2 = new Matrix(3, 3, new Float32Array([
        2, 0, 0,
        0, 2, 0,
        0, 0, 1,
    ]));
    const vector = new Matrix(3, 1, new Float32Array([
        55,
        22,
        1
    ]));
    console.log(testMatrix.multiply(vector).toString());
    console.log(testMatrix2.multiply(vector).toString());
    console.log(testMatrix.multiply(testMatrix2).toString());
    console.log(rotate(90).multiply(new Matrix(3, 1, new Float32Array([
        1,
        0,
        1,
    ]))).toString());
    console.log(rotate(45).multiply(scale(2, 2)).multiply(new Matrix(3, 1, new Float32Array([
        1,
        0,
        1,
    ]))).toString());
    console.log(rotate(45).multiply(scale(2, 2)).inverse());
    console.log(rotate(80).inverse());
    console.log(parseTransformCommands(`scale(1   
        , 1) 
        scaleX(5  ) rotate(50.4435)`));
}
