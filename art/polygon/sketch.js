let particles = []; 
let population = 100;
let maxSize = 20;
let minSize = 5;
let zOff = 0;
let lock = false;
let lockP;
var fps = 60
let count = 0; 

function mousePressed(){
  for(let particle of particles){
    if(mouseX > particle.pos.x-particle.size && mouseX < particle.pos.x+particle.size && mouseY > particle.pos.y-particle.size && mouseY < particle.pos.y+particle.size){
      lock = true;
      lockP = particle;
    }
  }
}

function mouseDragged(){
  if(lock){
    lockP.pos.x = mouseX;
    lockP.pos.y = mouseY;
  }
}

function mouseReleased() {
  lock = false;
  lockP = null;
}

function setup() {
    var canvasDiv = document.getElementById('sketchholder');
    var width = canvasDiv.offsetWidth;
    var height = canvasDiv.offsetHeight;
    canvas = createCanvas(width, height);
    canvas.parent("sketchholder");

  for(let i = 0; i < population; i++){
    particles.push(new Particle());
  }
  frameRate(fps);
}

function draw() {
  background(0);
  
  zOff += 0.5;
  
  for(let i = particles.length - 1; i >= 0; i--){
    let particle = particles[i];
    let xOff = particle.pos.x/width;
    let xNoise = noise(xOff,zOff);
    particle.applyForce(createVector(xNoise,0));
    particle.findBuddies();
    particle.update();
    particle.show();
    
    if(particle.edge()){
      particles.splice(i,1);
    } 
  }
  
  if(particles.length < population){
    let dif = population - particles.length;
    for(let i = 0; i < dif; i++){
      particles.push(new Particle());
    }
  }
}

class Particle{
  constructor(){
    this.pos = createVector(random(-100,-10),random(height));
    this.vel = createVector(0,0);
    this.acc = createVector(0,0);
    this.size = random(minSize,maxSize);
    let s = map(this.size, minSize, maxSize, 50, 100);
    this.sight = s;
    this.buddies = [];
    //this.maxSpeed = 0.8;
    this.maxSpeed = 1;
    this.maxForce = 0.5;
  }
  
  flock(){

    var sep = this.seperate(this.buddies);
    var ali = this.align(this.buddies);
    var coh = this.cohesion(this.buddies);


    sep.mult(3);
    ali.mult(4);
    coh.mult(1.5);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
  }
  
  seperate(others) {
    var desiredseparation = this.size*2;
    var sum = createVector();
    var count = 0;

    for (var i = 0; i < others.length; i++) {
      var other = others[i];
      var distance = p5.Vector.dist(this.pos, other.pos);

      if ((distance > 0) && (distance < desiredseparation)) {
        var opposite = p5.Vector.sub(this.pos, other.pos);
        opposite.normalize();
        opposite.div(distance);
        sum.add(opposite);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      sum.setMag(this.maxSpeed);
      var steer = p5.Vector.sub(sum, this.vel);
      steer.limit(this.maxForce);
      return steer;
    } else {
      return createVector();
    }
  }


  align(others) {
    var range = this.sight*2;
    var sum = createVector();
    var count = 0;

    for (var i = 0; i < others.length; i++) {
      var other = others[i];
      var d = p5.Vector.dist(this.pos, other.pos);

      if ((d > 0) && (d < range)) {
        sum.add(other.vel);
        count++;
      }
    }

    if (count > 0) {
      sum.div(others.length);
      sum.setMag(this.maxSpeed);
      var steer = p5.Vector.sub(sum, this.vel);
      steer.limit(this.maxForce);
      return steer;
    } else {
      return createVector();
    }
  }


  cohesion(others) {
    var range = 10;
    var sum = createVector();
    var count = 0;

    for (var i = 0; i < others.length; i++) {
      var other = others[i];
      var d = p5.Vector.dist(this.pos, other.pos);

      if ((d > 0) && (d < range)) {
        sum.add(other.pos);
        count++;
      }
    }

    if (count > 0) {
      sum.div(others.length);
      sum.setMag(this.maxSpeed);
      var steer = p5.Vector.sub(sum, this.vel);
      steer.limit(this.maxForce);
      return this.seek(sum);
    } else {
      return createVector();
    }
  }

  seek(t) {
    var dir = p5.Vector.sub(t, this.pos);
    var d = dir.mag();
    var speed = this.maxSpeed;

    dir.setMag(speed);
    var steer = p5.Vector.sub(dir, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  findBuddies(){
    this.buddies = [];
    for(let particle of particles){
      if(particle != this){
        let d = dist(this.pos.x,this.pos.y,particle.pos.x,particle.pos.y);
        if(d < this.sight){
          this.buddies.push(particle);
        }
      }
    }
  }
  
  edge(){
    if(this.pos.x-this.sight/2 > width || this.pos.y+this.sight/2 < -5 || this.pos.y-this.sight/2 > height){
      return true;
    }
  }
  
  applyForce(force){
    let f = force.copy();
    let m = map(this.size,minSize,maxSize,0.005,0.001)
    f.mult(m)
    this.acc.add(f);
  }
  
  update(){
    this.flock();
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }
  
  show(){
    if(this.buddies.length > 0){
      stroke(220,220,220,10);
      fill(220,220,220,15);
      beginShape();
      vertex(this.pos.x,this.pos.y);
      for(let bud of this.buddies){
        vertex(bud.pos.x,bud.pos.y);
      }
      vertex(this.pos.x,this.pos.y);
      endShape();
    }
    stroke(0);
    fill(100);
    //point(this.pos.x,this.pos.y);
  }
}