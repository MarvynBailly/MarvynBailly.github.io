//https://en.wikipedia.org/wiki/Langton%27s_ant
"// noprotect"
var rows;
var cols;
var scl = 2;
var array = [];
var ant;
var direction = 0;
var step = 0;
var div;


function setup() {
  canvas = createCanvas(400, 400);
  canvas.parent("sketchholder");
  background(255);
  div = createDiv('');
  rows = floor(width/scl);
  cols = floor(height/scl);
  for(var i = 0; i < rows; i++){
    array[i] = [];
    for(var j = 0; j < cols; j++){
      array[i][j] = 255;
    }
  }
  spot = 0;
  ant = createVector(rows/2,cols/2,direction[spot]);
}

function windowResized(){
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  resizeCanvas(width, height);
}

function mousePressed(){
  background(255);
  for(var i = 0; i < rows; i++){
    for(var j = 0; j < cols; j++){   
      fill(array[i][j]);
      stroke(255);
      rect(i * scl,j * scl,scl,scl);
    }
  }
  stroke(0);
  noFill();
  text("Steps: " + step, 20, height - 20); 
}

function draw() {
  var color;
  
  if(array[ant.x][ant.y] == 40){
    if(direction == 3){
      direction = 0;
    } else{
      direction++;
    }
    color = 240;
  } else{
    if(direction == 0){
      direction = 3;
    }else{
      direction--;
    }
    color = 40;
  }
  array[ant.x][ant.y] = color;
  
  ant.z = direction;
  
  if(ant.z == 0){
    ant.x ++;
    if(ant.x == rows){
      ant.x = 1;
    }
  }
  if(ant.z == 1){
    ant.y --;
    if(ant.y == 0){
      ant.y = cols-1;
    }
  }
  if(ant.z == 2){
    ant.x --;
    if(ant.x == 0){
      ant.x = rows-1;
    }
  }
  if(ant.z == 3){
    ant.y ++;
    if(ant.y == cols){
      ant.x = 1;
    }
  }
  step++;

  stroke(0);
  noFill();
}