//--------TO DO-------\\
//noise for minigun and multishot
//different enemies (higher health)
//sprites (items,player,enemies,attacks)
//background (noise generated, stars and planets or surface of planet)
//item:self destruct
//canvas resizing
//mobile support
//--------------------\\


//Check if given position is off the border
function borderCheck(pos){
  if(pos.x >= 0 && pos.x <= width && pos.y >= 0 && pos.y <= height){
    return true;
  }else{
    return false;
  }
}

//check if mobile device
function checkMobileDevice(){
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    return true
  }
}

//defintions 
let ship;
let bullets = [];
let enemies = [];
let bosses = [];
let items = [];

let spawnEnemyRate = 0.01; 
let enemyCap = 150;
let spawnItemRate = 0.4;
let score = 0;
let time = 0;
const speed = 1;

let singlePew;
let multiPew;

let bossGate = false;
let bossAlive = false; 

let gamePaused = true;
let upgradeMenuGate = false;
let mainMenu = true; 
let mainMenuImage;

let speedUpgrade,bulletSpeedUpgrade,healthUp,restart,startGame,backToMainMenu,activeSpeed,freezeActive;
let freezeTimer = 0;

//fire data base
let bulletMaxSpeed = 10;
let bulletCooldown = 50; 

var database,ref;
let usernameInit,submitButton;

//mobile
let isMobileDevice;
let controlpadW = 50;
let controlpadH = 75;
let controlpadSpace = 25;
let controlpadX;
let controlpadY;

//music 
let tracks = [];
let currentTrack;

//load sound
function preload(){
  singlePew = loadSound('./Sounds/single_shot.mp3');
  multiPew = loadSound('./Sounds/multiple_shot.mp3');
  mainMenuImage = loadImage("./Sprites/art.png");
  
  //load in music
  let m = loadSound('./music/track1.mp3');
  append(tracks,m);
  m = loadSound('./music/track2.mp3');
  append(tracks,m);
    m = loadSound('./music/track3.mp3');
  append(tracks,m);
    m = loadSound('./music/track4.mp3');
  append(tracks,m);
    m = loadSound('./music/track5.mp3');
  append(tracks,m);
    m = loadSound('./music/track6.mp3');
  append(tracks,m);
    m = loadSound('./music/track7.mp3');
  append(tracks,m);
}

//return random song
function  getRandomSong(){
  return tracks[Math.floor(Math.random()*tracks.length)];
}

//once song has ended, play a new random song
function playMusic(){
  if(currentTrack == null){
    currentTrack = getRandomSong();
    
  }
  if(!currentTrack.isPlaying()){
    currentTrack = getRandomSong();
    currentTrack.play();
  }
}

function stopMusic(){
  currentTrack.stop();
}

function setup() {
  createCanvas(windowWidth,windowHeight);
  ship = new player(width/2,height-100);
  items.push(new Item());
  
  //check device
  
  if(checkMobileDevice()){
    isMobileDevice = true;  
  }else{
    isMobileDevice = false;
  }
  controlpadX = (5*width)/6;
  controlpadY = (3*height)/4;
  
  
  //set up fire data base
  databaseInit();
  
  
  //Username and Submit buttons
  initUsername = createInput("Enter Name");
  initUsername.position(width/2-100,height/2+50);
  initUsername.hide();
  submitButton = createButton("Submit");
  submitButton.position(width/2+75,height/2+50);
  submitButton.mousePressed(submitScore);
  submitButton.hide();
  
  //upgrade buttons
  speedUpgrade = createButton('Upgrade Speed');
  speedUpgrade.position(width/2-100, height/2-100);
  speedUpgrade.mousePressed(applySpeedUpgrade);
  speedUpgrade.hide();
  
  bulletSpeedUpgrade = createButton('Upgrade Bullet Speed');
  bulletSpeedUpgrade.position(width/2-100, height/2);
  bulletSpeedUpgrade.mousePressed(applyBulletUpgrade);
  bulletSpeedUpgrade.hide();
  
  healthUp = createButton('+1 Health');
  healthUp.position(width/2-100, height/2+100);
  healthUp.mousePressed(applyHealthUpgrade);
  healthUp.hide();
  
  //menu buttons
  startGame = createButton('Play Game');
  startGame.position(100, height-100);
  startGame.mousePressed(closeMenu);
  startGame.hide();
  
  //end game 
  restart = createButton('Play Again');
  restart.position(width/2-110,height/2+150);
  restart.mousePressed(restartGame);
  restart.hide();
  
  backToMainMenu = createButton('Back to Main Menu');
  backToMainMenu.position(width/2+10,height/2+150);
  backToMainMenu.mousePressed(startMainMenu);
  backToMainMenu.hide();
}

