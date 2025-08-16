import kaplay from "kaplay";
import type { GameObj, AreaComp, Vec2 } from "kaplay";

const SCREEN_WIDTH: number = 320;
const SCREEN_HEIGHT: number = 240;
const FLOWER_SIZE: number = 32;
const BLOOM_WIDTH: number = 32;
const BLOOM_HEIGHT: number = 64;

// initialise context
const k = kaplay({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  scale: 3,
  stretch: true,
  letterbox: true,
  font: "pixel",
  crisp: true,
  background: "#4a3052",
  texFilter: "nearest",
  global: false,
});

k.loadRoot("./"); // for itch.io publishing purposes

// load assets
k.loadFont("pixel", "fonts/kenney-pixel.ttf", {
  filter: "nearest",
  size: 16,
});

k.loadSprite("flower", "sprites/flower.png", {
  sliceX: 3,
  sliceY: 1,
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

k.scene("game", () => {
  // add main flower
  const flower: GameObj = k.add([
    k.sprite("flower", { frame: 0 }),
    k.pos((SCREEN_WIDTH - FLOWER_SIZE) / 2, (SCREEN_HEIGHT - FLOWER_SIZE) / 2),
    k.area(),
    k.health(100, 100),
  ]);

  // spawn bloom object
  function spawnBloom(): void {
    // add bloom
    const bloom: GameObj<AreaComp> = k.add([
      k.sprite("bloom", { frame: 0, anim: "grow" }),
      k.pos(generateCoords()),
      k.area(),
      "bloom",
    ]);

    // add click event handlers
    bloom.onClick(() => cutBloom(bloom), "left");
    bloom.onClick(() => k.destroy(bloom), "right");
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
      bloom.play("cut");
      k.wait(k.rand(2, 5), () => bloom.play("bloom"));
    }
  }

  // spawn bloom every 5 seconds
  k.loop(5, spawnBloom);

  // keep track of score
  let score: number = 0;

  const scoreLabel: GameObj = k.add([
    k.text(score.toString(), { size: 16 }),
    k.color("#ea6262"),
    k.pos(8, 0),
  ]);

  // keep track of health
  const healthLabel: GameObj = k.add([
    k.text(flower.hp().toString(), { size: 16 }),
    k.color("#ea6262"),
    k.pos(8, 16),
  ]);

  // update and display score
  function updateScore(blooms: GameObj[]): void {
    const scoreToAdd: number = blooms
      .filter((bloom: GameObj) => bloom.frame > 2)
      .reduce((total: number, bloom: GameObj) => total + bloom.frame - 2, 0);
    score += scoreToAdd;
    scoreLabel.text = score.toString();
  }

  // update and display health
  function updateHealth(numBlooms: number, numFullBlooms: number): void {
    if (numBlooms <= 5) flower.heal(10);
    else if (numBlooms > 10) flower.hurt(numFullBlooms);

    healthLabel.text = flower.hp().toString();
  }

  // update score and health every second
  k.loop(1, () => {
    const blooms = k.get("bloom");
    const fullBlooms = blooms.filter((bloom: GameObj) => bloom.frame === 6);

    updateScore(blooms);
    updateHealth(blooms.length, fullBlooms.length);
  });
});

k.go("game");
