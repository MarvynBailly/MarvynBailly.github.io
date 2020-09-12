function Food(){
  this.pos = createVector(random(0,wid),random(0,hit));
  this.size = 10;
  this.gate = false;
  this.hit = false;
  this.lifeStatus = true;
}

Food.prototype.getPos = function(){
  return this.pos;
}

Food.prototype.show = function(){
  stroke(0);
  strokeWeight(1);
  fill(0,255,0);
  circle(this.pos.x,this.pos.y,this.size);
}

Food.prototype.check = function(r,p){  
  for (var i = 0; i < r.length; i++) {
    var other = r[i];
    var distance = p5.Vector.dist(this.pos, other.pos);
    if(distance <= this.size){
      this.hit = true;
    }else{
      this.hit = false;
    }
    if(this.gate == false){
      if(this.hit == true){
        this.lifeStatus = false;
        other.score ++;
        this.gate = true;
      } 
    }
    if(this.hit == false){
      this.gate = false;
    }
  }
}