//call to play pew noise
function playPew(s){
  //if(!s.isPlaying()){
    s.play();
  //}
}



//player movement
function getMovements(){
  let movement = createVector();
  if(!isMobileDevice){
    if(keyIsDown(65)){
      //A
      movement.x = -speed;
    }
    if(keyIsDown(68)){
      //D
      movement.x = speed;
    }
    if(keyIsDown(87)){
      //W
      movement.y = -speed;
    }
    if(keyIsDown(83)){
      //S
      movement.y = speed;
    }
  }else{
    //for now adding everything to this spot
    //lower
    stroke(255,0,0);
    fill(230,90)
  rect(controlpadX-controlpadW/2,controlpadY+controlpadSpace,controlpadW,controlpadH);
  
  //right
  rect(controlpadX+controlpadSpace,controlpadY-controlpadW/2,controlpadH,controlpadW);
  
  //upper
  rect(controlpadX-controlpadW/2,controlpadY-controlpadH-controlpadSpace,controlpadW,controlpadH);
  
  //left
  rect(controlpadX-controlpadH-controlpadSpace,controlpadY-controlpadW/2,controlpadH,controlpadW);
  
  //check if mouse is in lower 
  if(mouseX >= controlpadX-controlpadW/2 && mouseX <= controlpadX+controlpadW/2 && mouseY >= controlpadY + controlpadSpace && mouseY <= controlpadY + controlpadSpace + controlpadH && mouseIsPressed){
    movement.y = speed;
  }
  //check if mouse is in upper 
  if(mouseX >= controlpadX-controlpadW/2 && mouseX <= controlpadX+controlpadW/2 && mouseY >=controlpadY-controlpadH-controlpadSpace && mouseY <=controlpadY-controlpadSpace && mouseIsPressed){
    movement.y = -speed;
  }
  //check if mouse is in right
  if(mouseX >= controlpadX+controlpadSpace && mouseX <= controlpadX + controlpadSpace + controlpadH&& mouseY >= controlpadY-controlpadW/2 && mouseY <= controlpadY+controlpadW/2 && mouseIsPressed){
    movement.x = speed;
  }
  //check if mouse is in left
  if(mouseX >= controlpadX-controlpadSpace-controlpadH && mouseX <= controlpadX - controlpadSpace&& mouseY >= controlpadY-controlpadW/2 && mouseY <= controlpadY+controlpadW/2 && mouseIsPressed){
    movement.x = -speed;
  }
    
  }
  ship.move(movement);
}

//shooting
function shoot(){
  if(ship.alive && frameCount % bulletCooldown == 0){
    playPew(singlePew);

    bullets.push(new Bullet(ship.pos.x,ship.pos.y,ship.heading));

    //add more bullets for multishot
    if(ship.multishot){
      playPew(singlePew);
      playPew(singlePew);

      bullets.push(new Bullet(ship.pos.x,ship.pos.y,ship.heading+0.5));
      bullets.push(new Bullet(ship.pos.x,ship.pos.y,ship.heading-0.5));
    }
  }
}

//Spawn boss when player reaches certain score
function spawnBoss(){
  let ran = random(1);
  let x,y;
  let furthestSpawn = 30;

  if(ran <=1/4){
    //top
    x = random(width);
    y = random(-furthestSpawn,0);
  }else if(ran <=2/4){
    //bottom
    x = random(width);
    y = random(height,height+furthestSpawn);
  }else if(ran <=3/4){
    //left
    x = random(-furthestSpawn,0);
    y = random(height);
  }else if(ran <=4/4){
    //right
    x = random(width,width+furthestSpawn);
    y = random(height);
  }
  bosses.push(new Enemy(x,y,"boss"));
}

