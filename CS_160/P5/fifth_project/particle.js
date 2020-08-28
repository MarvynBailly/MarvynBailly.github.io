function Particle(x,y){
  //this.pos = createVector(random(windowWidth),random(windowHeight));
  this.pos = createVector(x,y);
  this.vel = createVector(random(-5,5),random(-5,5));
  this.acc = createVector();
  this.size = 7;
  this.maxSpeed = 5;
  this.maxForce = 0.3;
}

Particle.prototype.findTarget = function(x,y){
  this.target = createVector(x,y);
}

Particle.prototype.behaviors = function(){
  var arrive = this.arrive(this.target);
  var mouse = createVector(mouseX, mouseY);
  var flee = this.flee(mouse);
  
  arrive.mult(0.3);
  flee.mult(20);
  
  this.acc.add(arrive);
  this.acc.add(flee);
  
}

Particle.prototype.reset = function(){
  this.acc.add(p5.Vector.random2D());
  this.acc.mult(2);
}

Particle.prototype.arrive = function(t){
  var dir = p5.Vector.sub(t,this.pos);
  var d = dir.mag();
  var speed = this.maxSpeed;
  if (d < 100){
    speed = map(d, 0, 100, 0, this.maxSpeed);
  }
  dir.setMag(speed);
  var steer = p5.Vector.sub(dir,this.vel);
  steer.limit(this.maxForce);
  return steer;
}

Particle.prototype.flee = function(t){
  var dir = p5.Vector.sub(t,this.pos);
  var d = dir.mag();
  if(d < 50){
    var speed = abs(winMouseX - pwinMouseX);
    var mapSpeed = map(speed, 0, 50, this.maxSpeed/2, this.maxSpeed);
    dir.setMag(mapSpeed);
    //dir.setMag(this.maxSpeed);
    dir.mult(-1);
    var steer = p5.Vector.sub(dir,this.vel);
    steer.limit(this.maxForce);
    return steer;
  }else{
    return createVector(0,0);
  }
}

Particle.prototype.update = function(){
  this.pos.add(this.vel);
  this.vel.add(this.acc);
  this.acc.mult(0);
}

Particle.prototype.show = function(){
  var col = map(this.vel.mag(),0,4,255,0);
  stroke(255,255,col);
  strokeWeight(this.size);
  point(this.pos.x,this.pos.y); 
  
}