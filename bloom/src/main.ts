import kaplay from "kaplay";
import type {
  Vec2,
  GameObj,
  SpriteComp,
  PosComp,
  AreaComp,
  HealthComp,
} from "kaplay";

const SCREEN_WIDTH: number = 320;
const SCREEN_HEIGHT: number = 240;
const FLOWER_SIZE: number = 32;
const BLOOM_WIDTH: number = 32;
const BLOOM_HEIGHT: number = 64;
const MAX_BLOOMS: number = 60;

// initialise context
const k = kaplay({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  scale: 3,
  stretch: false,
  letterbox: false,
  debug: false,
  font: "pixel",
  crisp: false,
  background: "#4a3052",
  texFilter: "nearest",
  global: false,
});

k.loadRoot("./"); // for itch.io publishing purposes

// load assets
k.loadMusic("song", "music/funny-bit.mp3");

k.loadFont("pixel", "fonts/kenney-pixel.ttf", {
  filter: "nearest",
  size: 16,
});

k.loadSprite("title", "sprites/title.png", {
  sliceX: 2,
  sliceY: 1,
  anims: {
    main: { from: 0, to: 1, loop: true, speed: 4 },
  },
});

k.loadSprite("rules", "sprites/rules.png", {
  sliceX: 2,
  sliceY: 1,
  anims: {
    main: { from: 0, to: 1, loop: true, speed: 4 },
  },
});

k.loadSprite("flower", "sprites/flower.png", {
  sliceX: 6,
  sliceY: 1,
  anims: {
    idle: { from: 0, to: 1, loop: true, speed: 3 },
    wilt: { from: 2, to: 3, loop: true, speed: 3 },
    dying: { from: 4, to: 5, loop: true, speed: 3 },
  },
});

k.loadSprite("bloom", "sprites/bloom.png", {
  sliceX: 7,
  sliceY: 1,
  anims: {
    grow: { from: 0, to: 6, loop: false, speed: 1 },
    bloom: { from: 3, to: 6, loop: false, speed: 1 },
    cut: { from: 2, to: 2 },
  },
});

k.loadSprite("gameover", "sprites/gameover.png", {
  sliceX: 2,
  sliceY: 1,
  anims: {
    main: { from: 0, to: 1, loop: true, speed: 4 },
  },
});

k.scene("title", () => {
  // add title screen
  k.add([k.sprite("title", { frame: 0, anim: "main" }), k.pos()]);

  // set volume
  k.setVolume(0.2);

  // play music
  k.play("song", { loop: true });

  // go to rules on click
  k.onClick(() => k.go("rules"));
});

k.scene("rules", () => {
  // add rules screen
  k.add([k.sprite("rules", { frame: 0, anim: "main" }), k.pos()]);

  // start game on click
  k.onClick(() => k.go("game"));
});

k.scene("game", () => {
  // add main flower
  const flower: GameObj<SpriteComp | PosComp | AreaComp | HealthComp> = k.add([
    k.sprite("flower", { frame: 0, anim: "idle" }),
    k.pos((SCREEN_WIDTH - FLOWER_SIZE) / 2, (SCREEN_HEIGHT - FLOWER_SIZE) / 2),
    k.area(),
    k.health(10, 100),
  ]);

  // keep track of bloom number
  let numBlooms: number = 0;

  // spawn bloom object
  function spawnBloom(): void {
    // don't add more blooms beyond maximum
    if (numBlooms >= MAX_BLOOMS) {
      return;
    }

    // add bloom
    const bloom: GameObj<SpriteComp | PosComp | AreaComp> = k.add([
      k.sprite("bloom", { frame: 0, anim: "grow" }),
      k.pos(generateCoords()),
      k.area(),
      "bloom",
    ]);

    numBlooms++;

    // add click event handlers
    bloom.onClick(() => cutBloom(bloom));
  }

  // generate coords so they don't overlap flower
  function generateCoords(): Vec2 {
    let coords: Vec2 = k.rand(
      k.vec2(SCREEN_WIDTH - BLOOM_WIDTH, SCREEN_HEIGHT - BLOOM_HEIGHT)
    );

    if (
      coords.x > flower.pos.x - BLOOM_WIDTH &&
      coords.x < flower.pos.x + FLOWER_SIZE &&
      coords.y > flower.pos.y - BLOOM_HEIGHT &&
      coords.y < flower.pos.y + FLOWER_SIZE
    ) {
      return generateCoords();
    }

    return coords;
  }

  // cut off head of bloom
  function cutBloom(bloom: GameObj): void {
    if (bloom.frame > 2) {
      if (bloom.frame === 5) flower.heal(1);
      else if (bloom.frame === 6) flower.heal(2);
      updateHealth();

      bloom.play("cut");
      k.wait(k.rand(5, 8), () => bloom.play("bloom"));
    }
  }

  // spawn bloom every 2 seconds
  k.loop(2, spawnBloom);

  // keep track of score
  let score: number = 0;

  const scoreLabel: GameObj = k.add([
    k.text(score.toString(), { size: 16 }),
    k.color("#ea6262"),
    k.pos(8, 0),
  ]);

  // keep track of health
  const healthLabel: GameObj = k.add([
    k.text(`${flower.hp()}/${flower.maxHP()}`, {
      size: 16,
    }),
    k.color("#ea6262"),
    k.pos(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 20),
    k.anchor("center"),
  ]);

  // update and display score
  function updateScore(): void {
    score++;
    scoreLabel.text = score.toString();
  }

  // update and display health
  function updateHealth(): void {
    healthLabel.text = `${flower.hp()}/${flower.maxHP()}`;
    updateSprite(flower.hp());
  }

  // update flower sprite based on health
  function updateSprite(health: number): void {
    if (health > 50 && flower.getCurAnim().name !== "idle") {
      flower.play("idle");
    } else if (
      health > 20 &&
      health <= 50 &&
      flower.getCurAnim().name !== "wilt"
    ) {
      flower.play("wilt");
    } else if (health <= 20 && flower.getCurAnim().name !== "dying") {
      flower.play("dying");
    }
  }

  // hurt flower based on number of blooms
  function hurtFlower(): void {
    if (numBlooms >= 50) flower.hurt(5);
    else if (numBlooms >= 40) flower.hurt(3);
    else if (numBlooms >= 30) flower.hurt(1);

    updateHealth();
  }

  // update score and hurt flower every second
  k.loop(1, () => {
    updateScore();
    hurtFlower();
  });

  flower.onDeath(() => k.go("lose", score));
});

k.scene("lose", (score) => {
  // add game over screen
  k.add([k.sprite("gameover", { frame: 0, anim: "main" }), k.pos()]);

  // add score
  k.add([
    k.text(score.toString(), { size: 32 }),
    k.color("#ea6262"),
    k.pos(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + FLOWER_SIZE),
    k.anchor("center"),
  ]);

  // restart game on click
  k.onClick(() => k.go("game"));
});

k.go("title");
