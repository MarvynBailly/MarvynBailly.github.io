float moveSpeed = 1;
float dt = 1;
float diffuseSpeed = 0.05;
float evapSpeed = 1.5;
float turnSpeed = 0.5;
float sensorAngle = 6;//20;//6;
float sensorDst = 10;//25;//10;
int sensorSize = 1;

int colonySize = 5000;

Agent[] agents;
float[] displayArray;

int getIndex(PVector pos){
  return (floor(pos.x) + floor(pos.y) * width);
}

PVector get2D(int index){
   return new PVector(index % width, index / height);
} 

void setup(){
  size(600,600,P2D);
  pixelDensity(1);
  
  displayArray = new float[width*height];
  
  for(int i = 0; i <width*height; i++){
    displayArray[i] = 0;
  }
  
  //init ants
  agents = new Agent[colonySize];
  for(int i = 0; i < colonySize; i++){
    //float x = random(200)*cos(random(2*PI))+width/2;
    //float y = random(200)*sin(random(2*PI))+height/2;
    //PVector aVec = new PVector(width/2-x,height/2-y);
    //float a = aVec.normalize().heading();
    float x = width/2;
    float y = height/2;
    float a = random(2*PI);
    agents[i] = new Agent(x,y,a);
  }
  
  //noLoop();
}

void draw(){
  background(0);

  sensorAngle += 0.01;
  sensorAngle = sensorAngle % 50;
  
  sensorDst += 0.01;
  sensorDst = sensorAngle % 55;
  
  //ant loop
  for(Agent a : agents){
    steer(a);
    int index = a.update();
    displayArray[index] = 255;
  }
  
  processDisplay();
  updateDisplay();
}

void steer(Agent a){
    float weightForward = sense(a, 0);
    float weightLeft = sense(a, sensorAngle);
    float weightRight = sense(a, -sensorAngle);
    
    //println(weightForward,weightLeft,weightRight);
    
    float randomSteer = random(1);
    
    //move forward
    if(weightForward > weightLeft && weightForward > weightRight){
      a.angle += 0;
    }
    //random
    else if(weightForward < weightLeft && weightForward < weightRight){
      a.angle += 2*(randomSteer - 0.5) * turnSpeed * dt;
    }
    //left
    else if(weightLeft > weightRight){
      a.angle -= randomSteer * turnSpeed * dt;
    }
    //right
    else if(weightLeft < weightRight){
      a.angle += randomSteer * turnSpeed * dt;
    }
}

float sense(Agent a, float sensorAngleOff){
  //println("Position:",a.position);
  //println("Sensor Off Angle:", sensorAngleOff);
  float sensorAngle = a.angle + sensorAngleOff;
  //println("Sensor Angle:",sensorAngle);
  PVector sensorDir = new PVector(cos(sensorAngle),sin(sensorAngle));
  //println("Sensor Direction:",sensorDir);  
  PVector sensorCenter = sensorDir.mult(sensorDst).add(a.position.copy());
  //println("Sensor Center:",sensorCenter);
  
  
  float sum = 0;
  
  for(int xOff = -sensorSize; xOff <= sensorSize; xOff++){
    for(int yOff = -sensorSize; yOff <= sensorSize; yOff++){
      PVector sample = new PVector(sensorCenter.x + xOff, sensorCenter.y + yOff);
      if(sample.x >= 0 && sample.x < width  && sample.y >= 0 && sample.y < height){
        int sampleIndex = getIndex(sample);
        sum += displayArray[sampleIndex];
      }
    }  
  }
  return sum;
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
