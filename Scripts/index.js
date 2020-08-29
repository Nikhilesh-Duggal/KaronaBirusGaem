///<reference types="pixi.js"/>

let type = "WebGL"

if(!PIXI.utils.isWebGLSupported())
{
    type = "canvas"
}

const width = 640;
const height = 480;

let app = new PIXI.Application
({ 
    width: width,
    height: height,
    antialias: false,
    transparent: false,
    resolution: 1,
    backgroundColor: 0x474747
});

PIXI.Loader.shared
    .add("Images/Square.png")
    .add("Images/Ground.png")
    .add("Images/Floor.png")
    .add("Images/Objects.png")
    .add("Images/flag.png")
    .add("sheet", "Images/player.json")
    .load(setup);

const stage = app.stage;
const speed = 3;

function resize(sprite, factor) 
{
    sprite.scale.x = factor;
    sprite.scale.y = factor;
}

let playerSprite, state, right, left, up, down, collisionData, coronaLayer, objectLayer
, playerRect, tilemap = [], health = 100, cooldown = 0, drunkEffect = {x: 0, y:0}, healthText
, coronaMap = [], flagRect, hasWon = false;

let velocity = {x: 0, y: 0};

Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};  

function keyboard(value) 
{
    let key = {};
    key.value = value;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => 
    {
      if (event.key === key.value) {
        if (key.isUp && key.press) key.press();
        key.isDown = true;
        key.isUp = false;
        event.preventDefault();
      }
    };
  
    //The `upHandler`
    key.upHandler = event => 
    {
      if (event.key === key.value) {
        if (key.isDown && key.release) key.release();
        key.isDown = false;
        key.isUp = true;
        event.preventDefault();
      }
    };
  
    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);
    
    window.addEventListener(
      "keydown", downListener, false
    );
    window.addEventListener(
      "keyup", upListener, false
    );
    
    // Detach event listeners
    key.unsubscribe = () => 
    {
      window.removeEventListener("keydown", downListener);
      window.removeEventListener("keyup", upListener);
    };
    
    return key;
}  

$.getJSON('Scripts/collision.json', function(data) {
    collisionData = data;
}).then((result) => {
    coronaLayer = collisionData.layers[1].data;
    objectLayer = collisionData.layers[2].data;
});

function closestNumber(input, x)
{
    var output = (Math.round(input / x)) * x;

    output = output == 0 ? x : output;

    return output;
}

