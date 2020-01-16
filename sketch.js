var direction = 0;
var length = 0;
var x2 = 0;
var y2 = 0;
var pre_length = 0;


function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0,0);
  canvas.style('z-index','-1');
  background(255,255,255);

  stroke(255,0,0);
  translate(windowWidth/2,windowHeight);
  scale(1,-1);

  angleMode(DEGREES);

  drawTree(0,0,90,9);
}  

function drawTree(x1,y1,direction,length) {
  if (length !== 0){
    var x2 = x1 + (length*10*cos(direction));
    var y2 = y1 + (length*10*sin(direction));
    
    line(x1,y1,x2,y2);
    
    drawTree(x2,y2,direction-20,length-1);
   drawTree(x2,y2,direction+20,length-1);
  }
}