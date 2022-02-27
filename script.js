let startTime = Date.now();
let frame = 0;

function fpsCounterRound() {
  let time = Date.now();
  frame++;
  if (time - startTime > 1000) {
      console.log( (frame / ((time - startTime) / 1000)).toFixed(1) )
      startTime = time;
      frame = 0;
    }
}
fpsCounterRound();

const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

const canvas = document.createElement('canvas');
canvas.setAttribute('width', screenWidth);
canvas.setAttribute('height', screenHeight);
document.body.appendChild(canvas);

const context = canvas.getContext('2d');

const gameFps = 60;

const tile_size = 64;

const playerSize = 10;

const colors = {
    rays: '#00FF00',
    ceiling: '#FFFFFF',
    wall: '#0060FF',
    wallDark: '#0000FF',
    floor: '#FFBF00'
}

const fov = toRadians(90)

const map = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1]
];

const player = {
    x: tile_size * 1.5,
    y: tile_size * 1.5,
    angle: 0,
    speed: 0
}

setInterval(() => {
    clearScreen();
    movePlayer();
    const rays = getRays();
    renderScene(rays);
    renderMinimap(0, 0, 0.75, rays)
    fpsCounterRound();

    if(leftArrow){
        player.angle -= 0.05
    }
    if(rightArrow){
        player.angle += 0.05
    }

}, 1000/gameFps);


function clearScreen(){
    context.fillStyle = 'red';
    context.fillRect(0, 0, screenWidth, screenHeight);
}

function movePlayer(){
    player.x += Math.cos(player.angle) * player.speed
    player.y += Math.sin(player.angle) * player.speed
}

function outOfMapBounds(x, y){
    return x < 0 || x >= map[0].length || y < 0 || y >= map.length
}

function distance(x1, y1, x2, y2){
    return Math.sqrt(Math.pow(x2 - x1,2) + Math.pow(y2 - y1,2))
}

function getVCollision(angle){
    const right = Math.abs(Math.floor((angle - Math.PI / 2) / Math.PI) % 2)

    const firstX = right 
        ? Math.floor(player.x / tile_size) * tile_size + tile_size 
        : Math.floor(player.x / tile_size) * tile_size

    const firstY = player.y + (firstX - player.x) * Math.tan(angle);

    const xA = right ? tile_size : -tile_size
    const yA = xA * Math.tan(angle)

    let wall;
    let nextX = firstX;
    let nextY = firstY;

    while(!wall){
        const cellX = right 
        ? Math.floor(nextX / tile_size) 
        : Math.floor(nextX / tile_size) - 1;
        const cellY = Math.floor(nextY / tile_size)

        if(outOfMapBounds(cellX, cellY)){
            break
        }
        wall = map[cellY][cellX]
        if(!wall){
            nextX += xA
            nextY += yA
        } else {
        }
    }
    return { 
        angle, 
        distance: distance(player.x, player.y, nextX, nextY), 
        vertical: true}
}

function getHCollision(angle){
    const up = Math.abs(Math.floor(angle / Math.PI) % 2);

    const firstY = up 
        ? Math.floor(player.y / tile_size) * tile_size + tile_size 
        : Math.floor(player.y / tile_size) * tile_size

    const firstX = player.x + (firstY - player.y) / Math.tan(angle);

    const yA = up ? -tile_size : tile_size
    const xA = yA / Math.tan(angle)

    let wall
    let nextX = firstX
    let nextY = firstY
    while(!wall){
        const cellX = Math.floor(nextX / tile_size)
        const cellY = up 
        ? Math.floor(nextY / tile_size) - 1 
        : Math.floor(nextY / tile_size);

        if(outOfMapBounds(cellX, cellY)){
            break
        }
        wall = map[cellY][cellX]
        if(!wall){
            nextX += xA
            nextY += yA
        } else {
        }
        
    }
    return {
        angle,
        distance: distance(player.x, player.y, nextX, nextY),
        vertical: false,
    }
}

function castRay(angle){
    const vCollision = getVCollision(angle);
    const hCollision = getHCollision(angle);

    return hCollision.distance >= vCollision.distance ? vCollision : hCollision
}

