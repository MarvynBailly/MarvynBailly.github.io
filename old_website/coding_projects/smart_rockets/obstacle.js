function Obstacle(rx,ry){
  this.rx = rx;
  this.ry = ry;
  this.rw = 200;
  this.rh = 15;
}

Obstacle.prototype.draw = function(){
  fill(0);
  rect(this.rx,this.ry,this.rw,this.rh);
  
}