let particles = [];
let population = 1000;
let maxLife = 30;
let mag = 3;

function setup() {
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  canvas = createCanvas(width, height);
  canvas.parent("sketchholder");
  
  
  background(200);

  for(let i = 0; i <= population; i++){
    let r = random(0,360);
    let vx = mag*cos(r);
    let vy = mag*sin(r);
    append(particles, new Particle(width/2,height/2,vx,vy));
  }
}


function windowResized(){
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  resizeCanvas(width, height);
}

function draw() {
  noStroke();
  fill(200,200,200,1);
  rect(0,0,width,height);
  
  for(let i = particles.length-1; i>= 0; i--){
    let particle = particles[i];
    particle.update();
    particle.display();
    particle.check();

    if(!particle.alive){
      particles.splice(i,1);
    }
  } 

  noStroke();
  fill(0,0,0);

  // beginShape();
  // for(let particle of particles){
  //   curveVertex(particle.pos.x,particle.pos.y);
  // }
  // endShape(close);

  if(particles.length < population){
    let d = population - particles.length;

    for(let i = 0; i <= d; i++){
      let r = random(0,360);
      let vx = mag*cos(r);
      let vy = mag*sin(r);
      append(particles, new Particle(width/2,height/2,vx,vy));
    }
  }
}