
var sepSlider,aliSlider,cohSlider,runSlider,chaseSlider;
var particles = [];
var food = [];
var xoff = 0;
var counter = 0;
var runnerAmount = 10;
var chaserAmount = 10;
var iteration = 1;
var seconds = 0;

function setup() {
  var canvasDiv = document.getElementById('sketchholder');
  wid = canvasDiv.offsetWidth;
  hit = canvasDiv.offsetHeight;
  canvas = createCanvas(wid, hit);
  canvas.parent("sketchholder");
  
  create(runnerAmount,chaserAmount);
  
  //Food
  append(food, new Food());
  
}

function windowResized(){
  var canvasDiv = document.getElementById('sketchholder');
  wid = canvasDiv.offsetWidth;
  hit = canvasDiv.offsetHeight;
  resizeCanvas(wid, hit);
}

function create(runnerAmount,chaserAmount){
  for(var i = 0; i < runnerAmount; i++){
    let DNA = new Dna(0);
    append(particles, new Particle(wid/2,100,DNA));
  }
  team = 1;
  for(var j = 0; j < chaserAmount; j++){
    let DNA = new Dna(1);
    append(particles, new Particle(wid/2,hit-100,DNA));
  }
}

function mousePressed() {
  noLoop();
}

function mouseReleased() {
  loop();
}

function resetDraw(seconds){
  var time = seconds;
  iteration ++;
  clear();
  particles = [];
  create(runnerAmount,chaserAmount)
  counter = 0;
}

function draw() {
  seconds = (counter * 0.01).toFixed(2);
  background(255);
  strokeWeight(1);
  var chasers = [];
  var runners = [];
  counter++;
  
  //Teams
  for(var j = 0; j < particles.length; j++){
    particle = particles[j];
    if (particle.team == 0){
      append(runners,particle)
    }
    else if (particle.team == 1){
      append(chasers,particle)
    }
  }
  //noise
  var n = noise(xoff) * 3.5;
  
  //movements
  for(i=0;i<particles.length;i++){
    particle = particles[i];
    if(particle.score > particle.oldScore){
      for(var m = 1; m < particle.reproductionRate; m++){
        if(particle.team == 0){
          append(particles,new Particle(particle.pos.x,particle.pos.y,particle.DNA));
        }
        if(particle.team == 1){
          var chance = round(random(1,5));
          if(chance == 1){
            let DNA = new Dna(particle.team);
            append(particles,new Particle(particle.pos.x,particle.pos.y,particle.DNA));
          }
        }
      }
    }
    
    particle.flock(particles,n,food);
    particle.update();
    particle.show();
    
    
    if(particle.lifeStatus == false){
      if(particle.team == 0){
        if(runners.length > 1){
          particles.splice(i,1);
        }else{
          resetDraw(seconds);
        }
      }
      else if(particle.team == 1){
        if(chasers.length > 1){
          particles.splice(i,1);
        }else{
          resetDraw(seconds);
        }
      }
    }
  }
  xoff += 0.1;
  
  //Food
  if( counter % 100 == 0){
    for(let l = 0; l < 2; l++){
      append(food, new Food());
    }
  }
  
  for(var k = 0; k < food.length; k++){
    f = food[k];
    f.show();
    f.check(runners,particles);
    
    if (f.lifeStatus == false){
      food.splice(k,1);
    }
  }
  
  
  //Stats
  let fps = frameRate();
  fill(0);
  stroke(0);
  text("FPS: " + fps.toFixed(2) + " | chasers: " + chasers.length + " | runners: " + runners.length + " | total: " + particles.length + " | food:" + food.length + " | seconds: " + seconds + " | iteration: " + iteration, 10, height - 20);
}