//FUKs ME AND CHROME
function fixFishEye(distance, angle, playerAngle) {
    const diff = angle - playerAngle;
    return distance * Math.cos(diff); 
}

function getRays(){
    const inintalAngle = player.angle - fov/2;
    const numberOfRay = screenWidth / 1;  //<== change number of rays
    const angleStep = fov / numberOfRay;
    return Array.from({ length: numberOfRay }, (_, i) => {
        const angle = inintalAngle + i * angleStep;
        const ray = castRay(angle)
        return ray
    })
}

//renders the "game scene"
const pixelWidth = 1;  //<=== chnage ray thicc ness
function renderScene(rays){
    rays.forEach((ray, i) => {
        const distance = fixFishEye(ray.distance, ray.angle, player.angle);
        const wallHeight = ((tile_size * 5) / distance) * 277

        context.fillStyle = ray.vertical ? colors.wallDark : colors.wall
        context.fillRect(i * pixelWidth, screenHeight / 2 - wallHeight / 2, pixelWidth, wallHeight)

        context.fillStyle = colors.floor
        context.fillRect(i * pixelWidth, screenHeight / 2 + wallHeight / 2, pixelWidth, screenHeight / 2 - wallHeight / 2)

        context.fillStyle = colors.ceiling
        context.fillRect(i * pixelWidth, 0, pixelWidth, screenHeight / 2 - wallHeight / 2)
    })
}

//The whole render minimap function att it finest
function renderMinimap(posX = 0, posY = 0, scale = 1, rays){

    //draws tiles on the minimap
    const tileSize = scale * tile_size;
    map.forEach((row, y) => {
        row.forEach((cell, x) => {
            if(cell){
                context.fillStyle = 'grey';
                context.fillRect(
                    posX + x * tileSize, 
                    posY + y * tileSize, 
                    tileSize, 
                    tileSize
                );
            }
        })
    })

    //Draws the arrays on minimap
    context.strokeStyle = colors.rays;
    rays.forEach(ray => {
        context.beginPath()
        context.moveTo(player.x * scale + posX, player.y * scale + posY)
        context.lineTo(
            (player.x + Math.cos(ray.angle) * ray.distance) * scale,
            (player.y + Math.sin(ray.angle) * ray.distance) * scale
        )
        context.closePath()
        context.stroke()
    })
            

    //Draws the player on the minimap
    context.fillStyle = 'blue';
    context.fillRect(
        posX + player.x * scale - playerSize/2,
        posY + player.y * scale - playerSize/2,
        playerSize,
        playerSize
    )

    //Draws the player view direction on minimap (looks better witout it doe (in my opinion doe (peepee code)))
    /*
    const rayLength = playerSize * 2;
    context.strokeStyle = 'blue';
    context.beginPath();
    context.moveTo(player.x * scale + posX, player.y * scale + posY)
    context.lineTo(
        (player.x + Math.cos(player.angle) * rayLength) * scale,
        (player.y + Math.sin(player.angle) * rayLength) * scale,
    )
    context.closePath();
    context.stroke();
    */

}

function toRadians(deg){
    return (deg * Math.PI) / 180
}

let leftArrow = false;
let rightArrow = false;

document.addEventListener('keydown', (e)=>{
    if(e.key == 'ArrowUp'){
        player.speed = 2
    }
    if(e.key == 'ArrowDown'){
        player.speed = -2
    }
    if(e.key == 'ArrowLeft'){
        leftArrow = true;
    }
    if(e.key == 'ArrowRight'){
        rightArrow = true;
    }
})

document.addEventListener('keyup', (e)=>{
    if(e.key == 'ArrowUp' || e.key == 'ArrowDown'){
        player.speed = 0;
    }
    if(e.key == 'ArrowLeft'){
        leftArrow = false;
    }
    if(e.key == 'ArrowRight'){
        rightArrow = false;
    }
})

document.addEventListener('mousemove', (e)=>{
    player.angle += toRadians(e.movementX) / 2;
})