var population;
var lifeSpan = 300;
var count = 0;
var target;
var iteration = 1;
var obstacles = [];
var maxForce = 0.2;
var pool;

function setup() {
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  canvas = createCanvas(width, height);
  canvas.parent("sketchholder");
  population = new Population();
  target = createVector(width/2, 50);
  
  append(obstacles, new Obstacle(width/3,height/2));
}

function windowResized(){
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  resizeCanvas(width, height);
}
function draw() {
  background(220);
  population.run();
  count++;
  if(count == lifeSpan){
    population.evaluate();
    population.selection();
    count = 0;
    iteration ++;
  }
  
  noFill();
  stroke(0);
  ellipse(target.x,target.y,16,16);
  
  for(let i = 0; i < obstacles.length; i++){
    obstacles[i].draw();
  }
  
  let fps = round(frameRate(),2);
  text('FPS: ' + fps + ' | Count: ' + count + ' | Iteration: ' + iteration,10,height-10);
}