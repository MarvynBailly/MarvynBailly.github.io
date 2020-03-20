var direction = 0;
var length = 0;
var x3;
var y3;

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0,0);
  canvas.style('z-index','-1');
  background(255,255,255);
  stroke(0,0,0);
  translate(windowWidth/2,windowHeight);
  scale(1,-1)
  angleMode(DEGREES);

  drawTree(0,0,90,11);
  //for(i=0; i<100; i++){
    //setTimeout(function(){drawTree(0,0,90,11);}, );
    //background(255,255,255);
  //}
}  

function windowResized(){
  resizeCanvas(windowWidth, windowHeight)
  translate(windowWidth/2,windowHeight);
  scale(1,-1)
  drawTree(0,0,90,11);
}

function drawTree(x1,y1,direction,length) {
  if (length !== 0){

    var x2 = x1 + (.0000007 * windowHeight * windowWidth * length * random(5,10) * cos(direction));
    var y2 = y1 + (.0000007 * windowHeight * windowWidth * length * random(5,10) * sin(direction));
    //window.x3 = x2;
    //window.y3 = y2;
    
    stroke(0,0,0);
    strokeWeight(.0000001 * windowHeight * windowWidth * length);
    line(x1,y1,x2,y2);  
    
    x3 = x2;
    y3 = y2;

    drawTree(x2,y2,direction-random(10,40),length-1);
    drawTree(x2,y2,direction+random(10,40),length-1);
    
  //}  //else if(Math.round(random(0,3)) == 1){
    //strokeWeight(.0000007 * windowHeight * windowWidth);
    //stroke(255,0,0);
    //tint(127);
    //point(x3,y3);
    //tint(127);
    //ellipse(x3-5,y3,10,5);
    //ellipse(x3+5,y3,10,5);
    //ellipse(x3,y3+5,5,10);
    //ellipse(x3,y3-5,5,10);

  }
}