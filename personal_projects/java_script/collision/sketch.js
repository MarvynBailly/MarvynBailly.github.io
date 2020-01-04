var vel1 = 0;
var vel2 = 1;
var a = 10;
var m1 = 100;
var m2 = 1;
var pos1 = 0;
var pos2  = 0;
var direction2 = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(200);
  strokeWeight(10);

  translate(windowWidth,windowHeight/2+100);

  line(0,0,-1300,0);
  strokeWeight(25);
  line(-1200,-10,-1200,-500);   


  pos2 = pos2 + vel2;

  print(pos2)

  //if (pos2 > 650){
  //  direction2 = 1; 
  //}

  //if (direction2 = 1){
  //  pos2 = pos2 - vel2;
  //}
  //else{
  //  pos2 = pos2 + vel2;
  //}

  //v1 = (v1*(m1-m2)+(2*m2*v2))/(m1+m2);

  //mass 1 has a mass of 100
  //textSize(15);
  //text('Block 1',windowWidth/2-15,windowHeight/2-80);
  strokeWeight(50);
  rect(-500,-40,10,10);

  //mass 2 has a mass of 1
  strokeWeight(25);
  rect(-600 - vel2,-15,10,-10); 
}

