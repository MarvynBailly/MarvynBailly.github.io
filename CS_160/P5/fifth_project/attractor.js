function Attractor(x, y) {
    this.pos = createVector(x,y);
    
    this.show  = function(){
        stroke(255,0,255);
        strokeWeight(4);
        point(this.pos.x, this.pos.y);
    }
}