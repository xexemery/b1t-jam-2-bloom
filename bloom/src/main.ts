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
const MAX_BLOOMS: number = 50;

// initialise context
const k = kaplay({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  scale: 3,
  stretch: false,
  letterbox: false,
  font: "pixel",
  crisp: false,
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

k.loadSprite("title", "sprites/title.png", {
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

  // start game on click
  k.onClick(() => k.go("game"));
});

k.scene("game", () => {
  // add main flower
  const flower: GameObj<SpriteComp | PosComp | AreaComp | HealthComp> = k.add([
    k.sprite("flower", { frame: 0, anim: "idle" }),
    k.pos((SCREEN_WIDTH - FLOWER_SIZE) / 2, (SCREEN_HEIGHT - FLOWER_SIZE) / 2),
    k.area(),
    k.health(100, 100),
  ]);

  // keep track of bloom number
  let numBlooms: number = 0;

  // spawn bloom object
  function spawnBloom(): void {
    // don't add more blooms beyond maximum
    if (numBlooms > MAX_BLOOMS) {
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
    bloom.onClick(() => cutBloom(bloom), "left");
    bloom.onClick(() => removeBloom(bloom), "right");
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
      k.wait(k.rand(5, 8), () => bloom.play("bloom"));
    }
  }

  // remove bloom
  function removeBloom(bloom: GameObj) {
    if (bloom.frame <= 2) {
      k.destroy(bloom);
      numBlooms--;
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
    k.text(flower.hp().toString(), { size: 16 }),
    k.color("#ea6262"),
    k.pos(8, 16),
  ]);

  // update and display score
  function updateScore(): void {
    score++;
    scoreLabel.text = score.toString();
  }

  // update and display health
  function updateHealth(numBlooms: number, numFullBlooms: number): void {
    if (numBlooms <= 5) flower.heal(10);

    healthLabel.text = flower.hp().toString();
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

  // update score and health every second
  k.loop(1, () => {
    const blooms = k.get("bloom");
    const fullBlooms = blooms.filter((bloom: GameObj) => bloom.frame === 6);

    updateScore();
    updateHealth(blooms.length, fullBlooms.length);
  });

  flower.onDeath(() => k.go("lose", score));
});

k.scene("lose", (score) => {
  // add game over screen
  k.add([k.sprite("gameover", { frame: 0, anim: "main" }), k.pos()]);
});

k.go("title");
