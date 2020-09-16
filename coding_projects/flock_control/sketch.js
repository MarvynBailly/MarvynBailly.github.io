var particles = [];
var controlledParticle;
var gate = true;
mouse = new MouseEvent(event);

function setup() {
  var canvasDiv = document.getElementById('sketchholder');
  wid = canvasDiv.offsetWidth;
  hit = canvasDiv.offsetHeight;
  canvas = createCanvas(wid, hit);
  canvas.parent("sketchholder");


  for(var i = 0; i < 100; i++){
    append(particles, new Particle(wid/2,hit/2));
  }
}

function keyPressed(){
  if(keyCode == 32){
    if(gate){
      noLoop()
      gate = false;
    }else{
      loop();
      gate = true;
    }
  }
}

function mousePressed(event){
  for(i=0;i<particles.length;i++){
    particles[i].controlled = false;
  }
  mouse = event;
}

//Add particles
//function mouseDragged(){
//  append(particles, new Particle(mouseX,mouseY));
//}

function windowResized(){
  var canvasDiv = document.getElementById('sketchholder');
  wid = canvasDiv.offsetWidth;
  hit = canvasDiv.offsetHeight;
  resizeCanvas(wid, hit);
}

function draw() {
  background(255);
  strokeWeight(1);
  
  for(i=0;i<particles.length;i++){
    particle = particles[i];
    
    particle.flock(particles);
    particle.update();
    particle.show(); 
    
    if(particle.controlled == true){
      controlledParticle = particle;
    }
  }
  mouse = new MouseEvent(event);
  //Stats
  let fps = frameRate();
  fill(0);
  stroke(0);
  //text("FPS: " + fps.toFixed(2) + " | Particles: " + particles.length, 10, height - 20);
  
}