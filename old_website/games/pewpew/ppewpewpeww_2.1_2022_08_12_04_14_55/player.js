class player{
  
  constructor(x,y){
    this.pos = createVector(x,y);
    this.vel = createVector(0,0);
    this.heading = 0;
    this.angle = 0;
    this.maxSpeed = 5;
    this.size = 15;
    this.health = 3;
    this.alive = true;
    
    this.shield = false;
    this.minigun = false;
    this.minigunTimer = 0;
    
    this.multishot = false;
    this.multishotTimer = 0;
    
    this.level = 1;
    this.levelMax = 10;
    this.levelProgess = 0;
    
    //invincibility frames
    this.invincible = false; 
    this.invinciblityTimer = 0;
    this.invinciblityLimit = 150;
  }
  
  invincibilityFrames(){
    this.invincible = true;
    this.invinciblityTimer = 0;
  }
  
  levelUp(type){
    if(type == 'enemy'){
      this.levelProgess++;
    }else if(type == 'boss'){
      let levelIncrease = this.levelProgress - this.levelMax;
      this.levelProgress += this.levelInreasae;
    }
    
    if(this.levelMax == this.levelProgess){
      this.level ++;
      this.levelProgess = 0; 
      this.levelMax = 10 + 2 * this.level;
      gamePaused = true;
      upgradeMenuGate = true;
    }
  }
  
  collision(target){
    if(this.pos.x <= target.pos.x + target.size && this.pos.x >= target.pos.x - target.size && this.pos.y <= target.pos.y + target.size && this.pos.y >= target.pos.y - target.size){
      return true;
    }else{
      return false;
    }
  }
  
  move(force){
    this.vel.add(force);
  }
  
  update(){
    //move
    this.vel.limit(this.maxSpeed);
    
    let futurePos = this.pos.copy();
    
    if(borderCheck(futurePos.add(this.vel))){
      this.pos.add(this.vel);
    }
    
    this.vel.mult(0.95);
    //heading
    if(!isMobileDevice){
      this.angle = Math.atan2(mouseY-this.pos.y, mouseX-this.pos.x);
    }else{
      let joystickX = 100;
      let joystickY = 400;
      let size = 150;
    
      //draw joystick
      stroke(0);
      fill(200);
      circle(joystickX,joystickY,size);

      //detect if mouse is within circle using euclidian distance
      if(dist(mouseX,mouseY,joystickX,joystickY) < size/2 && mouseIsPressed){
        circle(mouseX,mouseY,size/12); //draw a circle on mouse position
        this.angle = Math.atan2(mouseY-joystickY, mouseX-joystickX); //get angle
      }
    }
    this.heading = this.angle;
    
    //minigun timer
    if(this.minigun){
      this.minigunTimer++;
    }
    if(this.minigunTimer > 250){
      this.minigun = false;
      this.minigunTimer = 0;
    }
    
    //multishot timer
    if(this.multishot){
      this.multishotTimer++;
    }
    if(this.multishotTimer > 500){
      this.multishot = false;
      this.multishotTimer = 0;
    }
    
    //Invinciblity timer
    if(this.invincible){
      if(this.invinciblityTimer <= this.invinciblityLimit){
        this.invinciblityTimer ++;
      }else{
        this.invincible = false;
      }
    }
  }
  
  show(){
    push();
    stroke(0,255,0);
    
    //Draw Invinciblility frames
    if(this.invincible){
      fill(0);
    }else{
      fill(230);
    }
    
    translate(this.pos.x,this.pos.y);
    rotate(this.heading + PI/2);
    triangle(this.size/2,0,-this.size/2,0,0,-this.size-5);
    
    //Draw Shield
    if(this.shield){
      stroke(0,191,255);
      fill(135,206,250,50);
      circle(0,-10,this.size*2);
    }
    
    //Draw Level Bar
    noStroke();
    fill(255);
    rect(-15,10,30,2)
    fill(0,0,255);
    let progress = map(this.levelProgess,0,this.levelMax,0,30);
    rect(-15,10,progress,2);
    
    
    pop();
  }
}