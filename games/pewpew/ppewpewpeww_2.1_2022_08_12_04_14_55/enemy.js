class Enemy{
  constructor(x,y,type) {
    this.acceleration = createVector(0, 0);
    this.velocity = createVector(0, 0);
    this.pos = createVector(x,y);
    this.alive = true;
    if(type == "basic"){
      this.size = 10;
      this.maxspeed = random(4,10);
      this.maxforce = 0.1;
      this.health = 1;
    }else if(type == "boss"){
      this.size = 50;
      this.maxspeed = random(2,5);
      this.maxforce = 0.1;
      this.health = 5;
    }
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxspeed);
    this.pos.add(this.velocity);
    this.acceleration.mult(0);
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  arrive(target) {
    //vision range 
    //let d = dist(target.x,target.y,this.pos.x,this.pos.y);
    
    //if(d < 100){
      let desired = p5.Vector.sub(target, this.pos);
      desired.mag();
      desired.setMag(this.maxspeed);

      let steer = p5.Vector.sub(desired, this.velocity);
      steer.limit(this.maxforce);
      this.applyForce(steer);
    //}
  }

  hit(){
    this.health --;
    if(this.health == 0){
      this.alive = false; 
      score++; 
    }
  }
  
  display() {
    let theta = this.velocity.heading() + PI / 2;
    fill(255,255,0);
    stroke(255,0,0);
    strokeWeight(1);
    push();
    translate(this.pos.x, this.pos.y);
    rotate(theta);
    circle(0,0,this.size);
    pop();
    // beginShape();
    // vertex(0, -this.r * 2);
    // vertex(-this.r, this.r * 2);
    // vertex(this.r, this.r * 2);
    // endShape(CLOSE);
    // pop();
  }
}