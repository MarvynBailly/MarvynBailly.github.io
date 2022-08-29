float moveSpeed = 1;
float dt = 1;

int colonySize = 200;

Agent[] agents;
ArrayList<PVector> locations;

int getIndex(PVector pos){
  return (floor(pos.x) + floor(pos.y) * width);
}

void setup(){
  size(400,400);
  pixelDensity(1);
  
  locations = new ArrayList<PVector>();
  
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
    int position = a.update();
    PVector positionValue = new PVector(position,255);
    locations.add(positionValue);
  }
  
  //fade trails 
  loadPixels();
  for(int i = locations.size() - 1; i >= 0; i--){
    PVector currentLocation = locations.get(i);
    
    if(currentLocation.y != -1){
      pixels[parseInt(currentLocation.x)] = color(parseInt(currentLocation.y));
    }
    
    if(currentLocation.y >= 0){
      currentLocation.y--;
    }else{
      locations.remove(i);
    }
  }
  updatePixels();
}
