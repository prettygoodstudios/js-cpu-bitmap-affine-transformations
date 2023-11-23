# CPU Bitmap Affine Transformations


## Introduction

The purpose of this repository is to be an educational resource on the math behind the CSS [transform](https://developer.mozilla.org/en-US/docs/Web/CSS/transform) property. It's self-contained, therefore, no third party libraries or build system is used. Even though CSS [transform](https://developer.mozilla.org/en-US/docs/Web/CSS/transform) is hardware accelerated via the GPU I decided to stay away from `WebGL` to keep the focus on the math.

## Getting it up and running

This project is built using native ES modules, therefore, you'll need to serve up the files in this project with a web server (See the [troubleshooting section of the MDN ES module guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#troubleshooting) for a more detailed explanation). Running `./run.sh` (will not work on Windows) from the root directory of this repository will start up a web server serving up the right files at [http://localhost:8000](http://localhost:8000), if your system has Python2 or Python3 installed. You can also use another web server of your choice.

## Prerequisite Knowledge

I strongly recommend a understanding of the following basic linear algebra topics:

* Vectors
* Dot product
* Linearity
* Matrices
* Matrix multiplication
* Elementary row operations
* Gauss Jordan Elimination
* Computing the determinant of a matrix
* Computing the inverse of a matrix

If you're unfamiliar with these topics, the following are good resources:

* The [Essence of Linear Algebra](https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab) video series on YouTube from [3Blue1Brown](https://www.youtube.com/@3blue1brown) provides an interesting and approachable introduction to the core concepts of linear algebra. It does a good job of building a conceptual understanding, but it's light on mechanics.

* If you want to explore linear algebra more in depth, the legendary Gilbert Strang's [Introduction to Linear Algebra](https://math.mit.edu/~gs/linearalgebra/ila5/indexila5.html) is a great book and was the book that was used in the linear algebra course I took in college.

## General Overview of Code Base

* [Matrix](./src/matrix.mjs) A class that has methods for basic operations that can be performed on matrices and vectors (Matrices that have one dimension of size 1 can use the vector operations)

* [scale(x, y)](./src/transform.mjs) A function that generates a scale matrix

* [rotate(degrees)](./src/transform.mjs) A function that generates a rotation matrix

* [translate(x, y)](./src/transform.mjs) A function that generates a translation matrix

* [parseTransformCommands(commands)](./src/transform.mjs) Parses a string containing transform commands into an array of command objects

* [computeTransformMatrix(commands)](./src/transform.mjs) Takes a string containing transform commands and returns a matrix encoding the associated affine transformations

* [transform(imageData, commands)](./src/transform.mjs) Takes [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) and transform commands and returns a copy of the [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) with the commands applied

* [getBitmap(selector)](./src/bitmap.mjs) Takes a CSS selector and returns the image data of the selected image

* [imageDataToImage(imageData)](./src/bitmap.mjs) Produces a data url from the provided image data

* [getPixel(imageData, x, y)](./src/bitmap.mjs) Returns an [Uint8ClampedArray](./https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray) of the RGBA values of the selected pixel

* [setPixel(imageData, x, y, color)](./src/bitmap.mjs) Writes a RGBA color to the image data at the specified pixel

## Unit tests

If you would like to contribute to this project, there is a suite of tests written with [Jest](https://jestjs.io). These tests can be ran by running `./tests.sh` (will not work on Windows) from the [tests](./tests) directory. This project is also configured to work with VSCode's Jest extension and the test suite can be ran and debugged via it.




