/**
 * The `Matter.Runner` module is an optional utility which provides a game loop,
 * that handles continuously updating a `Matter.Engine` for you within a browser.
 * It is intended for development and debugging purposes, but may also be suitable for simple games.
 * If you are using your own game loop instead, then you do not need the `Matter.Runner` module.
 * Instead just call `Engine.update(engine, delta)` in your own loop.
 *
 * See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
 *
 * @class Runner
 */

console.log("Runner");

var Runner = {};

//module.exports = Runner;

//var Events = require('./Events');
//var Engine = require('./Engine');
//var Common = require('./Common');

(function () {
  var _requestAnimationFrame;

  if (typeof window !== "undefined") {
    _requestAnimationFrame =
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame;
  }

  if (!_requestAnimationFrame) {
    _requestAnimationFrame = function (callback) {
      _frameTimeout = setTimeout(function () {
        callback(Common.now());
      }, 1000 / 60);
    };
  }

  Runner.create = function (options) {
    var defaults = {
      fps: 60,
      deltaSampleSize: 60,
      counterTimestamp: 0,
      frameCounter: 0,
      deltaHistory: [],
      timePrev: null,
      frameRequestId: null,
      enabled: true,
    };

    var runner = Common.extend(defaults, options);

    runner.delta = runner.delta || 1000 / runner.fps;
    runner.deltaMin = runner.deltaMin || 1000 / runner.fps;
    runner.deltaMax = runner.deltaMax || 1000 / (runner.fps * 0.5);
    runner.fps = 1000 / runner.delta;

    return runner;
  };

  Runner.run = function (runner, engine) {
    // create runner if engine is first argument
    if (typeof runner.positionIterations !== "undefined") {
      engine = runner;
      runner = Runner.create();
    }

    (function run(time) {
      if (Runner.running) runner.frameRequestId = _requestAnimationFrame(run);

      if (time && runner.enabled) {
        Runner.tick(runner, engine, time);
      }
    })();

    return runner;
  };

  Runner.tick = function (runner, engine, time) {
    var delta;

    // dynamic timestep based on wall clock between calls
    delta = time - runner.timePrev || runner.delta;
    runner.timePrev = time;

    // optimistically filter delta over a few frames, to improve stability
    runner.deltaHistory.push(delta);
    runner.deltaHistory = runner.deltaHistory.slice(-runner.deltaSampleSize);
    delta = Math.min.apply(null, runner.deltaHistory);

    //d(delta);

    // limit delta
    delta = delta < runner.deltaMin ? runner.deltaMin : delta;
    delta = delta > runner.deltaMax ? runner.deltaMax : delta;

    // update engine timing object
    runner.delta = delta;

    // fps counter
    runner.frameCounter += 1;
    if (time - runner.counterTimestamp >= 1000) {
      runner.fps =
        runner.frameCounter * ((time - runner.counterTimestamp) / 1000);
      runner.counterTimestamp = time;
      runner.frameCounter = 0;
    }

    Engine.update(engine, delta);
  };

  Runner.running = true;
  Runner.stop = function () {
    Runner.running = false;
  };
})();
