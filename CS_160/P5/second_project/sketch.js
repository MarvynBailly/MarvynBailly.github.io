let nSlider;
let dSlider;

function setup() {
  createCanvas(400, 400);
  angleMode(DEGREES);
  nSlider = createSlider(1,20,2);
  dSlider = createSlider(1,20,5);
}

function draw() {
  background(0);
  translate(width / 2, height / 2);
  stroke(225);
  n = nSlider.value();
  d = dSlider.value();
  noFill();
  beginShape();
  for (let i = 0; i < 361 * 20; i++) {
    let k = n/d
    let r = 200 * cos(k * i);
    let x = r * cos(i)
    let y = r * sin(i) 
    vertex(x, y);
  }
  endShape();
}