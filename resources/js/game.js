/**
 * === CANVAS INTERFACE ===
 */
(function () {
  var canvas, ctx;
  var viewport;

  var _resizeCallback = () => {}; // nop

  // resize to 100%, 100%
  const resize = () => {
    viewport = [$(window).width(), $(window).height()];

    canvas.width = viewport[0];
    canvas.height = viewport[1];

    canvas.style.width = viewport[0] + "px";
    canvas.style.height = viewport[1] + "px";

    _resizeCallback(viewport);
  };
  $(() => {
    canvas = document.getElementById("game-ui-canvas"); // dom
    ctx = canvas.getContext("2d");

    resize();
    $(window).on("resize", resize); // attach resize event
  });

  const get = function () {
    // getter function
    setTimeout(function () {
      resize();
    }, 100);
    return {
      canvas,
      ctx,
      viewport,
    };
  };

  const onResize = function (cb) {
    _resizeCallback = cb;
  };

  window["canvasInterface"] = {
    get,
    resize,
    onResize,
  };
})();

/**
 * === PAGE INTERFACE ===
 */
/*
    handles dom ready &
    defines `_time` function
*/

(function () {
  const showPage = (pageID) => {
    var pages = $(
      "#game-ui-screens > .game-ui-screen:not(#game-ui-screen-" + pageID + ")"
    );
    pages.removeClass("page-animate-in"); // fade out other pages
    setTimeout(function () {
      pages.hide(); // hide them after animation is complete
    }, 300);

    var page = $("#game-ui-screen-" + pageID); // get page
    page.removeClass("page-animate-in").show(); // show it

    setTimeout(function () {
      page.addClass("page-animate-in"); // fade in
    }, 16.6);
  };

  $(() => {
    showPage("menu");
    setTimeout(function () {
      window.gameInterface.nextLevel(true);

      $("#game-ui-canvas").removeClass("fade-out");
    }, 150);
  });

  window["pageInterface"] = {
    showPage,
  };

  const play = function () {
    window.pageInterface.showPage("play");
    window.gameInterface.start();
  };
  window.play = play;

  const _time = function () {
    return performance.now();
  };
  window._time = _time;
})(window);

/**
 * === ANIMATED TITLE INTERFACE ===
 */
(function () {
  const text = function (text) {
    return new Promise((resolve, reject) => {
      $("#game-ui-title > h1").text(text);

      $("#game-ui-title").show();
      setTimeout(function () {
        $("#game-ui-title").addClass("game-ui-title-animate-in");
      }, 16.6);

      setTimeout(function () {
        $("#game-ui-title").addClass("game-ui-title-animate-out");
      }, 3000);

      setTimeout(function () {
        resolve();
        $("#game-ui-title")
          .hide()
          .removeClass("game-ui-title-animate-in")
          .removeClass("game-ui-title-animate-out");
      }, 3500);
    });
  };

  window["titleInterface"] = {
    text,
  };
})();

/**
 * === GAME INTERFACE ===
 */
/*
    contains all the game logic & rendering
    `gameInterface`
*/

