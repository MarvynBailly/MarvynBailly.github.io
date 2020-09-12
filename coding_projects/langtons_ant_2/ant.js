function Ant(x,y,color){
  this.position = createVector(x,y);
  this.direction = 0;
  this.cl = color;
}

Ant.prototype.findColor = function(grid){
  var color;
  
  if(grid[this.position.x][this.position.y] == 40){
    if(this.direction == 3){
      this.direction = 0;
    } else{
      this.direction++;
    }
    color = this.cl;
  } else{
    if(this.direction == 0){
      this.direction = 3;
    }else{
      this.direction--;
    }
    color = 40;
  }
  return color;
}

Ant.prototype.move = function(cols,rows){
  if(this.direction == 0){
    this.position.x ++;
    if(this.position.x == rows){
      this.position.x = 1;
    }
  }
  if(this.direction == 1){
    this.position.y --;
    if(this.position.y == 0){
      this.position.y = cols-1;
    }
  }
  if(this.direction == 2){
    this.position.x --;
    if(this.position.x == 0){
      this.position.x = rows-1;
    }
  }
  if(this.direction == 3){
    this.position.y ++;
    if(this.position.y == cols){
      this.position.y = 1;
    }
  }

}