/**
 * The `Matter.Engine` module contains methods for creating and manipulating engines.
 * An engine is a controller that manages updating the simulation of the world.
 * See `Matter.Runner` for an optional game loop utility.
 *
 * See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
 *
 * @class Engine
 */

console.log("Engine");

var Engine = {};

//module.exports = Engine;

//var Sleeping = require('./Sleeping');
//var Resolver = require('../collision/Resolver');
//var Detector = require('../collision/Detector');
//var Pairs = require('../collision/Pairs');
//var Events = require('./Events');
//var Composite = require('../body/Composite');
//var Constraint = require('../constraint/Constraint');
//var Common = require('./Common');
//var Body = require('../body/Body');

(function () {
  /**
   * Creates a new engine. The options parameter is an object that specifies any properties you wish to override the defaults.
   * All properties have default values, and many are pre-calculated automatically based on other properties.
   * See the properties section below for detailed information on what you can pass via the `options` object.
   * @method create
   * @param {object} [options]
   * @return {engine} engine
   */
  Engine.create = function (options) {
    options = options || {};

    var defaults = {
      positionIterations: 6,
      velocityIterations: 4,

      events: [],
      gravity: {
        x: 0,
        y: 1,
        scale: 0.001,
      },
      timing: {
        timestamp: 0,
        timeScale: 1,
        lastDelta: 0,
        lastElapsed: 0,
      },
    };

    var engine = Common.extend(defaults, options);

    engine.world = options.world || Composite.create({ label: "World" });
    engine.pairs = options.pairs || Pairs.create();
    engine.detector = options.detector || Detector.create();

    // for temporary back compatibility only
    engine.world.gravity = engine.gravity;

    return engine;
  };

  Engine.update = function (engine, delta) {
    // console.log(delta);
    var startTime = Common.now();

    var world = engine.world,
      detector = engine.detector,
      pairs = engine.pairs,
      timing = engine.timing,
      timestamp = timing.timestamp,
      i;

    delta *= timing.timeScale;

    // increment timestamp
    timing.timestamp += delta;
    timing.lastDelta = delta;

    // get all bodies and all constraints in the world
    var allBodies = Composite.allBodies(world);
    //console.log(allBodies)

    // if the world has changed
    if (world.isModified) {
      // update the detector bodies
      Detector.setBodies(detector, allBodies);

      // reset all composite modified flags
      Composite.setModified(world, false, false, true);
    }

    // apply gravity to all bodies
    Engine._bodiesApplyGravity(allBodies, engine.gravity);

    // update all body position and rotation by integration
    if (delta > 0) {
      Engine._bodiesUpdate(allBodies, delta);
    }

    // find all collisions
    detector.pairs = engine.pairs;
    var collisions = Detector.collisions(detector);

    //console.log(pairs)

    // update collision pairs
    Pairs.update(pairs, collisions, timestamp);

    // trigger collision events
    if (pairs.collisionStart.length > 0) {
      Events.trigger(engine, "collisionStart", {
        pairs: pairs.collisionStart,
        timestamp: timing.timestamp,
        delta: delta,
      });
    }

    // iteratively resolve position between collisions
    var positionDamping = 1;
    //console.log(engine.positionIterations);
    Resolver.preSolvePosition(pairs.list);
    for (i = 0; i < engine.positionIterations; i++) {
      //console.log("dsad");
      Resolver.solvePosition(pairs.list, delta, positionDamping);
    }
    Resolver.postSolvePosition(allBodies);

    // iteratively resolve velocity between collisions
    Resolver.preSolveVelocity(pairs.list);
    for (i = 0; i < engine.velocityIterations; i++) {
      Resolver.solveVelocity(pairs.list, delta);
    }

    // clear force buffers
    Engine._bodiesClearForces(allBodies);

    // log the time elapsed computing this update
    engine.timing.lastElapsed = Common.now() - startTime;

    return engine;
  };

  /**
   * Zeroes the `body.force` and `body.torque` force buffers.
   * @method _bodiesClearForces
   * @private
   * @param {body[]} bodies
   */
  Engine._bodiesClearForces = function (bodies) {
    var bodiesLength = bodies.length;

    for (var i = 0; i < bodiesLength; i++) {
      var body = bodies[i];

      // reset force buffers
      body.force.x = 0;
      body.force.y = 0;
      body.torque = 0;
    }
  };

  Engine._bodiesApplyGravity = function (bodies, gravity) {
    var gravityScale = gravity.scale,
      bodiesLength = bodies.length;

    if ((gravity.x === 0 && gravity.y === 0) || gravityScale === 0) {
      return;
    }

    for (var i = 0; i < bodiesLength; i++) {
      var body = bodies[i];

      if (body.isStatic || body.isSleeping) continue;

      // add the resultant force of gravity
      body.force.y += body.mass * gravity.y * gravityScale;
      body.force.x += body.mass * gravity.x * gravityScale;
    }
  };

  Engine._bodiesUpdate = function (bodies, delta) {
    var bodiesLength = bodies.length;

    for (var i = 0; i < bodiesLength; i++) {
      var body = bodies[i];

      if (body.isStatic || body.isSleeping) continue;

      Body.update(body, delta);
    }
  };
})();
