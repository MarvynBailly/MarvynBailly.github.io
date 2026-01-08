let possibleItems = [
  {Name:'Health Pack',Sprite: './Sprites/medpack2.png'},
  {Name:'Multishot',Sprite:"./Sprites/multi2.png"},
  {Name:'Nuke',Sprite:"./Sprites/nuke2.png"},
  {Name:'Shield',Sprite:"./Sprites/shield.png"},
  {Name:'Minigun',Sprite:"./Sprites/minigun2.png"},
  {Name:'Freeze',Sprite:"./Sprites/feeze2.jpg"}
];



class Item{
  constructor(){
    this.pos = createVector(random(width),random(height));
    this.type = random(possibleItems);
    this.size = 25; 
    this.alive = true; 
    this.texture = loadImage(this.type.Sprite);
    this.freezeTimer = 0;
  }
  
  action(player){
    if(this.type.Name == "Health Pack"){
      player.health++;
    }else if(this.type.Name == "Nuke"){
      let scoreIncrease = enemies.length;
      enemies = [];
      score += scoreIncrease;
      //level up the player
      for(let i = 0; i < scoreIncrease; i++){
        ship.levelUp('enemy');
      }
    }else if(this.type.Name == "Shield"){
      player.shield = true;
    }else if(this.type.Name == "Minigun"){
      player.minigun = true;
    }else if(this.type.Name == "Multishot"){
      player.multishot = true;
    }else if(this.type.Name == "Freeze"){
      freezeActive = true;
    }
  }
  
  show(){
    image(this.texture,this.pos.x,this.pos.y,this.size,this.size);
  }
}