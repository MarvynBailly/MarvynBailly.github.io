var song;

function preload(){
    soundFormats('ogg', 'mp3');
    song = loadSound("piano.mp3")
}

function setup() {
    createCanvas(200,200);
    song.play();
}

function draw() {
    background(0);
}
  