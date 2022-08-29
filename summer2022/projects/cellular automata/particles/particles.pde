//controlP5 library for sliders
import controlP5.*;

ControlP5 cp5;

int species = 4;
int size = 600;

int minRule = -100;
int maxRule = 100;
int minDistance = 50;
int maxDistance = 500;

float force = 0.1;
float mapMag = 2;


float gxg = 4.9;//0;//random(minRule,maxRule);
float gxr = 0;//random(minRule,maxRule);
float gxb = -80;//0;//random(minRule,maxRule);
float gxw = 0;//random(minRule,maxRule);

float gxgR = 411;
float gxrR = 58;
float gxbR = 103;
float gxwR = 290;

float rxr = 10;//random(minRule,maxRule);
float rxg = -20;//random(minRule,maxRule);
float rxb = 31;//random(minRule,maxRule);
float rxw = 0;//random(minRule,maxRule);

float rxrR = 100;
float rxgR = 181;
float rxbR = 150;
float rxwR = 94;

float bxb = -20;//random(minRule,maxRule);
float bxg = 15;//random(minRule,maxRule);
float bxr = 1;//random(minRule,maxRule);
float bxw = 2;//random(minRule,maxRule);

float bxbR = 60;
float bxgR = 143;
float bxrR = 50;
float bxwR = 475;

float wxw = -23;//random(minRule,maxRule);
float wxg = 14;//random(minRule,maxRule);
float wxb = 0;//random(minRule,maxRule);
float wxr = 26;//random(minRule,maxRule);

float wxwR = 114;
float wxgR = 200;
float wxbR = 119;
float wxrR = 255;

Atom[] atoms = new Atom[species * size];

Atom[] red = new Atom[size];
Atom[] green = new Atom[size];
Atom[] blue = new Atom[size];
Atom[] white = new Atom[size];

class Atom{
  float x;
  float y;
  float vx  = 0;
  float vy = 0;
  color c;
  
  Atom(float posX,float posY, color clr){
    x = posX;
    y = posY;
    c = clr;
  }
}

void rule(Atom[] atoms1, Atom[] atoms2, float g, float r){
  for(int i = 0; i < atoms1.length; i++){
    float fx = 0;
    float fy = 0;
    Atom a = atoms1[i];
    for(int j = 0; j < atoms2.length; j++){
      Atom b = atoms2[j];
      float dx = a.x - b.x;
      float dy = a.y - b.y;
      float d = sqrt(dx*dx + dy*dy);
      if(d > 0 && d < r){
        float f = g * 1/d;
        fx += (f * dx);
        fy += (f * dy);
      }
    }
    a.vx = (a.vx + fx)*force;
    a.vy = (a.vy + fy)*force;
    a.x += a.vx;
    a.y += a.vy;
    //edge case
    //if(a.x <= 0 || a.x >= width){a.vx *= -1;}
    //if(a.y <= 0 || a.y >= height){a.vy *= -1;}
    
    if(a.x <= -10){a.x = width+10;}
    if(a.x >= width + 10){a.x = -10;}
    if(a.y <= -10){a.y = height+10;}
    if(a.y >= height + 10){a.y = -10;}
  }
}

Atom[] create(int number, color clr, int spot){
  Atom[] group = new Atom[number];
  for(int i = 0; i < number; i++){
    group[i] = new Atom(random(400,width),random(0,height),clr);
    atoms[spot + i] = group[i];
  }
  return group;
}

