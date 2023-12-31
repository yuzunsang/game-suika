import { Events, Body, Bodies, Engine, Render, Runner, World } from "matter-js";
import { FRUITS } from "./fruits";

const engine = Engine.create();
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

const leftWall = Bodies.rectangle(15, 395, 30, 790, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});

const rightWall = Bodies.rectangle(605, 395, 30, 790, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});

const ground = Bodies.rectangle(310, 820, 620, 60, {
  isStatic: true,
  render: { fillStyle: "#E6B143" },
});

const topLine = Bodies.rectangle(310, 150, 560, 2, {
  name: "topLine",
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#ff0000" },
});

World.add(world, [leftWall, rightWall, ground, topLine]);

Render.run(render);
Runner.run(engine);

let currentBody = null;
let currentFruit = null;
let disableAction = false;
let interval = null;

// 점수 기록
const recordsScore = document.querySelector(".records__score");
recordsScore.innerHTML = `
<div class="records__curr card">
<h1 class="records__curr--title">SCORE</h1>
<h3 id="score" class="records__curr--score">0</h3>
</div>
<div class="records__high card">
<h1 class="records__high--title">HIGH SCORE</h1>
<h3 id="high" class="records__high--score">0</h3>
</div>
`;

// 최고 기록 갱신 시 localStorage에 저장
const score = document.querySelector("#score");
const high = document.querySelector("#high");
let record = localStorage.getItem("high-score");

if (record !== null) {
  high.innerText = record;
}

let isNextFruit = false;
let nextIndex = Math.floor(Math.random() * 5);

function addFruit() {
  let index = -1;

  if (!isNextFruit) {
    index = Math.floor(Math.random() * 5);
    isNextFruit = true;
  } else {
    index = nextIndex;
    nextIndex = Math.floor(Math.random() * 5);
  }
  const fruit = FRUITS[index];

  showNextFruit(); // 다음 과일 보여주기

  const body = Bodies.circle(300, 120, fruit.radius, {
    index: index,
    isSleeping: true,
    render: {
      sprite: { texture: `${fruit.name}.png` },
    },
    restitution: 0.2,
  });

  currentBody = body;
  currentFruit = fruit;

  World.add(world, [body]);
}

const showNextFruit = () => {
  const previewNext = document.querySelector(".preview__next");
  let nextFruit = FRUITS[nextIndex].name;

  previewNext.innerHTML = `
    <h1 class="preview__title">NEXT</h1>
    <img clas="preview__img" src="${nextFruit}.png" >
    `;
};

window.onkeydown = (event) => {
  if (disableAction) {
    return;
  }

  switch (event.code) {
    case "KeyA":
      if (interval) return;

      interval = setInterval(() => {
        if (currentBody.position.x - currentFruit.radius > 30) {
          Body.setPosition(currentBody, {
            x: currentBody.position.x - 2,
            y: currentBody.position.y,
          });
        }
      }, 2.5);

      break;

    case "KeyD":
      if (interval) return;

      interval = setInterval(() => {
        if (currentBody.position.x + currentFruit.radius < 590) {
          Body.setPosition(currentBody, {
            x: currentBody.position.x + 2,
            y: currentBody.position.y,
          });
        }
      }, 2.5);
      break;

    case "KeyS":
      currentBody.isSleeping = false;
      disableAction = true;
      engine.gravity.scale = 0.0025; // default보다 150% 상향

      setTimeout(() => {
        addFruit();
        disableAction = false;
      }, 670);
      break;
  }
};

window.onkeyup = (event) => {
  switch (event.code) {
    case "KeyA":
    case "KeyD":
      clearInterval(interval);
      interval = null;
  }
};

Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    if (collision.bodyA.index === collision.bodyB.index) {
      const index = collision.bodyA.index;

      if (index === FRUITS.length - 1) {
        return;
      }

      World.remove(world, [collision.bodyA, collision.bodyB]);

      score.innerText = parseInt(score.innerText) + FRUITS[index].score;

      if (parseInt(score.innerText) >= parseInt(high.innerText)) {
        localStorage.setItem("high-score", score.innerText);
        high.innerText = parseInt(score.innerText);
      }

      const newFruit = FRUITS[index + 1];

      const newBody = Bodies.circle(
        collision.collision.supports[0].x,
        collision.collision.supports[0].y,
        newFruit.radius,
        {
          render: {
            sprite: { texture: `${newFruit.name}.png` },
          },
          index: index + 1,
        }
      );

      World.add(world, newBody);
    }

    if (
      !disableAction &&
      (collision.bodyA.name === "topLine" || collision.bodyB.name === "topLine")
    ) {
      alert("Game Over.");
      location.reload();
    }
  });
});

addFruit();
