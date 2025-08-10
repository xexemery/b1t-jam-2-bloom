import kaplay from "kaplay";
import "kaplay/global";

kaplay();

loadRoot("./"); // for itch.io publishing purposes
loadSprite("bean", "sprites/bean.png");

add([pos(120, 80), sprite("bean")]);

onClick(() => addKaboom(mousePos()));
