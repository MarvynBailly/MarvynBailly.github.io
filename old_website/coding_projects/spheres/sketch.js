spheres = [];
let count = 0;
let countDiv;

function setup(){
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  canvas = createCanvas(width, height);
  canvas.parent("sketchholder");
  background(255); 
  countDiv = createDiv(count);
  countDiv.style('font-size', '24pt');
}

function windowResized(){
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  resizeCanvas(width, height);
}

function rose(){
  angleMode(DEGREES);
  sphereCenter = new sphereOb(200,200);
  sphereCenter.draw();
  for(i = 0; i <= 360; i += 15){
    spheres = new sphereOb(200+100*cos(i),200+100*sin(i));
    spheres.draw();
  }
}

function draw(){
  rose();
  countDiv.html("Number of lines: " + count);
}