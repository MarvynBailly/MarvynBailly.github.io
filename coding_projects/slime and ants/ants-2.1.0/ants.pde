float moveSpeed = 1;
float dt = 1;
float diffuseSpeed = 1;
float evapSpeed = 1;

int colonySize = 50;

Agent[] agents;
float[] displayArray;
ArrayList<PVector> trail;

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
  trail = new ArrayList<PVector>();
  
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
    PVector indexValue = new PVector(index,255);
    trail.add(indexValue);
  }
  
  processDisplay();
  updateDisplay();
}


void processDisplay(){
    for(int i = trail.size() - 1; i >= 0; i--){
      PVector indexValue = trail.get(i);
      int index = parseInt(indexValue.x);
      float orginalValue = indexValue.y;
      
      //PVector position = get2D(index);
      //float sum = 0;
      //for(int xOff = -1; xOff <= 1; xOff++){
      //  for(int yOff = -1; yOff <= 1; yOff++){
      //    PVector sample = new PVector(position.x + xOff, position.y + yOff);
          
      //    if(sample.x >= 0 && sample.x < width  && sample.y >= 0 && sample.y < height){
      //      int sampleIndex = getIndex(sample);
      //      sum += displayArray[sampleIndex];
      //    }
      //  }
      //}
      //float blur = sum/9 ;
      //float diffuse = lerp(orginalValue, blur, diffuseSpeed * dt);
      float evap = max(0, orginalValue - evapSpeed * dt);
      
              trail.get(i).y = evap;
        displayArray[index] = evap;
      
      //if(orginalValue < 0){
      //  trail.remove(i);
      //}else{
      //  trail.get(i).y = evap;
      //  displayArray[index] = evap;
      //}
   }
}

void updateDisplay(){
  loadPixels();
  for(int i = 0; i <width*height; i++){
    pixels[i] = color(displayArray[i]);
  }
  updatePixels();
}
