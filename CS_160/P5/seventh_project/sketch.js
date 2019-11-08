function setup() {
  createCanvas(400, 400);
  background(255);
}
function draw() {
  stroke(255);
  strokeWeight(1);

  for(let i = 0; i<height; i+=20){
    line(i,0,i,height);
    stroke(0);
  }

  for(let i = 0; i<width; i+=20){
    line(width,i,0,i);
  }

  strokeWeight(3);
  line(width/2,0,height/2,height);
  line(width,width/2,0,height/2);

}