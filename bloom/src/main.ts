import kaplay from "kaplay";

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

k.loadSprite("flower", "sprites/flower.png", {
  sliceX: 3,
  sliceY: 1,
});

const flower = k.add([
  k.sprite("flower", { frame: 0 }),
  k.pos(144, 104),
  k.health(100, 100),
]);
