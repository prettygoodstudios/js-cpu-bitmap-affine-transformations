# CPU Bitmap Affine Transformations


## Introduction

The purpose of this repository is to be an educational resource on the math behind the CSS [transform](https://developer.mozilla.org/en-US/docs/Web/CSS/transform) property. It's self-contained, therefore, no third party libraries or build system is used. Even though CSS [transform](https://developer.mozilla.org/en-US/docs/Web/CSS/transform) is hardware accelerated via the GPU I decided to stay away from `WebGL` to keep the focus on the math. 

## Getting it up and running

This project is built using native ES modules, therefore, you'll need to serve up the `index.html` page with a web server (See the [troubleshooting section of the MDN ES module guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#troubleshooting) for a more detailed explanation). Running `sh run.sh` (will not work on Windows) from the root directory of this repository will start up a web server serving up the right files at [http://localhost:8000](http://localhost:8000), if your system has Python2 or Python3 installed. You can also use another web server of your choice.

## Unit tests

If you would like to contribute to this project, there is a suite of tests written with [Jest](https://jestjs.io). These tests can be ran by running `sh tests.sh` (will not work on Windows) from the `tests` directory. This project is also configured to work with VSCode's Jest extension and the test suite can be ran and debugged via it.




