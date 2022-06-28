class Agent{
  PVector position;
  float angle;
  
  Agent(float x,float y,float a){
    position = new PVector(x,y);
    angle = a;
  }
  
  int update(){
    PVector dir = new PVector(cos(angle),sin(angle));
    PVector newPos = position.copy().add(dir).mult(moveSpeed).mult(dt);
    
    //edge case
    if(newPos.x < 0 || newPos.x >= width || newPos.y < 0 || newPos.y >= height){
      newPos.x = min(width-0.01, max(0, newPos.x));
      newPos.y = min(height-0.01, max(0, newPos.y));
      angle = random(0,1) * 2 * PI;
    }
    
    position = newPos;
    return getIndex(position);
  }
}
