var direction = 0;
var length = 0;

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0,0);
  canvas.style('z-index','-1');
  background(255,255,255);
  stroke(0,0,0);
  translate(windowWidth/2,windowHeight);
  scale(1,-1)
  angleMode(DEGREES);

  drawTree(0,0,90,9);
}  

function drawTree(x1,y1,direction,length) {
  if (length !== 0){

    var x2 = x1 + (length*10*cos(direction));
    var y2 = y1 + (length*10*sin(direction));
    window.x3 = x2;
    window.y3 = y2;
    
    strokeWeight(length)
    line(x1,y1,x2,y2);
    
    drawTree(x2,y2,direction-random(10,40),length-1);
    drawTree(x2,y2,direction+random(10,40),length-1);
  }  else {
    stroke(255,0,0);
    translate(580, 200);
    ellipse(0, 10, 20, 80);
  }
}