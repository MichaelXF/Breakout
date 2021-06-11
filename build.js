var JsConfuser = require("js-confuser");
const { readFileSync, writeFileSync } = require("fs");

const file = readFileSync("./resources/js/game.js", "utf-8");

JsConfuser.obfuscate(file, {
  target: "node",
  preset: "high",
}).then((output) => {
  writeFileSync("./resources/js/game.obfuscated.js", output, {
    encoding: "utf-8",
  });
});
