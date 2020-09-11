let points = []

function setup(){
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  canvas = createCanvas(width, height);
  canvas.parent("sketchholder");
  pixelDensity(1);
  stroke(255,255,255);
}

function windowResized(){
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  resizeCanvas(width, height);
}

function draw(){
  //noLoop();
  //for(let i = 0; i < 8; i++){
  //  let j = createVector(round(random(400)),round(random(400)));
  //  append(points,j);
  //  print(points[i].x,points[i].y);
  //}
  background(0);

  loadPixels();
  for(var x = 0; x < width; x++){
    for(var y = 0; y < height; y++){
      let index = (x + y * width) * 4;
      let a = random(255);
      pixels[index] = a;
      pixels[index+1] = a;
      pixels[index+2] = a;
      pixels[index+3] = 255;
      
      //for(let i = 0; i < points.length+1; i++){
      //  strokeWeight(10);
      //  point(points[i].x,points[i].y);
      //}
    }
  }

  updatePixels(); 
}