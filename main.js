console.log("main");

//import {
//Engine,
//Render,
//Runner,
//Bodies,
// World,
//Body,
// Sleeping,
// Events,
//} from "matter-js";

engine = Engine.create();
const render = Render.create({
  engine,
  element: document.getElementById("app"),
  options: {
    background: "transparent",
    width: 590 + 200,
    height: 800+200,
  },
});
// 통 내부의 너비: 560
// 통 내부의 높이: 680
const boxW = 15;
const pl=100;

const world = engine.world;

const ground = Bodies.rectangle(295+pl, 795, 590, boxW, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});
const leftWallTrans = Bodies.rectangle(7.5+pl, 200, 15+pl+pl, 790, {
  isStatic: true,
  render: { fillStyle: "transparent" },
});
const rightWallTrans = Bodies.rectangle(582.5+pl, 200, 15+pl+pl, 790, {
  isStatic: true,
  render: { fillStyle: "transparent" },
});
const leftWall = Bodies.rectangle(7+pl,480, 15, 630, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});
const rightWall = Bodies.rectangle(582.5+pl, 480, 15, 630, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});

const boxFront = Bodies.rectangle(590 / 2+pl, 165 + 7.5, 590, 15, {
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#E6B143" },
});
const boxBack = Bodies.rectangle(590 / 2+pl, 115 + 7.5, 490, 15, {
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#E6B143" },
});
const boxleft = Bodies.rectangle(22.5+pl, 145 + 7.5, 90, 15, {
  isStatic: true,
  angle: -Math.PI / 4,
  isSensor: true,
  render: { fillStyle: "#E6B143" },
});
const boxright = Bodies.rectangle(560+pl, 145-7.5 + 7.5, 90-20, 15, {
  isStatic: true,
  angle: Math.PI / 4,
  isSensor: true,
  render: { fillStyle: "#E6B143" },
});

// 경계선 높이: 110
const topLine = Bodies.rectangle(310+pl, 60, 620, 100, {
  isStatic: true,
  render: { fillStyle: "transparent" },
  label: "topLine",
});
const redline = Bodies.rectangle(310+pl, 110, 620, 2, {
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#FF0000" },
  label: "redline",
});
const hintLine = Bodies.rectangle(295+pl, 510, 4, 800, {
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#FFFFFF" },
});
const cloud = Bodies.rectangle(295 + 50+pl, 110 - 30, 180, 90, {
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#FFFFFF" },
});

World.add(world, [
  boxBack,
  hintLine,
  ground,
  leftWall,
  rightWall,
  boxleft,
  boxright,
  cloud,
  leftWallTrans,
  rightWallTrans,
  boxFront,

  redline,
  topLine,
]);

Render.run(render);
Runner.run(engine);

let currentBody = null;
let currentFruit = null;
let interval = null;
let disableAction = false;
let restitution = 0.1;
let lastPosition = 295+pl;

function addNewFruit() {
  const randomFruit = getRandomFruit();

  const body = Bodies.circle(lastPosition, 110+pl, randomFruit.radius, {
    label: randomFruit.label,
    isStatic: true,
    isSensor: true,
    render: {
      fillStyle: randomFruit.color,
      sprite: { texture: `./public/${randomFruit.label}.png` },
    },
    restitution: restitution,
  });
  hintLine.render.fillStyle = "white";
  currentBody = body;
  currentFruit = randomFruit;

  World.add(world, body);
  upbox();
}
// const testFruits = [7, 1, 7, 5, 0, 5, 5, 3, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4];
const testFruits = [9, 10, 8, 7, 6, 5, 5, 3, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4];
let testIdx = 0;

function getRandomFruit() {
  let randomIndex = Math.floor(Math.random() * 5);
  //테스트용
  // randomIndex = testFruits[testIdx];
  // testIdx += 1;

  const fruit = FRUITS[randomIndex];
  // if (currentFruit && currentFruit.label === fruit.label)
  //   return getRandomFruit();
  return fruit;
}

