
var sepSlider,aliSlider,cohSlider,runSlider,chaseSlider;
var particles = [];
var food = [];
var xoff = 0;
var counter = 0;
var runnerAmount = 100;
var chaserAmount = 10;
var iteration = 1;
var seconds = 0;

function setup() {
  var canvasDiv = document.getElementById('sketchholder');
  wid = canvasDiv.offsetWidth;
  hit = canvasDiv.offsetHeight;
  canvas = createCanvas(wid, hit);
  canvas.parent("sketchholder");
  
  //Sliders
  /*sepSlider = createSlider(0,10,1,0.5);
  //sepSlider.position(200,height-35);
  //aliSlider = createSlider(0,10,1,0.5);
  //aliSlider.position(400,height-35);
  //cohSlider = createSlider(0,10,1,0.5);
  //cohSlider.position(600,height-35);
  //runSlider = createSlider(0,10,1,0.5);
  //runSlider.position(800,height-35);
  //chaseSlider = createSlider(0,10,1,0.5);
  //chaseSlider.position(1000,height-35);
  */
  
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
  var team = 0;
  for(var i = 0; i < 100; i++){
    append(particles, new Particle(wid/2,100,team));
  }
  team = 1;
  for(var j = 0; j < 5; j++){
    append(particles, new Particle(wid/2,hit-100,team));
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
  //Slider
  /*
  //var sep = sepSlider.value();
  //var ali = aliSlider.value();
  //var coh = cohSlider.value();
  //var run = runSlider.value();
  //var chase = chaseSlider.value();
  //text('Sep: '+sep, 200 + sepSlider.width + 2, height-20 );
  //text('Ali: '+ali, 400 + aliSlider.width + 2, height- 20 );
  //text('Coh: '+coh, 600 + cohSlider.width + 2, height-20 );
  //text('Run: '+run, 800 + runSlider.width + 2, height-20 );
  //text('Chase: '+sep, 1000 + chaseSlider.width + 2, height-20 );
  */
  
  
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
          append(particles,new Particle(particle.pos.x,particle.pos.y,particle.team));
        }
        if(particle.team == 1){
          var chance = round(random(1,5));
          if(chance == 1){
            append(particles,new Particle(particle.pos.x,particle.pos.y,particle.team));
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