function Population(){
  this.particles = [];
  this.popSize = 100;
  this.matingPool = [];
  
  for (var i = 0; i < this.popSize; i++){
    this.particles[i] = new Particle();
  }
}

Population.prototype.run = function(){
  for (var i = 0; i < this.popSize; i++){
    this.particles[i].update();
    this.particles[i].show();
  }
}

Population.prototype.evaluate = function(){
  var maxFit = 0;
  for (let i = 0; i < this.popSize; i++){
    this.particles[i].calcFitness();
    if(this.particles[i].fitness > maxFit){
      maxFit = this.particles[i].fitness;
    }
  }

  
  for (let i = 0; i < this.popSize; i++){
    this.particles[i].fitness /= maxFit;
  } 
  this.matingPool = [];
  for (var i = 0; i < this.popSize; i++){
    var n = this.particles[i].fitness * 100;
    for(var j = 0; j < n; j++){
      this.matingPool.push(this.particles[i]);
    }
  }
}

Population.prototype.selection = function(){
  var newParticles = [];
  for(var i = 0; i < this.particles.length; i++){ 
    var parentA = random(this.matingPool).dna;
    var parentB = random(this.matingPool).dna;
    var child = parentA.crossOver(parentB);
    child.mutation();
    newParticles[i] = new Particle(child);
  }
  this.particles = newParticles;
}