function Particle(dna){
  this.pos = createVector(width/2,height);
  this.vel = createVector();
  this.acc = createVector();
  
  if (dna){
    this.dna = dna;
  } else {
    this.dna = new Dna();
  }
  
  this.fitness = 0;
  this.completed = false;
  this.crashed = false;
  
  this.color = color(255,0,0);
  this.size = 8;
}

Particle.prototype.applyForce = function(force){
  this.acc.add(force);
}

Particle.prototype.update = function(){
  var d = dist(this.pos.x,this.pos.y,target.x, target.y);
  if(d < 10){
    this.completed = true;
    this.pos = target.copy();
  }
  
  for(var i = 0; i < obstacles.length; i++){
    if(this.pos.x > obstacles[i].rx && this.pos.x < obstacles[i].rx + obstacles[i].rw  && this.pos.y > obstacles[i].ry && this.pos.y < obstacles[i].ry+obstacles[i].rh){
      this.crashed = true;
    }
  }
  
  if(this.pos.x > width || this.pos.x < 0){
    this.crashed = true;
  }
  
  if(this.pos.y > height || this.pos.y < 0){
    this.crashed = true;
  }
  
  this.applyForce(this.dna.genes[count]);
  if (!this.completed && !this.crashed){
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.vel.limit(4);
  }
}

Particle.prototype.calcFitness = function(){
  var d = dist(this.pos.x,this.pos.y,target.x,target.y);
  var time = -count+lifeSpan;
  
  
  this.fitness = map(d,0,width,width,0) + time;
  
  if(this.completed){
    this.fitness *= 10; //mess with learning rate
  }
  if(this.crashed){
    this.fitness /= 10;
  }
}

Particle.prototype.show = function(){
  var theta = this.vel.heading() + PI/2;
  var ROTATION_ANGLE = theta + PI*3/2;
  var ARC_RADIUS = 35 * this.size;
  var ARC_ANGLE = PI/3;
  
  fill(this.color);
  stroke(0);
  push();
  translate(this.pos.x,this.pos.y);
  rotate(theta);
  beginShape();
  vertex(0, -this.size*2);
  vertex(-this.size, this.size*2);
  vertex(this.size, this.size*2);
  endShape(CLOSE);
  noFill();
  pop();

}