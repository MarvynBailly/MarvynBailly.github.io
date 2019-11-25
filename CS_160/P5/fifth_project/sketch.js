//Attraction and Repulsion

//Attraction
//One Vector (x,y) for the attractor object.
// F = G*(m1*m2)/d^2 let mass1 equal 1. So F=(G*m2)/(d^2)
//G can be anything. d is proportionality constant

//Repulsion
//Same idea as attraction but F*-1
 
var attractors = [];
var particles;
var attractors_cords = [];
var x_cord;

function setup() {
  stroke(255,3);
  strokeWeight(4);
  createCanvas(windowWidth, windowHeight);
  background(51);
}

function mousePressed() {
  attractors.push(createVector(100,100));
}

function draw() {
  for (var i = 0; i < attractors.length; i++); {
    particles = new Particle (600,100);
    mass = attractors.get_mass();
    attractors_cords = attractors.get_cords();
    attractors.show();
    particles.attracted(attractors_cords, mass);
    particles.update();
    particles.show();
  }
}
