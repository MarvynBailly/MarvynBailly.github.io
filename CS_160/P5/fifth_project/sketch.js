//Attraction and Repulsion

//Attraction
//One Vector (x,y) for the attractor object.
// F = G*(m1*m2)/d^2 let mass equal 1. So F=G/(d^2)
//G can be anything. d is proportionality constant

//Repulsion
//Same idea as attraction but F*-1
var attractors = [];
var particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(51);
}

function mousePressed() {
  attractors.push(createVector(mouseX, mouseY));
}

function draw() {
  
  stroke(255);
  strokeWeight(4);
  //particles.push(new Particle(point(200,200)));
  particles.push(new Particle(random(width), random(height)));

  if (particles.length > 400) {
    particles.splice(0, 1);
  }

   for (var i = 0; i < attractors.length; i++) {
     stroke(0, 255, 0);
     point(attractors[i].x, attractors[i].y);
   }
  
   for (var i = 0; i < particles.length; i++) {
     var particle = particles[i];
     for (var j = 0; j < attractors.length; j++) {
       particle.attracted(attractors[j]);
     }
     particle.update();
     particle.show();
   }

}