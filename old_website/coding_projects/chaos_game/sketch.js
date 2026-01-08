var a,b,c,x,y;
var jump = 1/2;

function setup() {
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  canvas = createCanvas(width, height);
  canvas.parent("sketchholder");
  background(220);
  a = createVector(random(width),random(height));
  b = createVector(random(width),random(height));
  c = createVector(random(width),random(height));
  x = random(width);
  y = random(height);
}

function mouseClicked(){
  background(220);
  a = createVector(random(width),random(height));
  b = createVector(random(width),random(height));
  c = createVector(random(width),random(height));
  x = random(width);
  y = random(height);
}

function windowResized(){
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  resizeCanvas(width, height);
}

function draw() {
  strokeWeight(10);
  stroke(255,0,0);
  point(a);
  stroke(0,255,0);
  point(b);
  stroke(0,0,255);
  point(c);
  strokeWeight(1);
  for(var i = 0; i < 1000; i++){
    var r = floor(random(3));
    if(r == 0){
      stroke(255,0,0);
      x = lerp(x,a.x,jump);
      y = lerp(y,a.y,jump);
    }
    if(r == 1){
      stroke(0,255,0);
      x = lerp(x,b.x,jump);
      y = lerp(y,b.y,jump);
    }
    if(r == 2){
      stroke(0,0,255);
      x = lerp(x,c.x,jump);
      y = lerp(y,c.y,jump);
    }
    point(x,y);
    
  }
  
  
}