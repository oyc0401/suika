/**
 * The `Matter.Bodies` module contains factory methods for creating rigid body models
 * with commonly used body configurations (such as rectangles, circles and other polygons).
 *
 * See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
 *
 * @class Bodies
 */

// TODO: true circle bodies

console.log("Bodies");

var Bodies = {};

//module.exports = Bodies;

//var Vertices = require('../geometry/Vertices');
//var Common = require('../core/Common');
//var Body = require('../body/Body');
//var Bounds = require('../geometry/Bounds');
//var Vector = require('../geometry/Vector');

(function () {
  /**
   * Creates a new rigid body model with a rectangle hull.
   * The options parameter is an object that specifies any properties you wish to override the defaults.
   * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
   * @method rectangle
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {object} [options]
   * @return {body} A new rectangle body
   */
  Bodies.rectangle = function (x, y, width, height, options) {
    options = options || {};

    var rectangle = {
      label: "Rectangle Body",
      position: { x: x, y: y },
      vertices: Vertices.fromPath(
        "L 0 0 L " + width + " 0 L " + width + " " + height + " L 0 " + height,
      ),
    };

    if (options.chamfer) {
      var chamfer = options.chamfer;
      rectangle.vertices = Vertices.chamfer(
        rectangle.vertices,
        chamfer.radius,
        chamfer.quality,
        chamfer.qualityMin,
        chamfer.qualityMax,
      );
      delete options.chamfer;
    }

    return Body.create(Common.extend({}, rectangle, options));
  };

  /**
   * Creates a new rigid body model with a circle hull.
   * The options parameter is an object that specifies any properties you wish to override the defaults.
   * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
   * @method circle
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   * @param {object} [options]
   * @param {number} [maxSides]
   * @return {body} A new circle body
   */
  Bodies.circle = function (x, y, radius, options, maxSides) {
    // yuchan: 1
    options = options || {};

    var circle = {
      label: "Circle Body",
      circleRadius: radius,
    };

    // approximate circles with polygons until true circles implemented in SAT
    maxSides = maxSides || 25;
    var sides = Math.ceil(Math.max(10, Math.min(maxSides, radius)));

    // optimisation: always use even number of sides (half the number of unique axes)
    if (sides % 2 === 1) sides += 1;

    return Bodies.polygon(
      x,
      y,
      sides,
      radius,
      Common.extend({}, circle, options),
    );
  };

  /**
   * Creates a new rigid body model with a regular polygon hull with the given number of sides.
   * The options parameter is an object that specifies any properties you wish to override the defaults.
   * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
   * @method polygon
   * @param {number} x
   * @param {number} y
   * @param {number} sides
   * @param {number} radius
   * @param {object} [options]
   * @return {body} A new regular polygon body
   */
  Bodies.polygon = function (x, y, sides, radius, options) {
    options = options || {};

    if (sides < 3) return Bodies.circle(x, y, radius, options);

    var theta = (2 * Math.PI) / sides,
      path = "",
      offset = theta * 0.5;

    for (var i = 0; i < sides; i += 1) {
      var angle = offset + i * theta,
        xx = Math.cos(angle) * radius,
        yy = Math.sin(angle) * radius;

      path += "L " + xx.toFixed(3) + " " + yy.toFixed(3) + " ";
    }

    var polygon = {
      label: "Polygon Body",
      position: { x: x, y: y },
      vertices: Vertices.fromPath(path),
    };

    if (options.chamfer) {
      var chamfer = options.chamfer;
      polygon.vertices = Vertices.chamfer(
        polygon.vertices,
        chamfer.radius,
        chamfer.quality,
        chamfer.qualityMin,
        chamfer.qualityMax,
      );
      delete options.chamfer;
    }

    return Body.create(Common.extend({}, polygon, options));
  };
})();
