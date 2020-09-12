var sepSlider,aliSlider,cohSlider,runSlider,chaseSlider;
var particles = [];
var food = [];
var xoff = 0;
var counter = 0;
var runnerAmount = 100;
var chaserAmount = 20;
var iteration = 1;
var seconds = 0;
var genes = [];

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

function create(runnerAmount,chaserAmount){
  var record = 1;
  var parents = [];
  
  for(var i = 0; i < runnerAmount; i++){
    let DNA = new Dna(0);
    if(iteration == 1){
      DNA.generate();
    }else{
      for(var l = 0; l < genes.length; l++){
        gene = genes[l];
        if (gene.team == 0){
          if(gene.fitness > record){
            append(parents,gene);
            record = gene.fitness;
          }
        }
      }
      DNA.copy(parents);
    }
    append(particles, new Particle(wid/2,100,DNA));
  }
  
  team = 1;
  for(var j = 0; j < chaserAmount; j++){
    let DNA = new Dna(1);
    if(iteration == 1){
      DNA.generate();
    }else{
      for(var m = 1; m < genes.length; m++){
        gene = genes[m];
        if (gene.team == 0){
          if(gene.fitness > record){
            append(parents,gene);
            record = fitness;
          }
        }
      }
      DNA.copy(parents);
    }
    append(particles, new Particle(wid/2,hit-100,DNA));
  }
}

function mousePressed() {
  noLoop();
}

function mouseReleased() {
  loop();
}

function resetDraw(){
  iteration ++;
  particles = [];
  food = [];
  counter = 0;
  clear();
  
  for(var i = 0; i < genes.length; i++){
    let DNA = genes[i];
    
  }
  
  create(runnerAmount,chaserAmount)
}

function windowResized(){
  var canvasDiv = document.getElementById('sketchholder');
  wid = canvasDiv.offsetWidth;
  hit = canvasDiv.offsetHeight;
  resizeCanvas(wid, hit);
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
          let gene = [];
          //append(gene,particle.DNA);
          append(gene,particle.DNA);
          let DNA = new Dna(particle.team);
          DNA.copy(gene);
          append(particles,new Particle(particle.pos.x,particle.pos.y,DNA));
        }
        if(particle.team == 1){
          var chance = round(random(1,5));
          if(chance == 1){
            let gene = [];
            //append(gene,particle.DNA);
            append(gene,particle.DNA);
            let DNA = new Dna(particle.team);
            DNA.copy(gene);
            append(particles,new Particle(particle.pos.x,particle.pos.y,DNA));
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
          particle.DNA.fit(particle.lifeTotal,particle.score); 
          append(genes,particle.DNA);
          particles.splice(i,1);
        }else{
          for(let i = 0; i < chasers.length; i++){
            let chaser = chasers[i];
            chaser.DNA.fit(chaser.lifeTotal,chaser.score);
            append(genes,chaser.DNA);
          }
          resetDraw();
        }
      }
      else if(particle.team == 1){
        if(chasers.length > 1){
          particle.DNA.fit(particle.lifeTotal,particle.score);
          append(genes,particle.DNA);
          particles.splice(i,1);
        }else{
          for(let i = 0; i < runners.length; i++){
            let runner = runners[i];
            runner.DNA.fit(runner.lifeTotal,runner.score);
            append(genes,runner.DNA);
          }
          resetDraw();
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