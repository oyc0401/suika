/**
* The `Matter.Engine` module contains methods for creating and manipulating engines.
* An engine is a controller that manages updating the simulation of the world.
* See `Matter.Runner` for an optional game loop utility.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Engine
*/

console.log('Engine')

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

(function() {

    /**
     * Creates a new engine. The options parameter is an object that specifies any properties you wish to override the defaults.
     * All properties have default values, and many are pre-calculated automatically based on other properties.
     * See the properties section below for detailed information on what you can pass via the `options` object.
     * @method create
     * @param {object} [options]
     * @return {engine} engine
     */
    Engine.create = function(options) {
        options = options || {};

        var defaults = {
            positionIterations: 6,
            velocityIterations: 4,
            constraintIterations: 2,
            enableSleeping: false,
            events: [],
            plugin: {},
            gravity: {
                x: 0,
                y: 1,
                scale: 0.001
            },
            timing: {
                timestamp: 0,
                timeScale: 1,
                lastDelta: 0,
                lastElapsed: 0
            }
        };

        var engine = Common.extend(defaults, options);

        engine.world = options.world || Composite.create({ label: 'World' });
        engine.pairs = options.pairs || Pairs.create();
        engine.detector = options.detector || Detector.create();

        // for temporary back compatibility only
        engine.grid = { buckets: [] };
        engine.world.gravity = engine.gravity;
        engine.broadphase = engine.grid;
        engine.metrics = {};
        
        return engine;
    };

    /**
     * Moves the simulation forward in time by `delta` milliseconds.
     * Triggers `beforeUpdate`, `beforeSolve` and `afterUpdate` events.
     * Triggers `collisionStart`, `collisionActive` and `collisionEnd` events.
     * @method update
     * @param {engine} engine
     * @param {number} [delta=16.666]
     */
    Engine.update = function(engine, delta) {
        var startTime = Common.now();

        var world = engine.world,
            detector = engine.detector,
            pairs = engine.pairs,
            timing = engine.timing,
            timestamp = timing.timestamp,
            i;

        delta = typeof delta !== 'undefined' ? delta : Common._baseDelta;
        delta *= timing.timeScale;

        // increment timestamp
        timing.timestamp += delta;
        timing.lastDelta = delta;

        // create an event object
        var event = {
            timestamp: timing.timestamp,
            delta: delta
        };

        Events.trigger(engine, 'beforeUpdate', event);

        // get all bodies and all constraints in the world
        var allBodies = Composite.allBodies(world),
            allConstraints = Composite.allConstraints(world);

        // if the world has changed
        if (world.isModified) {
            // update the detector bodies
            Detector.setBodies(detector, allBodies);

            // reset all composite modified flags
            Composite.setModified(world, false, false, true);
        }

        // update sleeping if enabled
        if (engine.enableSleeping)
            Sleeping.update(allBodies, delta);

        // apply gravity to all bodies
        Engine._bodiesApplyGravity(allBodies, engine.gravity);

        // update all body position and rotation by integration
        if (delta > 0) {
            Engine._bodiesUpdate(allBodies, delta);
        }

        Events.trigger(engine, 'beforeSolve', event);

        // update all constraints (first pass)
        Constraint.preSolveAll(allBodies);
        for (i = 0; i < engine.constraintIterations; i++) {
            Constraint.solveAll(allConstraints, delta);
        }
        Constraint.postSolveAll(allBodies);

        // find all collisions
        detector.pairs = engine.pairs;
        var collisions = Detector.collisions(detector);

        // update collision pairs
        Pairs.update(pairs, collisions, timestamp);

        // wake up bodies involved in collisions
        if (engine.enableSleeping)
            Sleeping.afterCollisions(pairs.list);

        // trigger collision events
        if (pairs.collisionStart.length > 0) {
            Events.trigger(engine, 'collisionStart', { 
                pairs: pairs.collisionStart,
                timestamp: timing.timestamp,
                delta: delta
            });
        }

        // iteratively resolve position between collisions
        var positionDamping = Common.clamp(20 / engine.positionIterations, 0, 1);
        
        Resolver.preSolvePosition(pairs.list);
        for (i = 0; i < engine.positionIterations; i++) {
            Resolver.solvePosition(pairs.list, delta, positionDamping);
        }
        Resolver.postSolvePosition(allBodies);

        // update all constraints (second pass)
        Constraint.preSolveAll(allBodies);
        for (i = 0; i < engine.constraintIterations; i++) {
            Constraint.solveAll(allConstraints, delta);
        }
        Constraint.postSolveAll(allBodies);

        // iteratively resolve velocity between collisions
        Resolver.preSolveVelocity(pairs.list);
        for (i = 0; i < engine.velocityIterations; i++) {
            Resolver.solveVelocity(pairs.list, delta);
        }

        // update body speed and velocity properties
        Engine._bodiesUpdateVelocities(allBodies);

        // trigger collision events
        if (pairs.collisionActive.length > 0) {
            Events.trigger(engine, 'collisionActive', { 
                pairs: pairs.collisionActive, 
                timestamp: timing.timestamp,
                delta: delta
            });
        }

        if (pairs.collisionEnd.length > 0) {
            Events.trigger(engine, 'collisionEnd', {
                pairs: pairs.collisionEnd,
                timestamp: timing.timestamp,
                delta: delta
            });
        }

        // clear force buffers
        Engine._bodiesClearForces(allBodies);

        Events.trigger(engine, 'afterUpdate', event);

        // log the time elapsed computing this update
        engine.timing.lastElapsed = Common.now() - startTime;

        return engine;
    };
    
    /**
     * Merges two engines by keeping the configuration of `engineA` but replacing the world with the one from `engineB`.
     * @method merge
     * @param {engine} engineA
     * @param {engine} engineB
     */
    Engine.merge = function(engineA, engineB) {
        Common.extend(engineA, engineB);
        
        if (engineB.world) {
            engineA.world = engineB.world;

            Engine.clear(engineA);

            var bodies = Composite.allBodies(engineA.world);

            for (var i = 0; i < bodies.length; i++) {
                var body = bodies[i];
                Sleeping.set(body, false);
                body.id = Common.nextId();
            }
        }
    };

    /**
     * Clears the engine pairs and detector.
     * @method clear
     * @param {engine} engine
     */
    Engine.clear = function(engine) {
        Pairs.clear(engine.pairs);
        Detector.clear(engine.detector);
    };

    /**
     * Zeroes the `body.force` and `body.torque` force buffers.
     * @method _bodiesClearForces
     * @private
     * @param {body[]} bodies
     */
    Engine._bodiesClearForces = function(bodies) {
        var bodiesLength = bodies.length;

        for (var i = 0; i < bodiesLength; i++) {
            var body = bodies[i];

            // reset force buffers
            body.force.x = 0;
            body.force.y = 0;
            body.torque = 0;
        }
    };

    /**
     * Applies gravitational acceleration to all `bodies`.
     * This models a [uniform gravitational field](https://en.wikipedia.org/wiki/Gravity_of_Earth), similar to near the surface of a planet.
     * 
     * @method _bodiesApplyGravity
     * @private
     * @param {body[]} bodies
     * @param {vector} gravity
     */
    Engine._bodiesApplyGravity = function(bodies, gravity) {
        var gravityScale = typeof gravity.scale !== 'undefined' ? gravity.scale : 0.001,
            bodiesLength = bodies.length;

        if ((gravity.x === 0 && gravity.y === 0) || gravityScale === 0) {
            return;
        }
        
        for (var i = 0; i < bodiesLength; i++) {
            var body = bodies[i];

            if (body.isStatic || body.isSleeping)
                continue;

            // add the resultant force of gravity
            body.force.y += body.mass * gravity.y * gravityScale;
            body.force.x += body.mass * gravity.x * gravityScale;
        }
    };

    /**
     * Applies `Body.update` to all given `bodies`.
     * @method _bodiesUpdate
     * @private
     * @param {body[]} bodies
     * @param {number} delta The amount of time elapsed between updates
     */
    Engine._bodiesUpdate = function(bodies, delta) {
        var bodiesLength = bodies.length;

        for (var i = 0; i < bodiesLength; i++) {
            var body = bodies[i];

            if (body.isStatic || body.isSleeping)
                continue;

            Body.update(body, delta);
        }
    };

    /**
     * Applies `Body.updateVelocities` to all given `bodies`.
     * @method _bodiesUpdateVelocities
     * @private
     * @param {body[]} bodies
     */
    Engine._bodiesUpdateVelocities = function(bodies) {
        var bodiesLength = bodies.length;

        for (var i = 0; i < bodiesLength; i++) {
            Body.updateVelocities(bodies[i]);
        }
    };

    

})();
