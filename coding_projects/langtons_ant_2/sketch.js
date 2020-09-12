//https://en.wikipedia.org/wiki/Langton%27s_ant
"// noprotect"

var rows;
var cols;
var scl = 2;
var array = [];
var ants = [];

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
      array[i][j] = color(255,255,255);
    }
  }
  
  append(ants,new Ant(40,40,color(255,0,0)));
  append(ants,new Ant(rows-40,40,color(0,255,0)));
  append(ants,new Ant(rows-40,cols-40,color(0,0,255)));
  append(ants,new Ant(40,cols-40,color(255,255,0)));
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
  text("Steps: " + step); 
}

function draw() {
  for(var i = 0; i < ants.length; i++){
    var ant = ants[i];
    array[ant.position.x][ant.position.y] = ant.findColor(array); 
    ant.move(cols,rows);
  }
  
  step++;
}