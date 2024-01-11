/**
 * The `Matter.Render` module is a simple canvas based renderer for visualising instances of `Matter.Engine`.
 * It is intended for development and debugging purposes, but may also be suitable for simple games.
 * It includes a number of drawing options including wireframe, vector with support for sprites and viewports.
 *
 * @class Render
 */

console.log("Render");

var Render = {};

//module.exports = Render;

//var Body = require('../body/Body');
//var Common = require('../core/Common');
//var Composite = require('../body/Composite');
//var Bounds = require('../geometry/Bounds');
//var Events = require('../core/Events');
//var Vector = require('../geometry/Vector');
//var Mouse = require('../core/Mouse');

(function () {
  var _requestAnimationFrame;

  if (typeof window !== "undefined") {
    _requestAnimationFrame =
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback) {
        window.setTimeout(function () {
          callback(Common.now());
        }, 1000 / 60);
      };
  }

  Render._goodDelta = 1000 / 60;

  Render.create = function (options) {
    var defaults = {
      engine: null,
      element: null,
      canvas: null,
      frameRequestId: null,
      timing: {
        delta: 0,
        lastTime: 0,
      },
      options: {
        width: 800,
        height: 600,
        pixelRatio: 1,
        background: "#14151f",
      },
    };

    var render = Common.extend(defaults, options);

    render.engine = options.engine;
    render.canvas = _createCanvas(render.options.width, render.options.height);
    render.context = render.canvas.getContext("2d");
    render.textures = {};

    render.element.appendChild(render.canvas);

    return render;
  };

  Render.run = function (render) {
    (function loop(time) {
      if (Render.running) render.frameRequestId = _requestAnimationFrame(loop);

      _updateTiming(render, time);

      Render.world(render, time);
    })();
  };

  Render.world = function (render, time) {
    var startTime = Common.now(),
      engine = render.engine,
      world = engine.world,
      canvas = render.canvas,
      context = render.context,
      options = render.options,
      timing = render.timing;

    var allBodies = Composite.allBodies(world),
      background = options.background,
      bodies = [],
      i;

    // apply background if it has changed
    render.canvas.style.background = background;

    // clear the canvas with a transparent fill, to allow the canvas background to show
    context.globalCompositeOperation = "source-in";
    context.fillStyle = "transparent";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "source-over";

    bodies = allBodies;

    Render.bodies(render, bodies, context);
  };

  Render.bodies = function (render, bodies, context) {
    var c = context,
      body,
      part,
      i,
      k;

    for (i = 0; i < bodies.length; i++) {
      body = bodies[i];

      if (!body.render.visible) continue;

      // handle compound parts
      for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
        part = body.parts[k];

        if (body.isSleeping) {
          c.globalAlpha = 0.5 * part.render.opacity;
        } else if (part.render.opacity !== 1) {
          c.globalAlpha = part.render.opacity;
        }

        // 이미지 렌더링
        if (part.render.sprite && part.render.sprite.texture) {
          // part sprite
          var sprite = part.render.sprite,
            texture = _getTexture(render, sprite.texture);

          c.translate(part.position.x, part.position.y);
          c.rotate(part.angle);

          c.drawImage(
            texture,
            texture.width * -sprite.xOffset * sprite.xScale,
            texture.height * -sprite.yOffset * sprite.yScale,
            texture.width * sprite.xScale,
            texture.height * sprite.yScale,
          );

          // revert translation, hopefully faster than save / restore
          c.rotate(-part.angle);
          c.translate(-part.position.x, -part.position.y);
        } else {
          // part polygon
          if (part.circleRadius) {
            c.beginPath();
            c.arc(
              part.position.x,
              part.position.y,
              part.circleRadius,
              0,
              2 * Math.PI,
            );
          } else {
            c.beginPath();
            c.moveTo(part.vertices[0].x, part.vertices[0].y);

            for (var j = 1; j < part.vertices.length; j++) {
              c.lineTo(part.vertices[j].x, part.vertices[j].y);
            }
            c.lineTo(part.vertices[0].x, part.vertices[0].y);
            c.closePath();
          }

          c.fillStyle = part.render.fillStyle;
          c.fill();
        }

        c.globalAlpha = 1;
      }
    }
  };

  var _updateTiming = function (render, time) {
    var engine = render.engine,
      timing = render.timing;

    timing.delta = time - timing.lastTime || Render._goodDelta;
    timing.lastTime = time;
  };

  var _createCanvas = function (width, height) {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  };

  var _getTexture = function (render, imagePath) {
    var image = render.textures[imagePath];

    if (image) return image;

    image = render.textures[imagePath] = new Image();
    image.src = imagePath;

    return image;
  };

  Render.running = true;
  Render.stop = function () {
    Render.running = false;
  };
})();
