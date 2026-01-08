function Particle(x, y, team) {
  zeroVector = createVector(0, 0);

  this.pos = createVector(x, y);
  this.vel = createVector(random(-5,5));
  this.acc = createVector();
  this.normalPoint = createVector();
  this.target = createVector();
  this.prodectLoc = createVector();
  this.distance = createVector();
  this.maxForce = 0.2;
  this.maxSpeed = 0;
  this.seperateSize = 0;
  this.chaseRange = 0;
  
  this.reproductionRate = 0;
  this.lifeSpan = 0;
  this.lifeSpanMax = 0;
  this.lifeStatus = true;
  this.team = team;
  
  this.color = color(0,0,0);
  
  this.score = 0;
  this.oldScore = 0;
  
  this.gate = false;
  this.hit = false;

}

Particle.prototype.flock = function(p,n,f) {
  teamMates = [];
  opp = [];
  var run = createVector();
  var chase = createVector();
  var food = createVector();
  
  if(this.lifeSpan == 0){
    this.assignTeam();
  }
  
  this.findTeam(p);
  this.border();
  chase = this.chase(opp,p);
  
  var sep = this.seperate(teamMates);
  var ali = this.align(teamMates);
  var coh = this.cohesion(teamMates);

  if (this.team == 0){ 
    run = this.run(opp);
    food = this.findFood(f);
  }
  
  this.lifeCycle(p);
  this.oldScore = this.score;
  
  if (this.team == 1){
    this.checkHit(opp,p);
  }
  
  sep.mult(2     * 1);
  ali.mult(1     * 1);
  coh.mult(1     * 1);
  run.mult(2     * 1);
  chase.mult(1.6 * 1);
  food.mult(1.2 * 1);
  
  this.acc.add(sep);
  this.acc.add(ali);
  this.acc.add(coh);
  
  this.acc.add(run);
  this.acc.add(chase);
  
  this.acc.add(food);
}

Particle.prototype.findFood = function(f){
  var record = 200;
  var count = 0;
  var target = createVector();
  
  for (var i = 0; i < f.length; i++) {
    var food = f[i];
    var distance = p5.Vector.dist(this.pos,food.pos);
    
    if(distance < record){
      record = distance;
      count ++;
      target = food;
    }
  }
  if (count > 0){
    var steer = this.seekTarget(target);
    return steer;
  }else{
    return createVector(0,0);
  }
}

Particle.prototype.lifeCycle = function(p){
  var b = 0;
  var s;
  var r = 0;
  
  if(this.lifeSpan > this.lifeSpanMax){
    this.lifeStatus = false;
  }
  
  if(this.score > this.oldScore){
    this.lifeSpan = 0;
  }else{
    this.lifeSpan += 1;
    if(this.team == 0){
      r = map(this.lifeSpan,0,this.lifeSpanMax,255,0);
      s = map(this.lifeSpan,0,this.lifeSpanMax,5,1);
    }
    else if(this.team == 1){
      b = map(this.lifeSpan,0,this.lifeSpanMax,255,0);
      s = map(this.lifeSpan,0,this.lifeSpanMax,5,4.5);
    }
  }
  this.color = color(r,0,b);
  this.maxSpeed = s;
}

Particle.prototype.findTeam = function(p){
  for (var i = 0; i < p.length; i++) {
    var other = p[i];
    if (this.team == other.team){
      append(teamMates,other);
    }else{
      append(opp, other);
    }
  }
}

Particle.prototype.checkHit = function(others,p) {
  
  for (var i = 0; i < others.length; i++) {
    var other = others[i];
    var distance = p5.Vector.dist(this.pos, other.pos);
    if(distance < 50){
      this.hit = true;
    }else{
      this.hit = false;
    }
    if(this.gate == false){
      if(this.hit == true){
        if(this.team == 0){
          other.oldScore = other.score;
          other.score++;
          this.lifeStatus = false;  
        }
        if(this.team == 1){
          this.score++;
          other.lifeStatus = false;
        }
        this.gate = true;
      } 
    }
    if(this.hit == false){
      this.gate = false;
    }
  }
}

Particle.prototype.run = function(others) {
  var desiredseparation = others[0].size * 20;
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

Particle.prototype.seperate = function(others) {
  var desiredseparation = this.seperateSize;
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

Particle.prototype.chase = function(others) {
  if(this.team == 0){
    return zeroVector.copy();
  } else {
    var range = this.chaseRange;

    var sum = zeroVector.copy();
    var count = 0;

    for (var i = 0; i < others.length; i++) {
      var other = others[i];
      var d = p5.Vector.dist(this.pos, other.pos);

      if (d < range) {
        sum.add(other.pos);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      var steer = this.seek(sum);
      return steer;
    } else {
      return zeroVector.copy();
    }
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

Particle.prototype.border = function() {
  //teleports particle
  if (this.pos.x < -10) {
    this.pos.x = wid + 10;
  }

  if (this.pos.x > wid + 10) {
    this.pos.x = -10;
  }

  if (this.pos.y > hit + 10) {
    this.pos.y = -10;
  }

  if (this.pos.y < -10) {
    this.pos.y = hit + 10;
  }
}

Particle.prototype.seekTarget = function(t) {
  var dir = p5.Vector.sub(t.pos, this.pos);
  var d = dir.mag();
  var speed = this.maxSpeed;

  dir.setMag(speed);
  var steer = p5.Vector.sub(dir, this.vel);
  steer.limit(this.maxForce);
  return steer;
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

Particle.prototype.getTheta = function(){
  var theta = this.vel.heading() + PI/2;
  return theta;
}

Particle.prototype.inVision = function(other){
  var inVis = false;
  var ROTATION_ANGLE = this.getTheta() + PI*3/2;
  var ARC_RADIUS = 35 * this.size;
  var ARC_ANGLE = PI/3;
  
  inVis = collidePointArc(mouseX,mouseY,this.pos.x,this.pos.y,ARC_RADIUS,ROTATION_ANGLE,ARC_ANGLE);
  return inVis;
}

Particle.prototype.assignTeam = function(){
  if (this.team == 0){
    this.color = color(255,0,0);
    this.maxSpeed = 5;
    this.size = 8;
    this.seperateSize = this.size * 3;
    this.lifeSpanMax = random(2000,2500);
    this.reproductionRate = 4;
  }
  if (this.team == 1){
    this.color = color(0,0,255);
    this.maxSpeed = 5;
    this.size = 12;
    this.lifeSpanMax = random(1000,1200);
    this.seperateSize = this.size * 3;
    this.chaseRange = 300;
    this.reproductionRate = 2;
  }
}

Particle.prototype.show = function(){
  theta = this.getTheta();
  var ROTATION_ANGLE = this.getTheta() + PI*3/2;
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
  
  //if(this.team == 1){
  //text(this.score,0,20);
  //}
  
  //stroke(0,0,0,50);
  //rotate(ROTATION_ANGLE-theta);
  //arc(0,0,2 * ARC_RADIUS,2 * ARC_RADIUS, -ARC_ANGLE / 2, ARC_ANGLE / 2, PIE);
  pop();
}