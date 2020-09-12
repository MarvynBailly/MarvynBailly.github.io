function setup() {
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  canvas = createCanvas(width, height);
  canvas.parent("sketchholder");
  background(220);
  osc = new p5.Oscillator('square');
  osc.start();
  osc.amp(1);
  osc.freq(0);
}

function windowResized(){
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  resizeCanvas(width, height);
}

function indexOf(i,array){
  var result = false;
  
  for(var b = 0; b < array.length; b++){
    if((i) == array[b]){
      result = true;
    }
  }
  return result;
}

function getSequence(k){
  var sequence = [];
  var j = 0;
  for(var i = 0; i < k; i++){
    if(i == 0){
      append(sequence,0);
    } else if(((j - i) > 0) && !indexOf(j - i,sequence)){
      append(sequence,j - i)
    }else{
      append(sequence,j + i);
    }
    j = sequence[sequence.length - 1];
  }
  return sequence;
}

function graph(){
  var sequence = getSequence(width/5);
  translate(0,height);
  for(var i = 0; i < sequence.length; i++){
    line(i * 5, -sequence[i],(i + 1) * 5, -sequence[i + 1]);
  }
}

function circles(){
  var sequence = getSequence(width/10);
  translate(0,width/2);
  noFill();
  for(var i = 0; i < sequence.length; i++){
    circle(i * 10,0,sequence[i]);
  }
}

function printSequence(i){
  console.log(getSequence(i));
}

var i = 0;

function draw() {
  //noLoop();
  //printSequence(200);
  //graph();
  //circles();
  
  var sequence = getSequence(500);
  if(i == 100){
    noLoop();
    osc.amp(0);
  }
  
  textSize(45);
  fill(220);
  stroke(220);
  rect(0,0,100,60);
  fill(0);
  stroke(0);
  text(sequence[i],0,50);
  if(frameCount % 20 == 0){
    osc.freq(sequence[i]*1.5);
    translate(0,height);
    line(i, -sequence[i],(i + 1), -sequence[i + 1]);
    //translate(0,height/2);
    noFill();
    circle(i * 3,-height/2-75,sequence[i] * 0.5);
    i ++;
  }
  
}
