function Particle(x, y) {
    this.pos = createVector(x, y);
    this.prev = createVector(x, y);
    this.vel = p5.Vector.random2D(10,100); 
    this.acc = createVector();
  
    this.update = function() {
      this.vel.add(this.acc);
      this.vel.limit(5);
      this.pos.add(this.vel);
      this.acc.mult(0);
    }
  
    this.show = function() {
      strokeWeight(4);
      line(this.pos.x, this.pos.y, this.prev.x, this.prev.y);
  
      this.prev.x = this.pos.x;
      this.prev.y = this.pos.y;
  
    }
  
    this.attracted = function(target,mass) {
      var force = p5.Vector.sub(target, this.pos);
      var d = force.mag();
      d = constrain(d, 1, 25);
      var G = 1;
      var strength = 9 / (d * d);
      force.setMag(strength);
      if (d < 20) {
        force.mult(-10);
      }
      this.acc.add(force);
    }
  
  }