//spawn enemies. Ramps up with frames
function spawnEnemy(){
  if(frameCount % 500 == 0 && bossAlive == false){
    spawnEnemyRate += 0.01;
    //console.log('spawn rate increased: ',spawnRate);
  }
  
  if(enemies.length <= enemyCap){
    if(random(1) < spawnEnemyRate){
      let ran = random(1);
      let x,y;
      let furthestSpawn = 30;

      if(ran <=1/4){
        //top
        x = random(width);
        y = random(-furthestSpawn,0);
      }else if(ran <=2/4){
        //bottom
        x = random(width);
        y = random(height,height+furthestSpawn);
      }else if(ran <=3/4){
        //left
        x = random(-furthestSpawn,0);
        y = random(height);
      }else if(ran <=4/4){
        //right
        x = random(width,width+furthestSpawn);
        y = random(height);
      }
      enemies.push(new Enemy(x,y,"basic"))
    }
  }
}

//spawn items
function spawnItem(){
  if(frameCount % 500 == 0){
    spawnItemRate += 0.05;
  }
  if(items.length <= 3){
    if(frameCount % 250 == 0){
      if(random(1) < spawnItemRate){
        items.push(new Item());
      } 
    } 
  } 
} 

//------Main Menu-------\\

//start main menu
function startMainMenu(){
  mainMenu = true;
  gamePaused = true;
  restart.hide();
  backToMainMenu.hide();
  initUsername.hide();
  submitButton.hide();
  loop();
}

//display main menu
function displayMainMenu(){
  mainMenuImage.resize(width,height);
  image(mainMenuImage,0,0);
  startGame.show(); //turn play game on
}

//close the main menu
function closeMenu(){
  startGame.hide();
  mainMenu = false;
  gamePaused = false;
  backToMainMenu.hide();
  restartGame();
}

//------Play Game Loop-------\\
function playGame(){
    //background(0);
    
    //Check to spawn boss
    if(score > 1 && score % 150 == 0 && bossAlive == false){
      bossGate = true; 
    }
    
    //update freeze timer
    if(freezeActive){
          freezeTimer++;
    } 
        
  
    //Spawn boss
    if(bossGate){
      spawnBoss();
      bossGate = false;
      bossAlive = true; 
    }
    
    //Check if boss is still alive
    if(bosses.length == 0){
      bossAlive = false;
    }
    
    //Don't spawn enemies if boss is alive
    if(!bossAlive){
      spawnEnemy();
    }
    
    spawnItem();
    getMovements();
    shoot();  
  
    //minigun
    if(ship.minigun){
      bullets.push(new Bullet(ship.pos.x,ship.pos.y,ship.heading+random(-0.1,0.1)));
      playPew(singlePew);
      //multishot
      if(ship.multishot){
        bullets.push(new Bullet(ship.pos.x,ship.pos.y,ship.heading+0.5+random(-0.1,0.1)));
        bullets.push(new Bullet(ship.pos.x,ship.pos.y,ship.heading-0.5+random(-0.1,0.1)));
      }
      
      //knockback
      let oppDir = p5.Vector.fromAngle(ship.heading+PI);
      oppDir.normalize();
      
      if(ship.multishot){
        oppDir.mult(0.75);
      }else{
        oppDir.mult(0.25);
      }
      ship.move(oppDir);
    }
    
    //----Items----\\
    for(let i = items.length - 1; i >= 0; i--){
      let item = items[i];
      item.show();
      
      //item goes away and does action
      if(!item.alive){
        item.action(ship);
        items.splice(i,1);
      }
    }
    
    //----Bullets----\\
    for(let i = bullets.length - 1; i >= 0; i--){
      let bullet = bullets[i];
      
      bullet.update();
      bullet.show();
      
      //check for enemy-bullet collusion
      for(let enemy of enemies){
        if(bullet.collision(enemy)){
          bullets.splice(i,1);
          enemy.hit();
          ship.levelUp('enemy');
        }
      }
      
      for(let boss of bosses){
        if(bullet.collision(boss)){
          bullets.splice(i,1);
          boss.hit();
          ship.levelUp('boss');          
        }
      }
      
      //remove bullet
      if(!bullet.alive){
        bullets.splice(i,1);
      }
    }

    //----Ship----\\
    if(ship.health <= 0){
      ship.alive = false;
    }

    ship.update();
    ship.show();
    
    //colide with enemy
    for(let enemy of enemies){
      if(!ship.invincible){
        if(ship.collision(enemy)){
          enemy.alive = false;
          score++;
          if(ship.shield){
            ship.shield = false;
          }else{
            ship.health --;
          }
        }
      }
    }
    
    //collide with boss 
    for(let boss of bosses){
      if(!ship.invincible){
        if(ship.collision(boss)){
          boss.alive = false;
          score++;
          if(ship.shield){
            ship.shield = false;
          }else{
            ship.health -= boss.health;
          }
        }
      }
    }
    
    //collide with item
    for(let item of items){
      if(ship.collision(item)){
        item.alive = false;
      }
    }
    
    //----Boss----\\
    for(let i = bosses.length - 1; i >=0; i--){
      let boss = bosses[i];
      if(boss.alive){
        boss.arrive(ship.pos);
        boss.update();
        boss.display();
      }else{
        bosses.splice(i,1);  
      }
    }
    
    //----Enemy----\\
    for(let i = enemies.length - 1; i >=0; i--){
      let enemy = enemies[i];
      if(enemy.alive){
        //only if freeze is unactive
        if(freezeTimer > 200){
          freezeTimer = 0;
          freezeActive = false;
        }
        
        if(!freezeActive){
          enemy.arrive(ship.pos);
          enemy.update();
        }
        
        enemy.display();
      }else{
        enemies.splice(i,1);  
      }
    }
  
    
    //----Text----\\\
    textSize(15);
    stroke(255);
    fill(0);
    text("Score: "+score,10, 20);
    text("Health: "+ship.health,10,40);
    text("Level: "+ship.level,10,60)
}

