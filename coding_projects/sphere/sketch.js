function setup() {
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  canvas = createCanvas(width, height);
  canvas.parent("sketchholder");
  background(255);
  angleMode(RADIANS);
}

function windowResized(){
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  resizeCanvas(width, height);
}

function randomIntShading(){
  let choice = int(random(1,9));
  if(choice >= 1 & choice <= 3){
    return random(0, 1/2 * PI);
  }
  else if(choice == 4 || choice == 5){
    return random(1/2 * PI , PI);
  }
  else if(choice == 6 || choice == 7){
    return random(3/2 * PI, 2 * PI);
  }
  else if(choice == 8){
    return random(PI ,3/2 * PI);
  }
}

function randomInt(){
  return random(0,2*PI);
}

function getPoint(){
  let a = randomIntShading();
  return createVector(150 * cos(a),150 * sin(a));
  
}

function draw() {
  stroke(0,0,0,15);
  translate(200,200);
  let point1 = getPoint();
  let point2 = getPoint();
  line(point1.x,point1.y,point2.x,point2.y);
}