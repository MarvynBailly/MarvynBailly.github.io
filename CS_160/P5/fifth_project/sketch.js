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
var y_cord;

function setup() {
  stroke(255,3);
  strokeWeight(4);
  createCanvas(windowWidth, windowHeight);
  background(51);
  //attractors = new Attractor(100,100);
}


function mousePressed() {
  x_cord = mouseX
  y_cord = mouseY
  attractors = new Attractor(x_cord,y_cord);
}

function show() {
  stroke(255);
  strokeWeight(mass);
  point(x_cord,y_cord);
}

function get_mass(){
  mass = random(1,8)
  return mass * 10
} 

function draw() {
    particles = new Particle (600,100);
    mass = get_mass();
    attractors_cords = createVector(x_cord,y_cord);
    show();
    particles.attracted(attractors_cords, mass);
    particles.update();
    particles.show();
}