function endGame(){
  //stopMusic();
  noLoop();
  fill(255,255,255,90);
  rect(20,20,width-40,height-40,50);
  textSize(50);
  stroke(255,0,0);
  fill(255,0,0);
  text("Get Good",width/2-110,height/2-100);
  restart.show();
  backToMainMenu.show();
  initUsername.show();
  submitButton.show();
  showData();
}

function restartGame(){
  ship = new player(width/2,height-100);
  bullets = [];
  enemies = [];
  bosses = [];
  items = [];
  items.push(new Item());
  spawnEnemyRate = 0.01; 
  enemyCap = 150;
  spawnItemRate = 0.4;
  score = 0;
  time = 0;
  bossGate = false;
  bossAlive = false; 
  bulletMaxSpeed = 10;
  bulletCooldown = 50;
  restart.hide();
  backToMainMenu.hide();
  initUsername.hide();
  submitButton.hide();
  loop();
}



//-------Upgrade Menu---------\\

//open menu
function upgradeMenu(){
  noLoop();
  fill(255,255,255,40);
  rect(20,20,width-40,height-40,50);
  
  stroke(255);
  fill(255);
  textSize(20);
  text("Pick an Upgrade",width/2-100,100);
  
  healthUp.show();
  bulletSpeedUpgrade.show();
  speedUpgrade.show();
  
  
}


//action for buttons
function applyHealthUpgrade(){
  ship.health ++;
  upgradeMenuOff();
}

function applySpeedUpgrade(){
  ship.maxSpeed ++;
  upgradeMenuOff();
}

function applyBulletUpgrade(){
  if(bulletCooldown != 1){
    bulletCooldown --;
  }
  upgradeMenuOff();
}

//Close menu 
function upgradeMenuOff(){
  gamePaused = false;
  upgradeMenuGate = false;
  healthUp.hide();
  bulletSpeedUpgrade.hide();
  speedUpgrade.hide();
  ship.invincibilityFrames();
  loop();
}

function draw() {
  noStroke();
  fill(0,50);
  rect(0,0,width,height);
  
  
  playMusic();
  if(mainMenu){
     displayMainMenu();
  }else if(ship.alive && !gamePaused){
    playGame();
    
  }else if(ship.alive && upgradeMenuGate){
    upgradeMenu();
    
  }else if(!ship.alive){
    endGame();
  }
  
  
  //fps 
  textSize(15);
  stroke(255);
  fill(0);
  let fps = frameRate().toFixed(2);
  text("FPS: "+fps,width-90,20);
}
