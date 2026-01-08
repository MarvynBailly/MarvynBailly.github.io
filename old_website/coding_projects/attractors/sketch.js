var attractors = [];
var particles = [];
var masses = [];

function setup() {
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  canvas = createCanvas(width, height);
  canvas.parent("sketchholder");
  background(51);
//  particles.push(new Particle(200+windowWidth/2,windowHeight/2));
  //particles.push(new Particle(random(width), random(height)));
}

//function mousePressed() {
//  attractors.push(createVector(windowWidth/2,windowHeight/2));  
//  masses.push(random(1,80))
//  attractors.push(createVector(mouseX,mouseY));
//  masses.push(random(1,80))
//}

function windowResized(){
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  resizeCanvas(width, height);
}

function mousePressed() {
  if (mouseButton == LEFT){
    attractors.push(createVector(mouseX,mouseY));
    masses.push(random(1,80))
  }
  
  if (mouseButton == RIGHT){
    particles.push(new Particle(mouseX,mouseY));
  }
}


function draw() {
  stroke(255);


  for (var i = 0; i < attractors.length; i++) {
    stroke(255);
    fill(255);
    circle(attractors[i].x, attractors[i].y,masses[i]);
  }
  for (var i = 0; i < particles.length; i++) {
    stroke(255,255,255,30); //Get a cool color thing here 
    var particle = particles[i];
    var mass = masses[i];
    for (var j = 0; j < attractors.length; j++) {
      particle.attracted(attractors[j],mass);
    }
    particle.update();
    particle.show();
  }

}