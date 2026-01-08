function Dna(team){
  this.team = team;
  
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
  
  if(team == 0){
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
    
  if(team == 1){
    //speed;
    this.speed = round(random(4,6),2);
    
    //chase
    this.chaseRange = round(random(200,500),2); //300
    this.chaseMult = round(random(0.1,3),2); //1.6
    
    //seperate
    this.seperateRange = round(random(20,50),2); //36
  }
}

Dna.prototype.fitness = function(){
  
}

Dna.prototype.mutation = function(){

}