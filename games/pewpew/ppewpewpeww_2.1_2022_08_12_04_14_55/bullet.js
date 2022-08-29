class Bullet{
  constructor(x,y,ang){
    this.speed = bulletMaxSpeed;
    this.size = 5;
    this.alive = true;
    
    this.pos = createVector(x,y);
    this.vel = p5.Vector.fromAngle(ang);
    this.vel.mult(this.speed);
  }
  
  collision(target){
    if(this.pos.x <= target.pos.x + target.size && this.pos.x >= target.pos.x - target.size && this.pos.y <= target.pos.y + target.size && this.pos.y >= target.pos.y - target.size){
      return true;
    }else{
      return false;
    }
  }
  
  update(){
    let futurePos = this.pos.copy();
    
    if(borderCheck(futurePos.add(this.vel))){
      this.pos.add(this.vel);
    }else{
      this.alive = false; 
    }
  }
  
  show(){
    //maybe make this a line
    stroke(255);
    fill(255);
    circle(this.pos.x,this.pos.y,this.size);
  }
}