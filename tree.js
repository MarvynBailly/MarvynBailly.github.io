var direction = 0;
var length = 0;
var x3, y3, x4, y4;
var offset = 1.1;
var lengthOffset = 0;

function setup() {
  angleMode(DEGREES);
  var canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0,0);
  canvas.style('z-index', -1);
  canvas.style('position','fixed');
  background(255);
  initTree();
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight)
  background(255);
  initTree();
}

function initTree(){
  lengthOffset = (2*windowWidth + windowHeight)/2800;
  if(windowWidth < 700){
    drawTree(width/2 * (offset + .2),height,270,9);
  }else if(windowWidth < 950){
    drawTree(width/2 * offset,height,270,10);
  }else{
    drawTree(width/2 * offset,height,270,11);
  }
}

function drawTree(x1,y1,direction,length) {
  if (length !== 0){
    var x2 = x1 + (length * lengthOffset * random(5,8) * cos(direction));
    var y2 = y1 + (length * lengthOffset * random(5,8) * sin(direction));

    stroke(0,0,0,length * lengthOffset * random(40,50));
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