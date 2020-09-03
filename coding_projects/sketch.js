var particles = [];

function setup() {
  wid = windowWidth - 16.9;
  hit = windowHeight;
  canvas = createCanvas(wid, hit);
  //canvas.parent('sketch-holder');
  canvas.position(0,0);
  canvas.style('z-index','-1');  
  canvas.style('position','fixed');

  for(var i = 0; i < 100; i++){
    append(particles, new Particle(random(wid),random(hit)));
  }
}


function windowResized(){
    wid = windowWidth - 16.9;
    hit = windowHeight;
    resizeCanvas(wid, hit)
  }

function draw() {
  background(255);
  strokeWeight(1);
  
  for(i=0;i<particles.length;i++){
    particle = particles[i];
    
    particle.flock(particles);
    particle.update();
    particle.show();      
  }
}