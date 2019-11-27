var mass;

function Attractor(x, y) {
    this.pos = createVector(x,y);
    mass = random(1,80)
  
    this.show  = function(){
        stroke(255);
        strokeWeight(mass);
        point(this.pos.x, this.pos.y);
    }

    this.get_mass = function(){
        return mass
    } 

    this.get_cords = function(){
        cords = createVector(this.pos.x, this.pos.y);
        return cords 
    }
}