function dropFruit(nowBody) {
  hintLine.render.fillStyle = "transparent";
  const body = Bodies.circle(
    nowBody.position.x,
    nowBody.position.y,
    currentFruit.radius,
    {
      label: currentFruit.label,
      render: {
        fillStyle: currentFruit.color,
        sprite: { texture: `./public/${currentFruit.label}.png` },
      },
      restitution: restitution,
    },
  );

  currentBody = body;
  World.remove(world, nowBody);

  World.add(world, body);
  upbox();
}

function offline() {
  World.remove(world, topLine);
  topLine.isSensor = true;
  // topLine.render.fillStyle = "white";
  World.add(world, topLine);
}

function online() {
  World.remove(world, topLine);
  topLine.isSensor = false;
  // topLine.render.fillStyle = "red";
  World.add(world, topLine);
}

function upbox() {
  World.remove(world, boxFront);
  World.add(world, boxFront);
}

function afterCol() {
  if (currentBody.position.y - currentBody.circleRadius < 110+pl) {
    gameover();
  }
  currentBody = null;
  online();
  addNewFruit();
  disableAction = false;
}

function gameover() {
  if (disableAction) return;
  alert("게임 오버");
  disableAction = true;
  Render.stop();
  Runner.stop();
}

window.onkeydown = (event) => {
  if (disableAction) return;

  switch (event.code) {
    case "ArrowLeft":
      if (interval) return;
      interval = setInterval(() => {
        if (currentBody.position.x - 53 > 15+pl && !disableAction) {
          Body.setPosition(currentBody, {
            x: currentBody.position.x - 1,
            y: currentBody.position.y,
          });
          Body.setPosition(hintLine, {
            x: hintLine.position.x - 1,
            y: hintLine.position.y,
          });
          Body.setPosition(cloud, {
            x: cloud.position.x - 1,
            y: cloud.position.y,
          });
        }
      }, 5);
      break;
    case "ArrowRight":
      if (interval) return;
      interval = setInterval(() => {
        if (currentBody.position.x + 53 < 575+pl && !disableAction) {
          Body.setPosition(currentBody, {
            x: currentBody.position.x + 1,
            y: currentBody.position.y,
          });
          Body.setPosition(hintLine, {
            x: hintLine.position.x + 1,
            y: hintLine.position.y,
          });
          Body.setPosition(cloud, {
            x: cloud.position.x + 1,
            y: cloud.position.y,
          });
        }
      }, 5);
      break;
    case "Space":
      //console.log(currentBody);
      offline();
      dropFruit(currentBody);
      disableAction = true;

      lastPosition = currentBody.position.x;
  }
};

window.onkeyup = (event) => {
  switch (event.code) {
    case "ArrowLeft":
    case "ArrowRight":
      clearInterval(interval);
      interval = null;
  }
};

Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    // 과일 병합
    if (
      collision.bodyA.label === collision.bodyB.label &&
      !collision.bodyA.isSensor &&
      !collision.bodyB.isSensor
    ) {
      //console.log(collision.bodyA, collision.bodyB);
      World.remove(world, [collision.bodyA, collision.bodyB]);

      const index = FRUITS.findIndex(
        (fruit) => fruit.label === collision.bodyA.label,
      );

      // If last fruit, do nothing
      if (index === FRUITS.length - 1) return;

      const newFruit = FRUITS[index + 1];
      const body = Bodies.circle(
        collision.collision.supports[0].x,
        collision.collision.supports[0].y,
        newFruit.radius,
        {
          render: {
            fillStyle: newFruit.color,
            //sprite: { texture: `./public/${newFruit.label}.png` },
          },
          label: newFruit.label,
        },
      );

      World.add(world, body);
      if (body.position.y - body.circleRadius < 110) {
        gameover();
      }
    }

    // 천장에 닿으면
    if (
      (collision.bodyA.label === "topLine" ||
        collision.bodyB.label === "topLine") &&
      !disableAction
    ) {
      gameover();
    }

    // 다음 과일
    if (
      !collision.bodyA.isSensor &&
      !collision.bodyB.isSensor &&
      (collision.bodyA == currentBody || collision.bodyB == currentBody)
    ) {
      afterCol();
    }
  });
});

addNewFruit();
