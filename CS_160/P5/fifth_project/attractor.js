var mass;

function Attractor(x, y) {
    //mass.unshift(random(25,80));
    mass = random(25,80)
    this.pos = circle(x, y, mass);

    this.show  = function(){
        stroke(255,0,0);
        strokeWeight(4);
    }

    this.get_mass = function(){
        return mass
    } 

    this.get_cords = function(){
        cords = createVector(this.pos.x, this.pos.y);
        return cords 
    }
}