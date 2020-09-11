let size = 160;
let font;
var points = [];
var particles = [];
var location = 0;
var amountParticles = 0;

let text1 = "404"

let x1 = 100;
let y1 = 160;
let x2 = 100;
let y2 = 300;
let x3 = 100;
let y3 = 440;

function preload(){
  font = loadFont('HELVETICALTSTD-BLK.OTF');
}


function setup() {
  var win = windowWidth;
  var hit = windowHeight;
  createCanvas(win, hit);

  append(points, font.textToPoints(text1,x1,y1,size));
  append(points,font.textToPoints(text2,x2,y2,size));
  append(points, font.textToPoints(text3,x3,y3,size));
  //console.log(points);
  
}

function createTarget(s){
  return points[s];
}

function findDifference(a,t){
  return (t-a);
}

function splitApart(d){
  for(var i = 0; i < d; i++){
    if (particles.length == 0){
      let particle = new Particle(random(wid),random(hit));
      particles.push(particle);
    } else{ 
      let point = particles[random(particles.length)];
      let particle = new Particle(point.pos.x,point.pos.y);
      particles.push(particle);
    }
  }
}

function merge(d){
  for(var i = 0; i < d; i++){
    var particle = particles[i];
    var randomParticle = particles[random(i+1,particles.length)];
    particle.findTarget(randomParticle);
    while (particle.pos != particle.target){
      particle.behaviors();
      particle.update();
      particle.show();
    }
    particles.splice(0,1);
  }
}

function mouseClicked(){
  var target = createTarget(location);
  var difference = findDifference(amountParticles, target);
  
  if (difference > 0){
    splitApart(difference);
  } else if (difference == 0){
    return;
  } else {
    merge(abs(difference));
  }
  
  
  location += 1;
  location = location % 3;
}

function draw() {
  background(0);
  //background(230);
  for(var i = 0; i < particles.length; i++){
    var particle = particles[i];
    particle.behaviors();
    particle.update();
    particle.show();
  }
}

function Particle(x,y){
  //this.pos = createVector(random(windowWidth),random(windowHeight));
  this.pos = createVector(x,y);
  this.vel = createVector(random(-5,5),random(-5,5));
  this.acc = createVector();
  this.size = 7;
  this.maxSpeed = 5;
  this.maxForce = 0.3;
}

Particle.prototype.findTarget = function(x,y){
  this.target = createVector(x,y);
}

Particle.prototype.behaviors = function(){
  var arrive = this.arrive(this.target);
  var mouse = createVector(mouseX, mouseY);
  var flee = this.flee(mouse);
  
  arrive.mult(0.3);
  flee.mult(20);
  
  this.acc.add(arrive);
  this.acc.add(flee);
  
}

Particle.prototype.reset = function(){
  this.acc.add(p5.Vector.random2D());
  this.acc.mult(2);
}

Particle.prototype.arrive = function(t){
  var dir = p5.Vector.sub(t,this.pos);
  var d = dir.mag();
  var speed = this.maxSpeed;
  if (d < 100){
    speed = map(d, 0, 100, 0, this.maxSpeed);
  }
  dir.setMag(speed);
  var steer = p5.Vector.sub(dir,this.vel);
  steer.limit(this.maxForce);
  return steer;
}

Particle.prototype.flee = function(t){
  var dir = p5.Vector.sub(t,this.pos);
  var d = dir.mag();
  if(d < 50){
    var speed = abs(winMouseX - pwinMouseX);
    var mapSpeed = map(speed, 0, 50, this.maxSpeed/2, this.maxSpeed);
    dir.setMag(mapSpeed);
    //dir.setMag(this.maxSpeed);
    dir.mult(-1);
    var steer = p5.Vector.sub(dir,this.vel);
    steer.limit(this.maxForce);
    return steer;
  }else{
    return createVector(0,0);
  }
}

Particle.prototype.update = function(){
  this.pos.add(this.vel);
  this.vel.add(this.acc);
  this.acc.mult(0);
}

Particle.prototype.show = function(){
  var col = map(this.vel.mag(),0,4,255,0);
  stroke(255,255,col);
  strokeWeight(this.size);
  point(this.pos.x,this.pos.y); 
  
}