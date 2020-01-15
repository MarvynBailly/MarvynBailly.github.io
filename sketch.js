var length;
var direction;
var per_length = 0;
var per_direction = 0;

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0,0);
  canvas.style('z-index','-1');
  background(255,255,255);

  stroke(255,0,0);
  translate(windowWidth/2,windowHeight);
  translate(0, -height+448);
  
  drawTree(100,0)
}  

function drawTree(length,direction) {
  if (length > 1){
    per_length = per_length + length;
    per_direction = per_direction + direction;
    print(per_length)
    line(0,per_length,0,per_length + length);
    //drawtrunk(-length,direction+20);
    //drawtrunk(-length/2,direction-20);
    drawTree(length/2,direction);
  }

}