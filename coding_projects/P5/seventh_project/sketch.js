function setup() {
  createCanvas(400, 400);
  background(255);
}
function draw() {
  stroke(255);
  strokeWeight(1);
  var equations = "2x"

  for(let i = 0; i<height; i+=20){
    line(i,0,i,height);
    stroke(0);
  }

  for(let i = 0; i<width; i+=20){
    line(width,i,0,i);
  }

  strokeWeight(3);
  line(width/2,0,height/2,height);
  line(width,width/2,0,height/2);
  
  stroke('purple')
  strokeWeight(6);
  point(-10,10);
  
  translate(width/2,height/2);
  
  for(let i =-10000; i<1000; i+=1){
    x = i;
    y = -(sqrt(x));
    point(x,y);
  } 
}
