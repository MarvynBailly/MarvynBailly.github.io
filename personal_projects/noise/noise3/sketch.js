var points = [];

const gpu = new GPU();

function setup(){
  createCanvas(400,400);
  pixelDensity(1);

  for(let i = 0; i < 50; i++){
    let p = p5.Vector.random3D();
    let v = p.mult(random(200));
    let m = v.add(200,200,0);
    points[i] = m;//createVector(random(width),random(height),random(width));
  }
}

function draw(){
  background(0);
  stroke(255,255,255);  

  loadPixels();
  for(var x = 0; x < width; x++){
    for(var y = 0; y < height; y++){
      
      let distances = [];
      for (let i = 0; i < points.length; i++){
        let z = frameCount % width;
        let a = points[i];
        distances[i] = dist(x,y,z,a.x,a.y,a.z);
      }
      
      let n = 0;
      let sorted = sort(distances);
      let r = map(sorted[n],0,150,0,255);
      //let g = map(sorted[1],0,150,0,255);
      //let b = map(sorted[2],0,150,0,255);
      let index = (x + y * width) * 4;

      pixels[index] = r;
      pixels[index+1] = r;
      pixels[index+2] = r;
      pixels[index+3] = 255;
    }
  }
  updatePixels(); 
}