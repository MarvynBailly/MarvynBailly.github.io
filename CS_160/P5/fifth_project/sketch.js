//Attraction and Repulsion

//Attraction
//One Vector (x,y) for the attractor object.
// F = G*(m1*m2)/d^2 let mass1 equal 1. So F=(G*m2)/(d^2)
//G can be anything. d is proportionality constant

//Repulsion
//Same idea as attraction but F*-1
 
var attractors;
var particles;
var attractors_cords = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(51);
  attractors = new Attractor (200, 300);
  particles = new Particle (600,100);
}

function draw() {
  stroke(255);
  strokeWeight(4);
  mass = attractors.get_mass();
  attractors_cords = attractors.get_cords();
  attractors.show();
  particles.attracted(attractors_cords, mass);
  particles.update();
  particles.show();
}
