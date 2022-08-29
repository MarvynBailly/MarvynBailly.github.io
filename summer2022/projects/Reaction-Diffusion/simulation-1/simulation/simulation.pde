float Da = 1.0;
float Db = 0.5;
float f = 0.55;
float k = 0.062;
float dt = 1.0;

float[][] displayArray;
float[][] updateArray;

int getIndex(PVector pos){
  return (floor(pos.x) + floor(pos.y) * width);
}

PVector get2D(int index){
   return new PVector(index % width, index / height);
} 

void setup(){
  size(400,400,P2D);
  pixelDensity(1);
  
  displayArray = new float[width*height][2];
  updateArray = new float[width*height][2];

  
  for(int i = 0; i <width*height; i++){
    displayArray[i][0] =  1;  //a
    displayArray[i][1] =  0;  //b
  }
  
  for(int xOff = -10; xOff <= 10; xOff++){
    for(int yOff = -10; yOff <= 10; yOff++){
      int index = getIndex(new PVector(xOff + width/2, yOff + height/2));
      displayArray[index][1] = 1;
    }
  }
  
  
}

void draw(){
  background(0);
  updateSimulation();
  updateDisplayArray();
  renderSimulation();
}

void updateSimulation(){
  for(int i = 0; i <width*height; i++){
    float A = displayArray[i][0];
    float B = displayArray[i][1];
    float[] laplace = Laplace(i);
    updateArray[i][0] = A + (Da * laplace[0] * A - A * B * B + f * (1 - A)) * dt;
    updateArray[i][1] = B + (Db * laplace[1] * B + A * B * B - (k + f)*B) * dt;
  }
}

void updateDisplayArray(){
  displayArray = updateArray;
  updateArray = new float[width*height][2];
}

float[] Laplace(int index){
  PVector position = get2D(index);
  float[] sum = new float[2];
  //3x3 grid
  for(int xOff = -1; xOff <= 1; xOff++){
    for(int yOff = -1; yOff <= 1; yOff++){
      PVector sample = new PVector(position.x + xOff, position.y + yOff);
      if(sample.x >= 0 && sample.x < width  && sample.y >= 0 && sample.y < height){
        int sampleIndex = getIndex(sample);
        //come up with fancy way to include weights of different spots
        //center
        if(xOff == 0 && yOff == 0){
          sum[0] += displayArray[sampleIndex][0] * -1;
          sum[1] += displayArray[sampleIndex][1] * -1;
        }
        //diagonal
        else if(xOff == -1 && yOff == -1 || xOff == -1 && yOff == 1 || xOff == 1 && yOff == -1 || xOff == 1 && yOff == 1){
          sum[0] += displayArray[sampleIndex][0] * 0.05;
          sum[1] += displayArray[sampleIndex][1] * 0.05;
        }
        //adjacent
        else if(xOff == 0 && yOff == -1 || xOff == -1 && yOff == 0 || xOff == 1 && yOff == 0 || xOff == 1 && yOff == 0){
          sum[0] += displayArray[sampleIndex][0] * 0.20;
          sum[1] += displayArray[sampleIndex][1] * 0.20;
        }
      }
    }
  }
  return sum;
}

void renderSimulation(){
    loadPixels();
  for(int i = 0; i <width*height; i++){
    float A = displayArray[i][0]; //color A as white
    float B = displayArray[i][1]; //color B as black
    
    float diff = A - B; //get the difference in each cell 
    float clr = map(diff,-1,1,0,255); //coloring scheme: if all in A, 1 - 0 = 1
    
    pixels[i] = color(clr);
  }
  updatePixels();
}
