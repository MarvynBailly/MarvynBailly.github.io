let size = 160;
let font;
var points = [];
var particles = [];

let text2 = '404';
let text3 = 'Error';

let x2 = 100;
let y2 = 300;
let x3 = 100;
let y3 = 440;

function preload(){
  font = loadFont('https://marvyn.com/imports/fonts/Helvetica.ttf');
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}

function setup() {
  var canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0,0);
  canvas.style('z-index', -1);
  canvas.style('position','fixed');
  
  append(points,font.textToPoints(text2,x2,y2,size));
  append(points, font.textToPoints(text3,x3,y3,size));

  for (var i = 0; i < points.length; i++){
    for (var j = 0; j < points[i].length; j++){
      var pts = points[i][j];
      var particle = new Particle(pts.x,pts.y);
      particles.push(particle);
    }
  }
}

function mouseClicked(event){
 // if(event.botton === 2){
    for(var i = 0; i<particles.length; i++){
      var particle = particles[i];
      particle.reset();
      particle.reset();
   // }
 }
}

function draw() {
  //background(0);
  background(255);
  
  for(var i = 0; i < particles.length; i++){
    var particle = particles[i];
    particle.behaviors();
    particle.update();
    particle.show();
  }
}

function Particle(x,y){
  this.pos = createVector(random(windowWidth),random(windowHeight));
  //this.pos = createVector(x,y);
  this.vel = createVector(random(-5,5),random(-5,5));
  this.acc = createVector();
  this.target = createVector(x,y);
  this.size = 7;
  this.maxSpeed = 5;
  this.maxForce = 0.3;
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
  var colR = map(this.vel.mag(),0,4,0,255);
  var colG = map(this.vel.mag(),0,4,0,165);
  stroke(colR,0,0);
  strokeWeight(this.size);
  point(this.pos.x,this.pos.y); 
  
}