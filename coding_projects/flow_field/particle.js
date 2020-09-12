function Particle(x,y){
  this.pos = createVector(x,y);
  this.vel = createVector();
  this.acc = createVector();
  this.size = 5;
  this.maxSpeed = 3;
  this.maxForce = 5;
}

Particle.prototype.follow = function(location){
  var desired = flowField.lookup(location);
  desired.mult(this.maxSpeed);
  desired.setMag(this.maxSpeed);
  
  var steer = p5.Vector.sub(desired,this.vel);
  steer.limit(this.maxForce);
  
  this.acc.add(steer);
}

Particle.prototype.update = function(){
  this.pos.add(this.vel);
  this.vel.add(this.acc);
  this.acc.mult(0);
}

Particle.prototype.show = function(){
  var theta = this.vel.heading() + PI/2;
  fill(175);
  stroke(0);
  push();
  translate(this.pos.x,this.pos.y);
  rotate(theta);
  beginShape();
  vertex(0, -this.size*2);
  vertex(-this.size, this.size*2);
  vertex(this.size, this.size*2);
  endShape(CLOSE);
  pop();
}