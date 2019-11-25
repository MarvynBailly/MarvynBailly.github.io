function Particle(x, y) {
    this.pos = createVector(x, y);
    this.prev = createVector(x, y);
    p5.Vector.random2D();
    this.vel = p5.Vector.random2D();
    this.acc = createVector();
  
    this.update = function() {
      this.vel.add(this.acc);
      this.vel.limit(5);
      this.pos.add(this.vel);
      this.acc.mult(0);
    }
  
    this.show = function() {
      stroke(255, 100);
      strokeWeight(4);
      line(this.pos.x, this.pos.y, this.prev.x, this.prev.y);
  
      this.prev.x = this.pos.x;
      this.prev.y = this.pos.y;
  
    }
  
    this.attracted = function(target,mass) {
      mass = mass;
      var force = p5.Vector.sub(target, this.pos);
      var d = force.mag();
      d = constrain(d, 1, 25);
      var G =mass;
      var strength = G / (d * d);
      if (d < 20) {
        force.mult(-10);
      }
      force.setMag(strength);
      this.acc.add(force);
    }
}