void setup(){
  fullScreen();
  atoms = new Atom[species * size];
  
  red = create(size,color(255,0,0),0);
  green = create(size,color(0,255,0),size);
  blue = create(size,color(0,0,255),2*size);
  white = create(size,color(255,255,255),3*size);
  
  
  //SLIDERS
  cp5 = new ControlP5(this);
  //addSlider(name, minRule, maxRule, starting, x, y, width, height)
  
  //Green 
  cp5.addSlider("gxg",minRule,maxRule,gxg,10,10,100,20);
  cp5.addSlider("gxr",minRule,maxRule,gxr,10,30,100,20);
  cp5.addSlider("gxb",minRule,maxRule,gxb,10,50,100,20);
  cp5.addSlider("gxw",minRule,maxRule,gxw,10,70,100,20);
  
  cp5.addSlider("gxgR",minDistance,maxDistance,gxgR,10,100,100,20);
  cp5.addSlider("gxrR",minDistance,maxDistance,gxrR,10,120,100,20);
  cp5.addSlider("gxbR",minDistance,maxDistance,gxbR,10,140,100,20);
  cp5.addSlider("gxwR",minDistance,maxDistance,gxwR,10,160,100,20);
    
    
  //Red
  cp5.addSlider("rxr",minRule,maxRule,rxr,10,210,100,20);
  cp5.addSlider("rxg",minRule,maxRule,rxg,10,230,100,20);
  cp5.addSlider("rxb",minRule,maxRule,rxb,10,250,100,20);
  cp5.addSlider("rxw",minRule,maxRule,rxw,10,270,100,20);
  
  cp5.addSlider("rxrR",minDistance,maxDistance,rxrR,10,300,100,20);
  cp5.addSlider("rxgR",minDistance,maxDistance,rxgR,10,320,100,20);
  cp5.addSlider("rxbR",minDistance,maxDistance,rxbR,10,340,100,20);
  cp5.addSlider("rxwR",minDistance,maxDistance,rxwR,10,360,100,20);
  
  //Blue
  cp5.addSlider("bxb",minRule,maxRule,bxb,10,410,100,20);
  cp5.addSlider("bxg",minRule,maxRule,bxg,10,430,100,20);
  cp5.addSlider("bxr",minRule,maxRule,bxr,10,450,100,20);
  cp5.addSlider("bxw",minRule,maxRule,bxw,10,470,100,20);
  
  cp5.addSlider("bxbR",minDistance,maxDistance,bxbR,10,500,100,20);
  cp5.addSlider("bxgR",minDistance,maxDistance,bxgR,10,520,100,20);
  cp5.addSlider("bxrR",minDistance,maxDistance,bxrR,10,540,100,20);
  cp5.addSlider("bxwR",minDistance,maxDistance,bxwR,10,560,100,20);
  
  //White
  cp5.addSlider("wxw",minRule,maxRule,wxw,10,610,100,20);
  cp5.addSlider("wxg",minRule,maxRule,wxg,10,630,100,20);
  cp5.addSlider("wxb",minRule,maxRule,wxb,10,650,100,20);
  cp5.addSlider("wxr",minRule,maxRule,wxr,10,670,100,20);
  
  cp5.addSlider("wxwR",minDistance,maxDistance,wxwR,10,700,100,20);
  cp5.addSlider("wxgR",minDistance,maxDistance,wxgR,10,720,100,20);
  cp5.addSlider("wxbR",minDistance,maxDistance,wxbR,10,740,100,20);
  cp5.addSlider("wxrR",minDistance,maxDistance,wxrR,10,760,100,20);
  
  //particle speed
  cp5.addSlider("force",0.1,0.5,force,10,800,100,20);
  
  //randomize button
  cp5.addButton("randomize").setPosition(10,850);
  
  //reset button
  cp5.addButton("reset").setPosition(100,850);
  
  //center
  cp5.addButton("center").setPosition(10,900);
  
  //save
  cp5.addButton("save").setPosition(100,900);
}

public void save(){
  String data =
"float gxg = "+gxg+";n"+
"float gxr = "+gxr+";n"+
"float gxb = "+gxb+";n"+
"float gxw = "+gxw+";n"+
"float gxgR = "+gxgR+";n"+
"float gxrR = "+gxrR+";n"+
"float gxbR = "+gxbR+";n"+
"float gxwR = "+gxwR+";n"+
"float rxr = "+rxr+";n"+
"float rxg = "+rxg+";n"+
"float rxb = "+rxb+";n"+
"float rxw = "+rxw+";n"+
"float rxrR = "+rxrR+";n"+
"float rxgR = "+rxgR+";n"+
"float rxbR = "+rxbR+";n"+
"float rxwR = "+rxwR+";n"+
"float bxb = "+bxb+";n"+
"float bxg = "+bxg+";n"+
"float bxr = "+bxr+";n"+
"float bxw = "+bxw+";n"+
"float bxbR = "+bxbR+";n"+
"float bxgR = "+bxgR+";n"+
"float bxrR = "+bxrR+";n"+
"float bxwR = "+bxwR+";n"+
"float wxw = "+wxw+";n"+
"float wxg = "+wxg+";n"+
"float wxb = "+wxb+";n"+
"float wxr = "+wxr+";n"+
"float wxwR = "+wxwR+";n"+
"float wxgR = "+wxgR+";n"+
"float wxbR = "+wxbR+";n"+
"float wxrR = "+wxrR+";n";
  String[] list = split(data, "n");
  saveStrings("save.txt",list);
}

public void center(){
  for(int i = 0; i < atoms.length; i++){
    atoms[i].x = width/2 + 200;
    atoms[i].y = height/2;
  }
}

public void reset(){
  for(int i = 0; i < atoms.length; i++){
    atoms[i].x = random(400,width);
    atoms[i].y = random(0,height);
  }
}

