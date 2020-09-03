var direction = 0;
var length = 0;
var x3, y3, x4, y4;
var count = 0;
var graphics;

function setup() {
  angleMode(DEGREES);
  var canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0,0);
  canvas.style('z-index', -1);
  background(255);
  stroke(0);
  drawTree(width/2 * 1.25,height,270,11);
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight)
  drawTree(width/2 * 1.4,height,270,11);
}

function drawTree(x1,y1,direction,length) {
  if (length !== 0){
    var x2 = x1 + (length * random(5,10) * cos(direction));
    var y2 = y1 + (length * random(5,10) * sin(direction));
    
    stroke(0,0,0,length*random(40,50));
    strokeWeight(length/2);
    line(x1,y1,x2,y2);  
    
    x3 = x1;
    y3 = y1;
    x4 = x2;
    y4 = y2;
    
    drawTree(x2,y2,direction-random(10,40),length-1);
    drawTree(x2,y2,direction+random(10,40),length-1);
    
  }
}