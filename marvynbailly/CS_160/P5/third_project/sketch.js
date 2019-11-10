let n = 6;
let d = 71;
//let dSlider;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  //dSlider = createSlider(1,170,1);
}

function draw() {
  background(0);
  translate(width / 2, height / 2);
  stroke(225);
  //d = dSlider.value();
  noFill();
  beginShape();
  strokeWeight(1);
  for (let i = 0; i < 361; i++) {
    let k = i * d
    let r = 200 * sin(n * k);
    let x = r * cos(k);
    let y = r * sin(k);
    vertex(x, y);
  }
  endShape();

  noFill();
  stroke(255, 0, 255, 255);
  strokeWeight(4);
  beginShape();
  for (let i = 0; i < 361; i++) {
    let k = i
    let r = 200 * sin(n * k);
    let x = r * cos(k);
    let y = r * sin(k);
    vertex(x, y);
  }
  endShape();
}