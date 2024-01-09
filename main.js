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
    wireframes: false,
    background: "#F7F4C8",
    width: 590,
    height: 800,
  },
});
// 통 내부의 너비: 560
// 통 내부의 높이: 680
const boxW=15;

const world = engine.world;

const ground = Bodies.rectangle(310, 795, 600, boxW, {
  isStatic: true,
  render: {
    fillStyle: "#E6B143",
  },
});
const leftWallTrans = Bodies.rectangle(7.5, 200, 15, 790, {
  isStatic: true,
  render: {
   fillStyle: "transparent",
  },
});
const rightWallTrans = Bodies.rectangle(582.5, 200, 15, 790, {
  isStatic: true,
  render: {
   fillStyle: "transparent",
  },
});
const leftWall = Bodies.rectangle(7, 510, 15, 680, {
  isStatic: true,
  render: {
    fillStyle: "#E6B143",
  },
});
const rightWall = Bodies.rectangle(582.5, 510, 15, 680, {
  isStatic: true,
  render: {
    fillStyle: "#E6B143",
  },
});

const boxFront = Bodies.rectangle(590/2, 165+7.5, 600, 15, {
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#E6B143" },
});
const boxBack = Bodies.rectangle(590/2, 115+7.5, 490, 15, {
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#E6B143" },
});
const boxleft = Bodies.rectangle(22.5, 145+7.5, 90, 15, {
  isStatic: true,
  angle: -Math.PI / 4,
  isSensor: true,
  render: {
    fillStyle: "#E6B143",
  },
});
const boxright = Bodies.rectangle(570-2.5, 145+7.5, 90, 15, {
  isStatic: true,
  angle: Math.PI / 4,
  isSensor: true,
  render: {
    fillStyle: "#E6B143",
  },
});

// 경계선 높이: 110
const topLine = Bodies.rectangle(310, 60, 620, 100, {
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "transparent" },
  label: "topLine",
});
const redline = Bodies.rectangle(310, 110, 620, 2, {
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#FF0000" },
  label: "redline",
});



World.add(world, [
  ground,
  leftWall,
  rightWall,
  leftWallTrans,
  rightWallTrans,
  boxFront,
  boxBack,
  boxleft,
  boxright,
  redline,
  topLine,

]);

Render.run(render);
Runner.run(engine);

let currentBody = null;
let currentFruit = null;
let interval = null;
let disableAction = false;

function addCurrentFruit() {
  const randomFruit = getRandomFruit();

  const body = Bodies.circle(300, 110, randomFruit.radius, {
    label: randomFruit.label,
    isSleeping: true,
    isSensor: true,
    render: {
      fillStyle: randomFruit.color,
      sprite: { texture: `./public/${randomFruit.label}.png` },
    },
    restitution: 0.2,
  });

  currentBody = body;
  currentFruit = randomFruit;

  World.add(world, body);
}

const testFruits = [9, 10, 8, 7, 6, 5, 5, 3, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4];
let testIdx = 0;

function getRandomFruit() {
  let randomIndex = Math.floor(Math.random() * 5);
  //테스트용
  randomIndex = testFruits[testIdx];
  testIdx += 1;
  const fruit = FRUITS[randomIndex];
  // if (currentFruit && currentFruit.label === fruit.label)
  //   return getRandomFruit();
  return fruit;
}

function putFruit(nowBody) {
  const body = Bodies.circle(
    nowBody.position.x,
    nowBody.position.y,
    currentFruit.radius,
    {
      label: currentFruit.label,
      render: {
        fillStyle: currentFruit.color,
       // sprite: { texture: `./public/${currentFruit.label}.png` },
      },
      restitution: 0.2,
    },
  );

  currentBody = body;
  World.remove(world, nowBody);

  World.add(world, body);
}

function offline() {
  World.remove(world, topLine);
  topLine.isSensor = true;
  World.add(world, topLine);
}

function online() {
  World.remove(world, topLine);
  topLine.isSensor = false;
  World.add(world, topLine);
}

function upbox() {
  World.remove(world, boxFront);
  World.add(world, boxFront);
}

window.onkeydown = (event) => {
  if (disableAction) return;

  switch (event.code) {
    case "ArrowLeft":
      if (interval) return;
      interval = setInterval(() => {
        if (
          currentBody.position.x - currentBody.circleRadius > 15 &&
          !disableAction
        )
          Body.setPosition(currentBody, {
            x: currentBody.position.x - 1,
            y: currentBody.position.y,
          });
      }, 5);
      break;
    case "ArrowRight":
      if (interval) return;
      interval = setInterval(() => {
        if (
          currentBody.position.x + currentBody.circleRadius < 575 &&
          !disableAction
        )
          Body.setPosition(currentBody, {
            x: currentBody.position.x + 1,
            y: currentBody.position.y,
          });
      }, 5);
      break;
    case "Space":
      console.log(currentBody);
      offline();
      putFruit(currentBody);
      disableAction = true;
      upbox();
      lastPosition=currentBody.position.x
      setTimeout(() => {
        console.log(currentBody.position.y - currentBody.circleRadius);
        if (currentBody.position.y - currentBody.circleRadius < 110) {
          alert("넘었다고!");
        }
        online();
        addCurrentFruit();
        disableAction = false;
      }, 1000);
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
    if (collision.bodyA.label === collision.bodyB.label &&collision.bodyA.isSlepping==false && collision.bodyB.isSlepping==false  ) {
      console.log(collision.bodyA, collision.bodyB)
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
            // sprite: { texture: `./public/${newFruit.label}.png` },
          },
          label: newFruit.label,
        },
      );
      if (body.position.y - body.circleRadius < 110) {
        alert("합쳐져서 넘음!");
      }
      World.add(world, body);
    }
    if (
      (collision.bodyA.label === "topLine" ||
        collision.bodyB.label === "topLine") &&
      !disableAction
    ) {
      alert("Game over");
    }
  });
});

addCurrentFruit();
