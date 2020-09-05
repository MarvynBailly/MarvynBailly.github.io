function setup() {
    var canvasDiv = document.getElementById('sketchholder');
    var width = canvasDiv.offsetWidth;
    var height = canvasDiv.offsetHeight;
    canvas = createCanvas(width, height);
    canvas.parent("sketchholder");
    background(255, 0, 200);
}

function windowResized(){
    var canvasDiv = document.getElementById('sketchholder');
    var width = canvasDiv.offsetWidth;
    var height = canvasDiv.offsetHeight;
    resizeCanvas(width, height);
    background(255, 0, 200);
}

function draw() {
    let r = random(0,255)
    if (mouseIsPressed) {
        fill(0,r,r);
    }
    else {
        fill(r,r);
    }
    ellipse(mouseX,mouseY,80,80)
    //triangle(mouseX, mouseY, windowHeight, 0, 0, windowWidth);
}