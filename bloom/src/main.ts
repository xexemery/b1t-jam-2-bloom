import kaplay from "kaplay";
import type { Vec2 } from "kaplay";

const SCREEN_WIDTH: number = 320;
const SCREEN_HEIGHT: number = 240;
const FLOWER_SIZE: number = 32;
const BLOOM_WIDTH: number = 32;
const BLOOM_HEIGHT: number = 64;

// initialise context
const k = kaplay({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  stretch: true,
  letterbox: true,
  crisp: true,
  background: "#4a3052",
  global: false,
});

k.loadRoot("./"); // for itch.io publishing purposes

// load assets
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
  const flower = k.add([
    k.sprite("flower", { frame: 0 }),
    k.pos((SCREEN_WIDTH - FLOWER_SIZE) / 2, (SCREEN_HEIGHT - FLOWER_SIZE) / 2),
    k.area(),
    k.health(100, 100),
  ]);

  function reduceHealth(): void {
    const amountToReduce = k.get("bloom").reduce((total, bloom) => {
      if (bloom.frame > 2) {
        return (total += bloom.frame - 2);
      }
    }, 0);

    flower.hurt(amountToReduce);
  }

  function spawnBloom(): void {
    // add bloom
    k.add([
      k.sprite("bloom", { frame: 0, anim: "grow" }),
      k.pos(generateCoords()),
      k.area(),
      "bloom",
    ]);
  }

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

  // cut off head of bloom if clicked
  k.onClick("bloom", (bloom) => {
    if (bloom.frame > 2) {
      bloom.play("cut");
      k.wait(k.rand(2, 5), () => bloom.play("bloom"));
    }
  });

  // spawn bloom every 5 seconds
  k.loop(5, spawnBloom);
});

k.go("game");
