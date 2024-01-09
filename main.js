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
  element: document.body,
  options: {
    wireframes: false,
    background: "#F7F4C8",
    width: 620,
    height: 850,
  },
});

const world = engine.world;

const ground = Bodies.rectangle(310, 820, 620, 60, {
  isStatic: true,
  render: {
    fillStyle: "#E6B143",
  },
});
const leftWall = Bodies.rectangle(15, 395, 30, 790, {
  isStatic: true,
  render: {
    fillStyle: "transparent",
  },
});
const rightWall = Bodies.rectangle(605, 395, 30, 790, {
  isStatic: true,
  render: {
    fillStyle: "transparent",
  },
});
const leftWallColor = Bodies.rectangle(15, 395+55+50+10, 30, 790-110, {
  isStatic: true,
  isSleeping:true,
  render: {
    fillStyle: "#E6B143",
  },
});
const rightWallColor = Bodies.rectangle(605, 395+55+50+10, 30, 790-110, {
  isStatic: true,
  isSleeping:true,
  render: {
    fillStyle: "#E6B143",
  },
});



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

const boxFront = Bodies.rectangle(310, 180, 620, 20, {
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#E6B143" },
});
const boxBack = Bodies.rectangle(310, 130, 620, 20, {
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#E6B143" },
});


World.add(world, [
  ground,
  leftWall,
  rightWall,
  leftWallColor,
   rightWallColor,
  boxFront,
  boxBack,
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

  const body = Bodies.circle(300, 50, randomFruit.radius, {
    label: randomFruit.label,
    isSleeping: true,
    isSensor: true,
    render: {
      fillStyle: randomFruit.color,
      //sprite: { texture: `./public/${randomFruit.label}.png` },
    },
    restitution: 0.2,
  });

  currentBody = body;
  currentFruit = randomFruit;

  World.add(world, body);
}

function getRandomFruit() {
  let randomIndex = Math.floor(Math.random() * 5);

  // //테스트용
  // randomIndex = testFruits[testIdx];
  // testIdx += 1;

  const fruit = FRUITS[randomIndex];

  if (currentFruit && currentFruit.label === fruit.label)
    return getRandomFruit();

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
        //sprite: { texture: `./public/${randomFruit.label}.png` },
      },
      restitution: 0.2,
    },
  );

  currentBody = body;
  World.remove(world, nowBody);

  World.add(world, body);
}

window.onkeydown = (event) => {
  if (disableAction) return;

  switch (event.code) {
    case "ArrowLeft":
      if (interval) return;
      interval = setInterval(() => {
        if (currentBody.position.x - currentBody.circleRadius > 30)
          Body.setPosition(currentBody, {
            x: currentBody.position.x - 1,
            y: currentBody.position.y,
          });
      }, 5);
      break;
    case "ArrowRight":
      if (interval) return;
      interval = setInterval(() => {
        if (currentBody.position.x + currentBody.circleRadius < 590)
          Body.setPosition(currentBody, {
            x: currentBody.position.x + 1,
            y: currentBody.position.y,
          });
      }, 5);
      break;
    case "Space":
      offline();
      putFruit(currentBody);
      disableAction = true;
      upbox();
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

window.onkeyup = (event) => {
  switch (event.code) {
    case "ArrowLeft":
    case "ArrowRight":
      clearInterval(interval);
      interval = null;
  }
};

function upbox() {
  World.remove(world, boxFront);
  World.add(world, boxFront);
}

Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    if (collision.bodyA.label === collision.bodyB.label) {
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
