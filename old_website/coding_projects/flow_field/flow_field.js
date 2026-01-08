function FlowField(){
  this.res = 10;
  this.flowField = [];
  
  this.cols = wid+20/this.res;
  this.rows = hit+20/this.res;
  
  var xoff = 0;
  for(i=0;i<this.cols;i++){
    var yoff = 0;
    this.flowField[i] = [];
    for(j=0;j<this.rows;j++){
      var theta = map(noise(xoff,yoff),0,1,0,TWO_PI);
      this.flowField[i][j] = createVector(cos(theta),sin(theta));
    
      yoff += 0.1; 
    }
    xoff += 0.1;
  }
}

FlowField.prototype.lookup = function(location){
  var col = round(constrain(location.x/this.res,0,this.cols+1));
  var row = round(constrain(location.y/this.res,0,this.rows+1));
  return this.flowField[col][row];
}