const rand = function (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

(function () {
  const isCollision = function (rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.w &&
      rect1.x + rect1.w > rect2.x &&
      rect1.y < rect2.y + rect2.h &&
      rect1.y + rect1.h > rect2.y
    );
  };

  var entities = [];
  var player = {
    x: 50,
    y: 50,
    w: 260,
    h: 15,
    hasInit: false,
    isDead: true, // reset at function `start`
  };
  var balls = [];
  window.player = player;
  window.balls = balls;

  var canvas,
    ctx,
    viewport = [0, 0]; // dom stuff

  var keyboard = {
    // keyboard for moving the player
    left: false,
    right: false,
    boost: false,
    up: false,
  };

  var level = 0; // level vars
  var doNextLevelTick = false;

  var ballSpeed = 400;

  function nextLevel(forDisplay) {
    level++;
    entities = []; // reset entities

    $("#game-ui-level-number").text("Level #" + level);
    const next = function () {
      // set gravity and entityCount based on the level number and Math.random() and screen res
      ballSpeed = 420 + Math.pow(level, 1.6);
      if (ballSpeed > 1800) {
        ballSpeed = 1800;
      }

      var rows = Math.floor(level + 2);

      var cubeSize = 38;
      if (level > 10) {
        cubeSize -= level - 10;
        if (cubeSize < 16) {
          cubeSize = 16;
        }
      }
      var margin = 2;
      var ballSpawnY = window.innerHeight / 2 - 60;

      // create entities
      for (var y = 0; y < rows; y++) {
        var cols = window.innerWidth / (cubeSize + margin);
        var color = "#7b8487";

        var realY = y * (cubeSize + margin) + 60;
        if (realY > ballSpawnY) {
          ballSpawnY = realY;
        }
        if (realY + cubeSize + 320 > player.y) {
          continue;
        }

        for (var x = 0; x < cols; x++) {
          entities.push({
            x: x * (cubeSize + margin),
            y: realY,
            w: cubeSize,
            h: cubeSize,
            tick: 0,
            color: color,
            type: "block",
          });
        }
      }
      doNextLevelTick = !forDisplay;
      player.hasInit = !forDisplay;

      if (!forDisplay) {
        player.hasInit = true;
        player.isDead = false;

        var velocityY = Math.min((player.y - ballSpawnY) / 3, ballSpeed / 1.5);
        var x = (window.innerWidth - 10) / 2;
        var y = Math.min(ballSpawnY + 200, player.y - 10);
        var ball = {
          x: x,
          y: y,
          w: 20,
          h: 20,
          velocityX: 0,
          velocityY: velocityY,
        };

        var newBalls = balls.filter(
          (x) => !x.skip && Math.random() > 0.5
        ).length;

        if (!newBalls || newBalls == 1) {
          balls = [ball];
        } else {
          balls = Array(Math.min(1000, newBalls))
            .fill(0)
            .map(() => {
              return {
                ...ball,
                x: ball.x + Math.random() * 120 - 60,
                y: Math.min(player.y - 10, ball.y - Math.random() * 80 - 40),
              };
            });
        }
      } else {
        balls = [];
      }
    };

    if (forDisplay) {
      next();
    } else {
      window.soundInterface.play("levelUp");

      titleInterface.text("Level #" + level).then(next); // display text on the users screen
    }
  }

  $(() => {
    var obj = window["canvasInterface"].get();
    canvas = obj.canvas;
    ctx = obj.ctx;
    viewport = obj.viewport;

    window["canvasInterface"].onResize((newViewport) => {
      viewport = newViewport;
      player.y = viewport[1] - 180;

      console.log("resize", ...viewport);
      if (!player.hasInit) {
        player.x = viewport[0] / 2 - player.w / 2; // update x cord when not playing
      }
    });

    function update() {
      // calculate time delta
      var now = _time();
      var delta = (now - last) / 1000;
      last = now;

      // entity logic
      // gravity & collision detection
      if (player.isDead) {
        delta /= 5;
      }

      function bounce(ball, hit) {
        ball.gravity = 0;
        var ballMidPoint = [ball.x + ball.w / 2, ball.y + ball.h / 2];
        var playerMidPoint = [hit.x + hit.w / 2, hit.y + hit.h / 2];

        var angle = Math.atan2(
          ballMidPoint[1] - playerMidPoint[1],
          ballMidPoint[0] - playerMidPoint[0]
        );

        var cos = Math.cos(angle);
        var sin = Math.sin(angle);

        var speed = ballSpeed + Math.pow(Math.abs(cos) * 14, 2);

        ball.velocityX = cos * speed;
        ball.velocityY = sin * speed;
      }

      var entitiesAlive = 0; // count how many entities are "alive"
      entities.forEach((entity) => {
        if (!entity.skip) {
          entity.tick += delta;
          if (entity.tick > 2) {
            entity.tick = 0;
          }

          entity.alpha = entity.tick;
          if (entity.alpha > 1) {
            entity.alpha = 2 - entity.alpha;
          }

          entity.alpha = Math.min(entity.alpha * 1.5, 1);
          entity.alpha = Math.max(0.1, entity.alpha);

          if (entity.y < player.y) {
            entitiesAlive++;
          }

          balls.forEach((ball) => {
            if (!ball.skip && !entity.skip) {
              if (isCollision(ball, entity)) {
                window.soundInterface.play("hitmarker_quiet");

                if (Math.random() > 0.5 && balls.length < 2000) {
                  var angle = Math.random(0, Math.PI * 2);
                  balls.push({
                    x: entity.x,
                    y: entity.y,
                    velocityX: Math.cos(angle) * ballSpeed,
                    velocityY: Math.sin(angle) * ballSpeed,
                    w: 20,
                    h: 20,
                  });
                }

                bounce(ball, entity);
                entity.skip = true;
              }
            }
          });
        }
      });

      // update the level
      if (entitiesAlive < 1 && doNextLevelTick) {
        doNextLevelTick = false;
        setTimeout(function () {
          nextLevel();
        }, 16.6);
      }

      var speed = delta * 0.4 * viewport[0]; // normal speed

      if (!player.isDead) {
        // move left
        if (keyboard.left && !keyboard.right && player.x > 0) {
          player.x -= speed;
        }

        // move right
        if (
          keyboard.right &&
          !keyboard.left &&
          player.x < window.innerWidth - player.w
        ) {
          player.x += speed;
        }
      }

      // clear canvas
      ctx.clearRect(0, 0, ...viewport);

      // render entities
      entities.forEach((k) => {
        if (!k.skip) {
          ctx.fillStyle = k.color;
          ctx.globalAlpha = k.alpha;
          ctx.fillRect(k.x, k.y, k.w, k.h);
        }
      });

      var ballsAlive = 0;

      balls.forEach((ball) => {
        if (!ball.skip) {
          ballsAlive++;
          ball.x += ball.velocityX * delta;
          ball.y += ball.velocityY * delta;

          ball.direction = ball.direction % (2 * Math.PI);
          while (ball.direction < 0) {
            ball.direction += Math.PI * 2;
          }

          var isUp = ball.velocityY < 0;
          var isDown = ball.velocityY > 0;
          var isLeft = ball.velocityX < 0;
          var isRight = ball.velocityX > 0;

          if (ball.x < 0) {
            if (isLeft) {
              ball.velocityX = Math.abs(ball.velocityX);
              ball.x = 0;
              window.soundInterface.play("hitmarker_quiet");

              console.log(ball.direction);
            }
          } else if (ball.x > window.innerWidth - ball.w) {
            ball.direction = ball.direction % (2 * Math.PI);
            if (isRight) {
              ball.velocityX = -Math.abs(ball.velocityX);
              ball.x = window.innerWidth - ball.w;
              window.soundInterface.play("hitmarker_quiet");
            }
          }

          if (ball.y < 0) {
            if (isUp) {
              ball.velocityY = Math.abs(ball.velocityY);
              ball.y = 0;
              window.soundInterface.play("hitmarker_quiet");
            }
          }

          if (ball.y > window.innerHeight) {
            ball.skip = true;
          }

          ctx.fillStyle = "#fff";
          ctx.globalAlpha = 1;
          ctx.fillRect(ball.x, ball.y, ball.w, ball.h);

          if (isCollision(ball, player)) {
            if (!ball.lastSound || Date.now() - ball.lastSound > 200) {
              ball.lastSound = Date.now();
              window.soundInterface.play("hitmarker");
            }
            bounce(ball, player);
          }
        }
      });

      if (!ballsAlive && player.hasInit && !player.isDead) {
        player.isDead = true;
        window.pageInterface.showPage("menu");
      }

      ctx.globalAlpha = 1;

      // render player
      if (player.hasInit) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(player.x, player.y, player.w, player.h);
      }

      // request for next frame
      requestAnimationFrame(update);

      var percent = (entitiesAlive / entities.length) * 100;
      if (percent > 100) {
        percent = 100;
      }
      $("#game-ui-level-bar").css("width", percent + "%");
    }

    var last = _time();
    update();

    const keyEvent = function (type, event) {
      var value = type == "down";

      var keyCode = event.which || event.keycode || event.keyCode;

      // move left
      if (keyCode == 65 || keyCode == 37) {
        keyboard.left = value;
      }

      // move right
      if (keyCode == 68 || keyCode == 39) {
        keyboard.right = value;
      }

      // move up
      if (keyCode == 87 || keyCode == 38) {
        keyboard.up = value;
      }

      // boost
      if (keyCode == 16 || keyCode == 32 || keyCode == 13) {
        keyboard.boost = value;
      }
    };

    // dom events
    $(window).on("keydown", function (e) {
      keyEvent("down", e);
    });
    $(window).on("keyup", function (e) {
      keyEvent("up", e);
    });
  });

  // start the game
  const start = function () {
    level = 0;
    player.hasInit = false;

    nextLevel();

    player.isDead = false;
    player.x = viewport[0] / 2 - player.w / 2;
  };

  window["gameInterface"] = {
    start,
    nextLevel,
  };
})();

