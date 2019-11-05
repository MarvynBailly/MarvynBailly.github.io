function Particle(x, y) {
    this.pos = createVector(x,y);
    this.vel = createVector();
    this.acc = createVector();

    this.update = function() {
        this.pos.add(this.vel);
        this.vel.add(this.acc)
    }

    this.show  = function(){
        stroke(255);
        strokeWeight(4);
        point(this.pos.x, this.pos.y);
    }

    this.attracted = function(target, mass){
        var force = p5.Vector.sub(target, this.pos);
        var D = force.magSq();
        var G = 8;
        var magnitude = (G * mass) / (D);
        force.setMag(magnitude);
        acc = force; 
    }
}
