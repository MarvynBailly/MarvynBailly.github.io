//Attraction and Repulsion

//Attraction
//One Vector (x,y) for the attractor object.
// F = G*(m1*m2)/d^2 let mass equal 1. So F=G/(d^2)
//G can be anything. d is proportionality constant

//Repulsion
//Same idea as attraction but F*-1
 
var attractor;
var particle;


function setup() {
  createCanvas(windowWidth, windowHeight);
  background(51);

  attractor = new Attractor (300, 200);
  particle = new Particle (200, 100);
}

function mousePressed() {

}

 function draw() {
  stroke(255);
  strokeWeight(4);
 attractor.show()
 particle.show()
}