/**
 * === SOUND INTERFACE ===
 */
(function () {
  var actx = new AudioContext();
  function makeSound(source, loadHandler = () => {}) {
    var o = {};
    //Set the default properties.
    o.volumeNode = actx.createGain();
    o.panNode = actx.createPanner();
    o.panNode.panningModel = "equalpower";
    o.soundNode = undefined;
    o.buffer = undefined;
    o.source = undefined;
    o.loop = false;
    o.isPlaying = false;
    //The function that should run when the sound is loaded.
    o.loadHandler = undefined;
    //Values for the `pan` and `volume` getters/setters.
    o.panValue = 0;
    o.volumeValue = 1;
    //Values to help track and set the start and pause times.
    o.startTime = 0;
    o.startOffset = 0;
    //The sound object's methods.
    o.play = function () {
      //Set the start time (it will be `0` when the sound
      //first starts.
      o.startTime = actx.currentTime;
      //Create a sound node.
      o.soundNode = actx.createBufferSource();
      //Set the sound node's buffer property to the loaded sound.
      o.soundNode.buffer = o.buffer;
      //Connect the sound to the pan, connect the pan to the
      //volume, and connect the volume to the destination.
      o.soundNode.connect(o.panNode);
      o.panNode.connect(o.volumeNode);
      o.volumeNode.connect(actx.destination);
      //Will the sound loop? This can be `true` or `false`.
      o.soundNode.loop = o.loop;
      //Finally, use the `start` method to play the sound.
      //The start time will either be `0`,
      //or a later time if the sound was paused.
      o.soundNode.start(0, o.startOffset % o.buffer.duration);
      //Set `isPlaying` to `true` to help control the
      //`pause` and `restart` methods.
      o.isPlaying = true;
    };
    o.pause = function () {
      //Pause the sound if it's playing, and calculate the
      //`startOffset` to save the current position.
      if (o.isPlaying) {
        o.soundNode.stop(0);
        o.startOffset += actx.currentTime - o.startTime;
        o.isPlaying = false;
      }
    };
    o.restart = function () {
      //Stop the sound if it's playing, reset the start and offset times,
      //then call the `play` method again.
      if (o.isPlaying) {
        o.soundNode.stop(0);
      }
      o.startOffset = 0;
      o.play();
    };
    o.playFrom = function (value) {
      if (o.isPlaying) {
        o.soundNode.stop(0);
      }
      o.startOffset = value;
      o.play();
    };
    //Volume and pan getters/setters.
    Object.defineProperties(o, {
      volume: {
        get: function () {
          return o.volumeValue;
        },
        set: function (value) {
          o.volumeNode.gain.value = value;
          o.volumeValue = value;
        },
        enumerable: true,
        configurable: true,
      },
      pan: {
        get: function () {
          return o.panValue;
        },
        set: function (value) {
          //Panner objects accept x, y and z coordinates for 3D
          //sound. However, because we're only doing 2D left/right
          //panning we're only interested in the x coordinate,
          //the first one. However, for a natural effect, the z
          //value also has to be set proportionately.
          var x = value,
            y = 0,
            z = 1 - Math.abs(x);
          o.panNode.setPosition(x, y, z);
          o.panValue = value;
        },
        enumerable: true,
        configurable: true,
      },
    });
    //The `load` method. It will call the `loadHandler` passed
    //that was passed as an argument when the sound has loaded.
    o.load = function () {
      var xhr = new XMLHttpRequest();
      //Use xhr to load the sound file.
      xhr.open("GET", source, true);
      xhr.responseType = "arraybuffer";
      xhr.addEventListener("load", function () {
        //Decode the sound and store a reference to the buffer.
        actx.decodeAudioData(
          xhr.response,
          function (buffer) {
            o.buffer = buffer;
            o.hasLoaded = true;
            //This next bit is optional, but important.
            //If you have a load manager in your game, call it here so that
            //the sound is registered as having loaded.
            if (loadHandler) {
              loadHandler();
            }
          },
          //Throw an error if the sound can't be decoded.
          function (error) {
            throw new Error("Audio could not be decoded: " + error);
          }
        );
      });
      //Send the request to load the file.
      xhr.send();
    };
    //Load the sound.
    o.load();
    //Return the sound object.
    return o;
  }

  var bank = {
    hitmarker: makeSound("./resources/sounds/hitmarker.mp3"),
    hitmarker_quiet: makeSound("./resources/sounds/hitmarker_quiet.mp3"),
    hit: makeSound("./resources/sounds/hit.mp3"),
    levelUp: makeSound("./resources/sounds/levelup.mp3"),
  };

  function play(name) {
    var e = bank[name];
    e.play();
  }

  window["soundInterface"] = {
    play,
  };
})();
