class Particle{
  constructor(x,y,vx,vy){
    this.pos = createVector(x,y);
    this.prevPos = this.pos;
    this.vel = createVector(vx,vy);
    this.size = 2;
    this.time = 0;
    this.alive = true;
    this.max = maxLife + random(0,50);
  }

  update(){
    let nv = this.getNoise();
    let v = this.vel.add(nv);
    //let mv = v.mult(mag);
    this.pos.add(v);
    //this.vel.mult(0.99);

    this.time ++;
  }

  getNoise(){
    let x = noise(this.pos.x,this.pos.y,random(1));
    let y = noise(this.pos.x,this.pos.y,random(1));
    let mx = map(x,0,1,-this.vel.x,this.vel.x);
    let my = map(y,0,1,-this.vel.y,this.vel.y);
    let nv = createVector(mx,my);
    return(nv);
  }

  check(){
    if(this.time > this.max){
      this.alive = false;
    }
  }

  display(){
    stroke(0,0,0,20);
    strokeWeight(this.size);
    line(this.pos.x,this.pos.y,this.prevPos.x,this.prevPos.y);
    this.prevPos = this.pos;
    
    //circle(this.pos.x,this.pos.y,this.size);
  }
}