public void randomize(){
  gxg = random(minRule,maxRule);
  gxr = random(minRule,maxRule);
  gxb = random(minRule,maxRule);
  gxw = random(minRule,maxRule);
  rxr = random(minRule,maxRule);
  rxg = random(minRule,maxRule);
  rxb = random(minRule,maxRule);
  rxw = random(minRule,maxRule);
  bxb = random(minRule,maxRule);
  bxg = random(minRule,maxRule);
  bxr = random(minRule,maxRule);
  bxw = random(minRule,maxRule);
  wxw = random(minRule,maxRule);
  wxg = random(minRule,maxRule);
  wxb = random(minRule,maxRule);
  wxr = random(minRule,maxRule);
  cp5.getController("gxg").setValue(gxg);
  cp5.getController("gxr").setValue(gxr);
  cp5.getController("gxb").setValue(gxb);
  cp5.getController("gxw").setValue(gxw);
  cp5.getController("rxr").setValue(rxr);
  cp5.getController("rxg").setValue(rxg);
  cp5.getController("rxb").setValue(rxb);
  cp5.getController("rxw").setValue(rxw);
  cp5.getController("bxb").setValue(bxb);
  cp5.getController("bxg").setValue(bxg);
  cp5.getController("bxr").setValue(bxr);
  cp5.getController("bxw").setValue(bxw);
  cp5.getController("wxw").setValue(wxw);
  cp5.getController("wxg").setValue(wxg);
  cp5.getController("wxb").setValue(wxb);
  cp5.getController("wxr").setValue(wxr);
  gxgR = random(minDistance,maxDistance);
  gxrR = random(minDistance,maxDistance);
  gxbR = random(minDistance,maxDistance);
  gxwR = random(minDistance,maxDistance);
  rxrR = random(minDistance,maxDistance);
  rxgR = random(minDistance,maxDistance);
  rxbR = random(minDistance,maxDistance);
  rxwR = random(minDistance,maxDistance);
  bxbR = random(minDistance,maxDistance);
  bxgR = random(minDistance,maxDistance);
  bxrR = random(minDistance,maxDistance);
  bxwR = random(minDistance,maxDistance);
  wxwR = random(minDistance,maxDistance);
  wxgR = random(minDistance,maxDistance);
  wxbR = random(minDistance,maxDistance);
  wxrR = random(minDistance,maxDistance);
  cp5.getController("gxgR").setValue(gxgR);
  cp5.getController("gxrR").setValue(gxrR);
  cp5.getController("gxbR").setValue(gxbR);
  cp5.getController("gxwR").setValue(gxwR);
  cp5.getController("rxrR").setValue(rxrR);
  cp5.getController("rxgR").setValue(rxgR);
  cp5.getController("rxbR").setValue(rxbR);
  cp5.getController("rxwR").setValue(rxwR);
  cp5.getController("bxbR").setValue(bxbR);
  cp5.getController("bxgR").setValue(bxgR);
  cp5.getController("bxrR").setValue(bxrR);
  cp5.getController("bxwR").setValue(bxwR);
  cp5.getController("wxwR").setValue(wxwR);
  cp5.getController("wxgR").setValue(wxgR);
  cp5.getController("wxbR").setValue(wxbR);
  cp5.getController("wxrR").setValue(wxrR);
}

void draw(){
  background(0);
  
  rule(green, green, map(gxg,-100,100,-mapMag,mapMag), gxgR);
  rule(green, red, map(gxr,-100,100,-mapMag,mapMag), gxrR);
  rule(green, blue, map(gxb,-100,100,-mapMag,mapMag), gxbR);
  rule(green, white, map(gxw,-100,100,-mapMag,mapMag), gxwR);
  
  rule(red, red, map(rxr,-100,100,-mapMag,mapMag), rxrR);
  rule(red, green, map(rxg,-100,100,-mapMag,mapMag), rxgR);
  rule(red, blue, map(rxb,-100,100,-mapMag,mapMag), rxbR);
  rule(red, white, map(rxw,-100,100,-mapMag,mapMag), rxwR);
  
  rule(blue, blue, map(bxb,-100,100,-mapMag,mapMag), bxbR);
  rule(blue, green, map(bxb,-100,100,-mapMag,mapMag), bxgR);
  rule(blue, red, map(bxr,-100,100,-mapMag,mapMag), bxrR);
  rule(blue, white, map(bxw,-100,100,-mapMag,mapMag), bxwR);
  
  rule(white, white, map(wxw,-100,100,-mapMag,mapMag), wxwR);
  rule(white, green, map(wxg,-100,100,-mapMag,mapMag), wxgR);
  rule(white, blue, map(wxb,-100,100,-mapMag,mapMag), wxbR);
  rule(white, red, map(wxr,-100,100,-mapMag,mapMag), wxrR);
  
  for(int i = 0; i < atoms.length; i++){
    noStroke();
    fill(atoms[i].c);
    circle(atoms[i].x,atoms[i].y,10);
  }
}
