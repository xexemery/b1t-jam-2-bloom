import kaplay from "kaplay";

const k = kaplay({
  width: 320,
  height: 240,
  stretch: true,
  letterbox: true,
  crisp: true,
  global: false,
});

k.loadRoot("./"); // for itch.io publishing purposes
