var n,d;

function setup() {
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  canvas = createCanvas(width, height);
  canvas.parent("sketchholder");
  angleMode(DEGREES);
  n = floor(random(1,21));
  d = floor(random(1,21));
}

function windowResized(){
    var canvasDiv = document.getElementById('sketchholder');
    var width = canvasDiv.offsetWidth;
    var height = canvasDiv.offsetHeight;
    resizeCanvas(width, height);
}

function draw() {
  background(0);
  translate(width / 2, height / 2);
  stroke(225);
  if(frameCount % 100 == 0){
    n = floor(random(1,21));
    d = floor(random(1,21));
  }
  noFill();
  beginShape();
  for (let i = 0; i < 361 * 20; i++) {
    let k = n/d
    let r = 200 * cos(k * i);
    let x = r * cos(i)
    let y = r * sin(i) 
    vertex(x, y);
  }
  endShape();
}