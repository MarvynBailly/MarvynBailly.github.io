function Particle(x, y) {
    zeroVector = createVector(0, 0);
  
    this.pos = createVector(x, y);
    this.vel = createVector(random(-2,2),random(-2,2));
    this.acc = createVector();
    this.normalPoint = createVector();
    this.target = createVector();
    this.prodectLoc = createVector();
    this.distance = createVector();
    this.size = 10;
    this.maxSpeed = 5;
    this.maxForce = 0.5;
  }
  
  Particle.prototype.flock = function(p) {
  
    var sep = this.seperate(p);
    var ali = this.align(p);
    var coh = this.cohesion(p);
  
  
    sep.mult(2);
    ali.mult(1);
    coh.mult(1);
  
    this.acc.add(sep);
    this.acc.add(ali);
    this.acc.add(coh);
  
    this.border();
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
    var desiredseparation = this.size * 3;
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
    this.acc.mult(0);
  }
  
  Particle.prototype.show = function() {
    var theta = this.vel.heading() + PI / 2;
    fill(175,175,175,50);
    stroke(0,0,0,60);
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