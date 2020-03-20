var fireworks = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function Firework(x,y){
  this.r = 255;
  this.g = 0;
  this.b = 0;
  this.pos = createVector(x,y);
  this.vel = createVector(0,random(-5,-10));//random(-10,-5)
  this.acc = createVector(0,0);
  this.timeMax = random(60);
  this.time = 0;
    
  
  this.show = function() {
    strokeWeight(5);
    
    if (this.time <= this.timeMax){
      stroke(this.r,this.g,this.b);
      point(this.pos.x,this.pos.y);
      if (this.time >= (this.timeMax/2)){
        this.vel.add(this.acc)
      }
      this.pos = this.pos.add(this.vel);
      this.time++;
      this.g += random(15);
    }//else{
      //for(i = 0; i < 10; i ++;)
    //}
  }
}

function mousePressed(){
  fireworks.push(new Firework(mouseX,mouseY));
}

function draw() {  
  background(0);
  for(i = 0; i < windowWidth; i +=random(10,20)){
    fireworks.push(new Firework(i,600));
  }
  for (var i = 0; i < fireworks.length; i++) {
      var firework = fireworks[i];
      firework.show();
    }
}