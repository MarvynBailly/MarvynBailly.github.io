var particles = [];
var flowField = [];
"// noprotect" 


function setup() {
  var canvasDiv = document.getElementById('sketchholder');
  wid = canvasDiv.offsetWidth;
  hit = canvasDiv.offsetHeight;
  canvas = createCanvas(wid, hit);
  canvas.parent("sketchholder");
  flowField = new FlowField();
  
  //Create the image of the flow field
  cg = createGraphics(wid,hit);
  
  for(var i = 0; i < flowField.cols; i++){
    var x = i * flowField.res;
    for(var j = 0; j < flowField.rows; j++){
      var y = j * flowField.res;
      var force = flowField.lookup(createVector(x,y));
      cg.stroke(0,0,0,80);
      cg.beginShape();
      cg.vertex(x,y);
      cg.vertex(x + force.x * flowField.res/2,y + force.y * flowField.res/2);
      
      cg.endShape();
      
    }
  }
}

function windowResized(){
  var canvasDiv = document.getElementById('sketchholder');
  wid = canvasDiv.offsetWidth;
  hit = canvasDiv.offsetHeight;
  resizeCanvas(wid, hit);
}

//Add particles
function mouseClicked(){
  for (var i = 0; i < 20; i++){
  append(particles, new Particle(floor(random(wid)),floor(random(hit))));
  }
}

function draw() {
  background(255);
  strokeWeight(1);
  image(cg,0,0);
  
  //Stats
  let fps = frameRate();
  fill(0);
  stroke(0);
  text("FPS: " + fps.toFixed(2) + " | Particles: " + particles.length, 10, height - 10);
  
  
  for(i=0;i<particles.length;i++){
    particle = particles[i];
    particle.follow(particle.pos);
    
    //destroy particle when off screen
    //if(particle.pos.x < 0 || particle.pos.x > wid || particle.pos.y < 0 || particle.pos.y > hit){
    //  particles.splice(particle,0);
    //}
    
    //teleports particle
    if(particle.pos.x < -10){
      particle.pos.x = wid;
    }
    
    if(particle.pos.x > wid){
      particle.pos.x = 0;
    }
    
    if(particle.pos.y > hit+10){
      particle.pos.y = 10;
    }
    
    if(particle.pos.y < -10){
      particle.pos.y = hit;
    }
    
    particle.update();
    particle.show();      

  }
  
}