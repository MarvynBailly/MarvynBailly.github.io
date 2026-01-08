var direction = 0;
var length = 0;
var x3, y3, x4, y4;
var count = 0;
var graphics;

function setup() {
  angleMode(DEGREES);
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  canvas = createCanvas(width, height);
  canvas.parent("sketchholder");
  background(255);
  stroke(0);
  graphics = createGraphics(windowWidth, windowHeight);
  drawTree(width/2,height,270,9);
}

function windowResized(){
    var canvasDiv = document.getElementById('sketchholder');
    var width = canvasDiv.offsetWidth;
    var height = canvasDiv.offsetHeight;
    resizeCanvas(width, height);
}

function drawTree(x1,y1,direction,length) {
  if (length !== 0){
    var x2 = x1 + (length * random(5,10) * cos(direction));
    var y2 = y1 + (length * random(5,10) * sin(direction));
    
    stroke(0);
    graphics.strokeWeight(length/10);
    graphics.line(x1,y1,x2,y2);  
    
    x3 = x1;
    y3 = y1;
    x4 = x2;
    y4 = y2;
    
    drawTree(x2,y2,direction-random(10,40),length-1);
    drawTree(x2,y2,direction+random(10,40),length-1);
    
  }
}

function draw(){
  background(255);
  image(graphics, 0, 0);
}