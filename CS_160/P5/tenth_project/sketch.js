let size = 160;
let font;
var points = [];
var particles = [];
var location = 0;


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
  
  //textFont(font);
  //textSize(size);
  //fill(0);
  //noStroke();
  //text(text1,100,100);
  //text(text2,75,200);
  //text(text3,140,300); 
  
  append(points, font.textToPoints(text1,x1,y1,size));
  append(points,font.textToPoints(text2,x2,y2,size));
  append(points, font.textToPoints(text3,x3,y3,size));
  //console.log(points);
  
  //for (var i = 0; i < points.length; i++){
  //  for (var j = 0; j < points[i].length; j++){
  //    var pts = points[i][j];
  //    var particle = new Particle(pts.x,pts.y);
  //    particles.push(particle);
  //  }
  //}
}

function findTarget(t){
  for (var i = 0; i < points[t].length; i++){
    var pts = points[t][i];
    var particle = new Particle(pts.x,pts.y);
    particle.push(particle);
  }
}

function findDifference(){
  
}

function mouseClicked(event){
  //Find difference of particles
  //Create new or take away particles by spliting or merging
  //Give the particles new targets
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