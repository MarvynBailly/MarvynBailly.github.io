var scl = 5;

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
      var xTrans = x-35;
      var yTrans = y-39;
      var xCom = -yTrans;//(-2*x-2*y)+600;
      var yCom = xTrans-2;//(2*x)-300;
      var v = createVector(xCom,yCom);
      push();
      translate(x*scl,y*scl);
      //rotate(v.heading());
      line(0,0,v.x,v.y);
      pop();
    }
  }  
  fr.html(floor(frameRate()));
}