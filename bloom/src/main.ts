import kaplay from "kaplay";

// initialise context
const k = kaplay({
  width: 320,
  height: 240,
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
    bloom: { from: 0, to: 6, loop: false },
  },
});

k.scene("game", () => {
  // add main flower
  const flower = k.add([
    k.sprite("flower", { frame: 0 }),
    k.area(),
    k.pos(144, 104),
    k.health(100, 100),
  ]);

  function spawnBloom() {
    // add bloom
    k.add([
      k.sprite("bloom", { frame: 0, anim: "bloom", animSpeed: 0.1 }),
      k.area(),
      k.pos(k.rand(k.vec2(288, 176))),
      "bloom",
    ]);

    // wait 5 seconds to spawn next bloom
    k.wait(5, spawnBloom);
  }

  // start spawning blooms
  spawnBloom();
});

k.go("game");
