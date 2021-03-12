let speed = 3;
let stars = [];
let population = 300;

function setup() {
    wid = windowWidth - 16.9;
    hit = windowHeight;
    canvas = createCanvas(wid, hit);
    canvas.position(0,0);
    canvas.style('z-index','-1');  
    canvas.style('position','fixed');
  
  for(let i = 0; i < population; i++){
    stars.push(new Star(1,1));
  }
}

function pause(){
    noLoop();
  }
  
function unpause(){
loop(); 
}

function windowResized(){
    wid = windowWidth - 16.9;
    hit = windowHeight;
    resizeCanvas(wid, hit)
}

function draw() {
  background(255);
  translate(width/2,height/2);
  for(let i = stars.length - 1; i >= 0; i--){
    stars[i].update();
    stars[i].show();
  }
}



class Star{
  constructor(){
    this.pos = createVector(random(-width,width),random(-height,height),random(width));
  }
  
  update(){
    this.pos.z -= speed;
    if (this.pos.z < 1) {
      this.pos.z = width;
      this.pos.x = random(-width, width);
      this.pos.y = random(-height, height);
    }
  }
  
  show(){
    let x = map(this.pos.x/this.pos.z,0,1,0,width);
    let y = map(this.pos.y/this.pos.z,0,1,0,height);
    let r = map(this.pos.z, 0, width, 16, 0);
    let alpha = map(this.pos.z,0,width,100,0);
    noStroke();
    fill(0,0,0,alpha);
    //circle(x,y,r);
    textSize(r);
    text("MATHY",x,y);
  }
}