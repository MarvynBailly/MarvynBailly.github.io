function Dna(team){
  this.team = team;
  this.fitness = 0;
}

Dna.prototype.generate = function(){
  this.seperateMult = round(random(1,3),2); //2
  
  //align
  this.alignRange = round(random(10,150),2); //50
  this.alignMult = round(random(0.1,2),2); //1
    
  //cohesion
  this.cohesionRange = round(random(1,20),2); //10
  this.cohesionMult = round(random(0.1,2),2); //1  
    
  this.runRange = 0; //240
  this.runMult = 0; //2
  
  this.foodRange = 0; //200
  this.foodMult = 0; //1.2

  this.chaseRange = 0;
  this.chaseMult = 0;
  
  if(this.team == 0){
    //speed;
    this.speed = round(random(4,7),2);
  
    //run
    this.runRange = round(random(100,300),2); //240
    this.runMult = round(random(0.1,3),2); //2
  
    //seperate
    this.seperateRange = round(random(10,30),2); //24
  
    //food
    this.foodRange = round(random(100,300),2); //200
    this.foodMult = round(random(0.1,3),2); //1.2
    
  }  
    
  if(this.team == 1){
    //speed;
    this.speed = round(random(4,6),2);
    
    //chase
    this.chaseRange = round(random(200,500),2); //300
    this.chaseMult = round(random(1.5,2),2); //1.6
    
    //seperate
    this.seperateRange = round(random(20,50),2); //36
  }
}

Dna.prototype.copy = function(others){
  let chance = 10;
  let mutation = round(random(1,10),1);
  if(chance == 1){
    this.seperateMult = round(random(1,3),2);
  }else{
    let other = others[round(random(others.length-1))];
    this.seperateMult = other.seperateMult; //2
  }
  
  mutation = round(random(1,10),1);
  if(chance == 1){
    this.seperateRange = round(random(10,40),2);
  }else{
    let other = others[round(random(others.length-1))];
    this.seperateRange = other.seprateRange;
  }
  
  mutation = round(random(1,10),1);
  if(chance == 1){
    this.alignRange = round(random(30,80),2);
  }else{
    let other = others[round(random(others.length-1))];
    this.alignRange = other.alignRange; //50
  }
  mutation = round(random(1,10),1);
  if(chance == 1){
    this.alignMult = round(random(0.1,3),2);  
  }else{
    let other = others[round(random(others.length-1))];
    this.alignMult = other.alignMult; //1
  }
  
  mutation = round(random(1,10),1);
  if(chance == 1){
    this.cohesionRange = round(random(5,25),2);
  }else{
    let other = others[round(random(others.length-1))];
    this.cohesionRange = other.cohesionRange; //10
  }
  
  mutation = round(random(1,10),1);
  if(chance == 1){
    this.cohesionRange = round(random(5,25),2);
  }else{
    let other = others[round(random(others.length-1))];
    this.cohesionMult = other.cohesionMult;
  }
  
  mutation = round(random(1,10),1);  
  if(chance == 1){
    this.runRange = round(random(200,300),2);
  }else{
    let other = others[round(random(others.length-1))];
    this.runRange = other.runRange; //240
  }
  
  mutation = round(random(1,10),1);
  if(chance == 1){
    this.runMult = round(random(1.5,2.5),2);
  }else{
    let other = others[round(random(others.length-1))];
    this.runMult = other.runMult; //2
  }
  
  mutation = round(random(1,10),1);
  if(chance == 1){
    this.foodRange = round(random(150,250),2);
  }else{
    let other = others[round(random(others.length-1))];
    this.foodRange = other.foodRange; //200
  }
  
  mutation = round(random(1,10),1);
  if(chance == 1){
    this.foodMult = round(random(1,2),2);
  }else{
    let other = others[round(random(others.length-1))];
    this.foodMult = other.foodMult; //1.2
  }
  
  mutation = round(random(1,10),1);
  if(chance == 1){
    this.chaseRange = round(random(250,350),2);
  }else{
    let other = others[round(random(others.length-1))];
    this.chaseRange = other.chaseRange;
  }
  
  mutation = round(random(1,10),1);
  if(chance == 1){
    this.chaseMult = round(random(1.5,2.5),2);
  }else{
    let other = others[round(random(others.length-1))];
    this.chaseMult = other.chaseMult;
  }
  
  mutation = round(random(1,10),1);
  if(chance == 1){
    this.speed = round(random(4,8),2);
  }else{
    let other = others[round(random(others.length-1))];
    this.speed = other.speed;
  }
}

Dna.prototype.fit = function(lifeTime,score){
  this.fitness = lifeTime*0.25 + score*0.75;
}