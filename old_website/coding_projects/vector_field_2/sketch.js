var scl = 10;
var vectorFieldx = [];
var vectorFieldy = [];

function setup(){
  pixelDensity(1);
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  canvas = createCanvas(width, height);
  canvas.parent("sketchholder");
  cols = floor(width / scl);
  rows = floor(width / scl);
  fr = createP();

}

function windowResized(){
    var canvasDiv = document.getElementById('sketchholder');
    var width = canvasDiv.offsetWidth;
    var height = canvasDiv.offsetHeight;
    resizeCanvas(width, height);
}

function cords(){
  background(255);
  let xoff = 0;
  for(var x = 0; x <cols; x++){
    let yoff = 0; 
    for(var y = 0; y <rows; y++){
      //let t = map(noise(xoff,yoff),0,1,0,TWO_PI);    
      vectorFieldx[x] = y-x;//cos(t);
      vectorFieldy[y] = -x-y;//sin(t);
      yoff += 0.1;
    }
    xoff  += .1;
  }
}

function displayVector(fvx,fvy,x,y,scl){
  push();
  let v = createVector(fvx,fvy);
  translate(x,y);
  rotate(v.heading());
  line(0,0,fvx,fvy);
  pop();
  // push()
  // stroke(0);
  // //let arrowSize = 4;
  // translate(x,y);
  // let v = createVector(fvx[x/scl],fvy[y/scl]);
  // rotate(v.heading());
  // let len = (v.mag() * scl);
  // line(0,0,len,0);
  // pop();
}

function draw(){
  cords();

  for(var x = 0; x <cols; x++){
    for(var y = 0; y <rows; y++){
      displayVector(vectorFieldx[x],vectorFieldy[y], scl * x, scl * y, scl - 2); 
    }
  }
}