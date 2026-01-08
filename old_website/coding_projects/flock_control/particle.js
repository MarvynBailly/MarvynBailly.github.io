function Particle(x, y) {
  zeroVector = createVector(0, 0);

  this.pos = createVector(x, y);
  this.vel = createVector(random(-1,1),random(-1,1));
  this.acc = createVector();
  this.normalPoint = createVector();
  this.target = createVector();
  this.prodectLoc = createVector();
  this.distance = createVector();
  this.size = 10;
  this.maxSpeed = 5;
  this.maxForce = 0.3;
  this.controlled = false;
  this.color = 255;
}

Particle.prototype.control = function(){
  this.color = color(255, 215, 0);
  
  
  
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
      this.vel.add(createVector(-this.maxForce,0))
  }
  if(keyIsDown(UP_ARROW) || keyIsDown(87)){
      this.vel.add(createVector(0,-this.maxForce))
  }
  if(keyIsDown(RIGHT_ARROW) || keyIsDown(68)){
      this.vel.add(createVector(this.maxForce,0))
  }
  if(keyIsDown(DOWN_ARROW) || keyIsDown(83)){
      this.vel.add(createVector(0,this.maxForce))
  }
}

Particle.prototype.checkMouse = function(){
  var range = 20;
  var c = 0;
  var target = createVector(mouseX,mouseY);
  var distance = p5.Vector.dist(this.pos, target);
  if(distance < range && mouse.isTrusted == true){
    range = distance;
    this.acc.mult(0);
    this.vel.mult(0);
    this.controlled = true;
  }
}

Particle.prototype.flock = function(p) {
  this.checkMouse();
  this.border();
  
  if(!this.controlled){
    this.color = 0;
    var sep = this.seperate(p);
    var ali = this.align(p);
    var coh = this.cohesion(p);


    sep.mult(2);
    ali.mult(1);
    coh.mult(1);

    this.acc.add(sep);
    this.acc.add(ali);
    this.acc.add(coh);

  } else {
    this.control();
  }
}


Particle.prototype.border = function() {
  //teleports particle
  if (this.pos.x < -10) {
    this.pos.x = wid - 10;
  }

  if (this.pos.x > wid + 10) {
    this.pos.x = -10;
  }

  if (this.pos.y > hit + 10) {
    this.pos.y = -10;
  }

  if (this.pos.y < -10) {
    this.pos.y = hit - 10;
  }
}


Particle.prototype.seperate = function(others) {
  var desiredseparation = this.size * 2;
  var sum = createVector();
  var count = 0;

  for (var i = 0; i < others.length; i++) {
    var other = others[i];
    var distance = p5.Vector.dist(this.pos, other.pos);

    if ((distance > 0) && (distance < desiredseparation)) {
      var opposite = p5.Vector.sub(this.pos, other.pos);
      opposite.normalize();
      opposite.div(distance);
      sum.add(opposite);
      count++;
    }
  }

  if (count > 0) {
    sum.div(count);
    sum.setMag(this.maxSpeed);
    var steer = p5.Vector.sub(sum, this.vel);
    steer.limit(this.maxForce);
    return steer;
  } else {
    return zeroVector.copy();
  }
}


Particle.prototype.align = function(others) {
  var range = 50;
  var sum = zeroVector.copy();
  var count = 0;

  for (var i = 0; i < others.length; i++) {
    var other = others[i];
    var d = p5.Vector.dist(this.pos, other.pos);

    if ((d > 0) && (d < range)) {
      sum.add(other.vel);
      count++;
    }
  }

  if (count > 0) {
    sum.div(others.length);
    sum.setMag(this.maxSpeed);
    var steer = p5.Vector.sub(sum, this.vel);
    steer.limit(this.maxForce);
    return steer;
  } else {
    return zeroVector.copy();
  }
}


Particle.prototype.cohesion = function(others) {
  var range = 10;
  var sum = zeroVector.copy();
  var count = 0;

  for (var i = 0; i < others.length; i++) {
    var other = others[i];
    var d = p5.Vector.dist(this.pos, other.pos);

    if ((d > 0) && (d < range)) {
      sum.add(other.pos);
      count++;
    }
  }

  if (count > 0) {
    sum.div(others.length);
    sum.setMag(this.maxSpeed);
    var steer = p5.Vector.sub(sum, this.vel);
    steer.limit(this.maxForce);
    return this.seek(sum);
  } else {
    return zeroVector.copy();
  }
}

Particle.prototype.seek = function(t) {
  var dir = p5.Vector.sub(t, this.pos);
  var d = dir.mag();
  var speed = this.maxSpeed;

  dir.setMag(speed);
  var steer = p5.Vector.sub(dir, this.vel);
  steer.limit(this.maxForce);
  return steer;
}

Particle.prototype.update = function() {
  this.pos.add(this.vel);
  this.vel.add(this.acc);
  this.vel.limit(this.maxSpeed);
  this.acc.mult(0);
}

Particle.prototype.show = function() {
  var theta = this.vel.heading() + PI / 2;
  fill(175);
  stroke(this.color);
  push();
  translate(this.pos.x, this.pos.y);
  rotate(theta);
  beginShape();
  vertex(0, -this.size * 2);
  vertex(-this.size, this.size * 2);
  vertex(this.size, this.size * 2);
  endShape(CLOSE);
  pop();
}