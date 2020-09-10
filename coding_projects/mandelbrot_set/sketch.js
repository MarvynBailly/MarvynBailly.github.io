var minval = -0.5;
var maxval = 0.5;

var minSlider;
var maxSlider;

function setup() {
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  canvas = createCanvas(width, height);
  canvas.parent("sketchholder");
  
  pixelDensity(1);
  drawSet();
}

function windowResized(){
  var canvasDiv = document.getElementById('sketchholder');
  var width = canvasDiv.offsetWidth;
  var height = canvasDiv.offsetHeight;
  resizeCanvas(width, height);
  drawSet();
}

function drawSet() {
  var maxiterations = 100;

  
  loadPixels();
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {   
      
      var a = map(x, 0, width, -2.5, 2.5);
      var b = map(y, 0, height, -2.5, 2.5);
      
      var ca = a;
      var cb = b;

      var n = 0;

      while (n < maxiterations) {
        var aa = a * a - b * b;
        var bb = 2 * a * b;
        a = aa + ca;
        b = bb + cb;
        if (a * a + b * b > 16) {
          break;
        }
        n++;
      }

      var bright1 = map(n, 0, maxiterations, 0, 1);
      var bright2 = map(n, 0, maxiterations, 0, 1);
      var bright3 = map(n, 0, maxiterations, 0, 1);
      bright1 = map(sqrt(bright1), 0, 1, 0, 255);
      bright2 = map(sqrt(bright2), 0, 1, 100, 0);
      bright3 = map(sqrt(bright3), 0, 1, 255, 0);

      if (n == maxiterations) {
        bright1 = 0;
        bright2 = 0;
        bright3 = 0;
      }

      var pix = (x + y * width) * 4;
      pixels[pix + 0] = bright1;
      pixels[pix + 1] = bright2;
      pixels[pix + 2] = bright3;
      pixels[pix + 3] = 255;
    }
  }
  updatePixels();
}