function setup() 
{
    //#region Level
    groundSprite = new PIXI.Sprite(PIXI.Loader.shared.resources["Images/Ground.png"].texture);

    groundSprite.x = 0;
    groundSprite.y = 0;

    stage.addChild(groundSprite);

    floorSprite = new PIXI.Sprite(PIXI.Loader.shared.resources["Images/Floor.png"].texture);

    floorSprite.x = 0;
    floorSprite.y = 0;
    
    stage.addChild(floorSprite);

    objectSprite = new PIXI.Sprite(PIXI.Loader.shared.resources["Images/Objects.png"].texture);

    objectSprite.x = 0;
    objectSprite.y = 0;
    
    stage.addChild(objectSprite);

    let flag = new PIXI.Sprite(PIXI.Loader.shared.resources["Images/flag.png"].texture);

    flag.x = 37;
    flag.y = 0;

    flagRect = new Rectangle(32, 0, 32, 32);

    stage.addChild(flag);
    //#endregion

    //#region player

    var sheet = PIXI.Loader.shared.resources.sheet;

    playerSprite = new PIXI.AnimatedSprite(Object.values(sheet.spritesheet.textures));
    playerSprite.play();
    playerSprite.animationSpeed = 0.75;

    playerRect = new Rectangle(playerSprite.x - playerSprite.width / 2, 
        playerSprite.y - 16, playerSprite.width, 32);

    playerSprite.x = 609;
    playerSprite.y = 388;

    playerSprite.anchor.set(0.5, 0.5);

    stage.addChild(playerSprite);
    //#endregion

    for (let i = 0; i < objectLayer.length; i++)
    {
        if (objectLayer[i] != 0)
        {
            let y1 = Math.trunc(i / 20) * 32;
            let x1 = (i - (20 * Math.trunc(i / 20))) * 32;

            let rect = new Rectangle(x1, y1, 32, 32);

            tilemap.push(rect);
        }
    }

    for (let i = 0; i < coronaLayer.length; i++)
    {
        if (coronaLayer[i] != 0)
        {
            let y1 = Math.trunc(i / 20) * 32;
            let x1 = (i - (20 * Math.trunc(i / 20))) * 32;

            let rect = new Rectangle(x1, y1, 32, 32);

            coronaMap.push(rect);
        }
    }

    healthText = new PIXI.Text("Health: " + health.toString(), {});

    healthText.x = width / 2 - healthText.width / 2;
    healthText.y = 5;

    const style = new PIXI.TextStyle({
        fontFamily: "\"Courier New\", Courier, monospace",
        fill: 0xFFFFFF
    });

    healthText.style = style;

    stage.addChild(healthText);

    console.log(tilemap);

    right = keyboard("ArrowRight");
    left = keyboard("ArrowLeft");
    up = keyboard("ArrowUp");
    down = keyboard("ArrowDown");

    state = play;

    window.setInterval(() => {
        //console.log("Player position: ", playerSprite.x, playerSprite.y, "Velicity: ", velocity);
    }, 1000);
    window.setInterval(moveRandomly, 1000);

    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta)
{
    if (!hasWon)
    {
        var hor = (right.isDown ? 1 : 0) - (left.isDown ? 1 : 0);
        var ver = (down.isDown ? 1 : 0) - (up.isDown ? 1 : 0);

        if (velocity.y == 0)
            velocity.x = hor * speed;
        if (velocity.x == 0)
            velocity.y = ver * speed;

        playerRect.setRect(playerSprite.x - playerSprite.width / 2 + velocity.x, 
            playerSprite.y - 16 + velocity.y);

        playerRect.width = playerSprite.width + velocity.x;
        playerRect.height = 32 + velocity.y;

        checkForWall();
        coronaTiles();

        state(delta);

        playerSprite.x += velocity.x;
        playerSprite.y += velocity.y;

        checkForFreeSpace();

        playerSprite.x += drunkEffect.x;
        playerSprite.y += drunkEffect.y;

        playerSprite.x = playerSprite.x.clamp(16, 624);
        playerSprite.y = playerSprite.y.clamp(16, 464);

        health = health.clamp(0, 100);
        healthText.text = "Health: " + health.toString();

        if (health == 0)
        {
            playerSprite.x = 609;
            playerSprite.y = 388;
            health = 100;
        }

        if (overlapRect(flagRect, playerRect))
        {
            let winText = new PIXI.Text("YOU WON!", {});

            const style = new PIXI.TextStyle({
                fontFamily: "\"Courier New\", Courier, monospace",
                fill: 0xFF0000,
                fontSize: 120
            });

            winText.style = style;

            winText.x = width / 2 - winText.width / 2;
            winText.height = height / 2 + winText.height / 2;

            stage.addChild(winText);

            hasWon = true;
        }

        cooldown--;
    }
}  

function moveRandomly() 
{
    drunkEffect.x = 0;
    drunkEffect.y = 0;

    if (Math.random() > 0.5)
    {
        drunkEffect.x = Math.random() > 0.5 ? 1.5 : -1.5;
    } else
    {
        drunkEffect.y = Math.random() > 0.5 ? 1.5 : -1.5;
    }
}

function coronaTiles() 
{
    coronaMap.forEach((tile) => 
    {
        if (overlapRect(playerRect, tile)) 
        {
            let dmg = tile.x2 == 32 ? 10 : 5;

            damage(dmg);
        }
    });    
}

function checkForFreeSpace() 
{
    tilemap.forEach((tile) => 
    {
        if (overlapRect(playerRect, tile)) 
        {
            damage(10);

            if (drunkEffect.x != 0)
            {
                playerSprite.x = closestNumber(playerSprite.x, 16);

                drunkEffect.x = 0;
            } else
            {
                drunkEffect.y = closestNumber(playerSprite.y, 16);

                drunkEffect.y = 0;
            }
        }      
    });
}

function checkForWall() 
{
    tilemap.forEach((tile) => 
    {
        if (overlapRect(playerRect, tile)) 
        {
            damage(10);

            if (velocity.x != 0)
            {
                playerSprite.x = closestNumber(playerSprite.x, 16);

                velocity.x = 0;
            } else
            {
                playerSprite.y = closestNumber(playerSprite.y, 16);

                velocity.y = 0;
            }
        }  
    });
}

function damage(amount)
{
    if (cooldown <= 0)
    {
        health -= amount + (Difficulty._difficulty * 5);

        playerSprite.tint = 0xFFB1B1;

        setTimeout(() => {
            playerSprite.tint = 0xFFFFFF;
        }, 1000);

        cooldown = 30;
    }
}

function overlapRect(rect1, rect2) 
{
    if (rect1.x1 < rect2.x2 &&
        rect1.x2 > rect2.x1 &&
        rect1.y1 < rect2.y2 &&
        rect1.y2 > rect2.y1) 
    {
        return true;
    }

    return false;
}

function play(delta) 
{
}  

document.body.appendChild(app.view);