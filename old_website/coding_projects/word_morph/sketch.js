let size = 100;
let font;
var points = [];
var particles = [];
var position = 0;
var amountParticles = 0;

let text1 = 'Wilder';
let text2 = 'Carotte';
let text3 = 'Nostrada';

let x1 = 70;
let y1 = 160;
let x2 = 80;
let y2 = 300;
let x3 = 90;
let y3 = 440;

function preload(){
  font = loadFont('imports\\fonts\\Helvetica.ttf');
}


function setup() {
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  canvas = createCanvas(width, height);
  canvas.parent("sketchholder");

  append(points, font.textToPoints(text1,x2,y2,size));
  append(points,font.textToPoints(text2,x2,y2,size));
  append(points, font.textToPoints(text3,x2,y2,size));
  //console.log(points);
  
}

function windowResized(){
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  resizeCanvas(width, height);
}

function createTarget(s){
  return points[s];
}

function findDifference(a,t){
  return (t.length-a);
}

function splitApart(d){
  var a = particles.length; 
  for(var i = 0; i < d; i++){
    if (a == 0){
      let particle = new Particle(random(win),random(hit));
      particles.push(particle);
    } else{ 
      var pts = particles[i];
      pts.reset();
      pts.reset();
      let particle = new Particle(pts.pos.x,pts.pos.y);
      particles.push(particle);
    }
  }
}

function merge(d){
  for(var j = 0; j < particles.length; j++){
    particle = particles[j];
    particle.reset();
    particle.reset();
  }
  for(var i = 0; i < d; i++){
    var r = floor(random(particles.length));
    particle = particles[r];
    particles.splice(r,1);
  }
}

function defineTarget(t){
  for(var i = 0; i < particles.length; i++){
    //var r = floor(random(particles.length));
    var particle = particles[i]
    particle.findTarget(t[i].x,t[i].y);
  }
}

function morph(){
  for(var i = 0; i < particles.length; i++){
    var particle = particles[i]
    particle.reset();
  }
}

function mouseClicked(){
  var target = createTarget(position);
  var difference = findDifference(amountParticles, target);
  
  if (difference > 0){
    splitApart(difference);
  } else if (difference == 0){
    morph();
    } else {
    merge(abs(difference));
  }
  defineTarget(target); 
  
  amountParticles = target.length;
  position += 1;
  position = position % 3;
}

function draw() {
  background(0);
  //background(230);
  
  for(var i = 0; i < particles.length; i++){
    var particle = particles[i];
    //console.log(floor(particle.pos.x+particle.pos.y) == floor(particle.target.x+particle.target.y));
    particle.behaviors();
    particle.update();
    particle.show();
  }
}