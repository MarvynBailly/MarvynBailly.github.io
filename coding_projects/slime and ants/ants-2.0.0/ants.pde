float moveSpeed = 1;
float dt = 1;
float diffuseSpeed = 0.5;
float evapSpeed = 0.1;

int colonySize = 50;

Agent[] agents;
float[] displayArray;

int getIndex(PVector pos){
  return (floor(pos.x) + floor(pos.y) * width);
}

PVector get2D(int index){
   return new PVector(index % width, index / height);
} 

void setup(){
  size(400,400);
  pixelDensity(1);
  
  displayArray = new float[width*height];
  
  for(int i = 0; i <width*height; i++){
    displayArray[i] = 0;
  }
  
  //init ants
  agents = new Agent[colonySize];
  for(int i = 0; i < colonySize; i++){
    agents[i] = new Agent(width/2,height/2,random(2*PI));
  }
}

void draw(){
  background(0);

  
  //ant loop
  for(Agent a : agents){
    int index = a.update();
    displayArray[index] = 255;
  }
  
  processDisplay();
  updateDisplay();
}


void processDisplay(){
    for(int index = 0; index < width*height; index++){
      PVector position = get2D(index);
      
      if(position.x < 0 || position.x >= width  || position.y < 0 && position.y >= height){
        return;
      }
      
      float orginalValue = displayArray[index];
      float sum = 0;
      for(int xOff = -1; xOff <= 1; xOff++){
        for(int yOff = -1; yOff <= 1; yOff++){
          PVector sample = new PVector(position.x + xOff, position.y + yOff);
          
          if(sample.x >= 0 && sample.x < width  && sample.y >= 0 && sample.y < height){
            int sampleIndex = getIndex(sample);
            sum += displayArray[sampleIndex];
          }
        }
      }
      float blur = sum/9 ;
      float diffuse = lerp(orginalValue, blur, diffuseSpeed * dt);
      float evap = max(0, diffuse - evapSpeed * dt);
      
      displayArray[index] = evap;
   }
}

void updateDisplay(){
  loadPixels();
  for(int i = 0; i <width*height; i++){
    pixels[i] = color(displayArray[i]);
  }
  updatePixels();
}
