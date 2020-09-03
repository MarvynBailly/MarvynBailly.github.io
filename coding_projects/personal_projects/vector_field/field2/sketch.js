var scl = 5;
var vectorField = [];

function setup(){
  createCanvas(400,400);
  cols = floor(width / scl);
  rows = floor(width / scl);
  fr = createP();
}

function draw(){
  background(255);
  for(var y = 0; y < rows; y ++){
    for(var x = 0; x < cols; x++){
      //var angle = x;
      //var v = p5.Vector.fromAngle(angle);
      //fill(random(255)); 
      //rect(x * scl, y * scl, scl, scl);
      let index = (x + y * width) * 4;
      let xTrans = x-35;
      let yTrans = y-39;
      let xCom = -yTrans;//(-2*x-2*y)+600;
      let yCom = xTrans-2;//(2*x)-300;
      let v = createVector(xCom,yCom);
      append(vectorField,v);
      push();
      translate(x*scl,y*scl);
      rotate(v.heading());
      vectorField[index] = v;
      let a = vectorField[index];
      line(0,0,a.x,a.y);
      pop();
    }
  }  
  fr.html(floor(frameRate()));
}