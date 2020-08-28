let size = 160;
let font;
var points = [];
var particles = [];
var location = 0;
var amountParticles = 0;

let text1 = 'I';
let text2 = 'love';
let text3 = 'you';

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