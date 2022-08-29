int DIM = 3; //<>//
int SQUARES = 2;

ArrayList<Integer> [][] tiles;
IntList colors;

void mousePressed(){
  redraw();
}

void setup(){
  size(400,400);
  //noLoop();
  
  tiles = new ArrayList[DIM*DIM][SQUARES];
  colors = new IntList();
  
  //generate colors of tiles

  for(int i = 0; i < DIM; i++){
    colors.append(color(random(255),random(255),random(255)));
  }
  
  //give all tiles all options
  for(int i = 0; i < DIM * DIM; i++){
    for(int j = 0; j < SQUARES; j++){
      tiles[i][j] = new ArrayList<Integer>();
      for(int k = 0; k < DIM; k++){
        tiles[i][j].add(k);
      }
    }
  }
  
}

void randomCollapse(){
  //collapse random tile
  // -- make it find lowest entropy cell
  // -- enable k
  IntList potentialTiles = new IntList();
  ArrayList<Integer>[][] tilesCopy = tiles;
  
 for(int i = 0; i < DIM * DIM; i++){
   for(int j = i+1; j < DIM * DIM; j++){
     for(int k = 0; k < SQUARES; k++){
       if(tilesCopy[i][k].size() > tilesCopy[j][0].size()){
          ArrayList temp = tilesCopy[i][0];    
          tilesCopy[i][k] = tilesCopy[j][0];    
          tilesCopy[j][k] = temp;    
       }
     }
   }
 }
 
  int[] lowestSize = new int[SQUARES];
  for(int k = 0; k < SQUARES; k++){
    lowestSize[k] = 1;
  }
  
  for(int k = 0; k < SQUARES; k++){
    for(int i = 0; i < DIM * DIM; i++){
      //get lowest number that isnt collapsed
      if(tilesCopy[i][k].size() > lowestSize[k]){
        lowestSize[k] = tilesCopy[i][k].size();
        break;
      }
    }
  }
 
 
 //impleting k 
  for(int i = 0; i < DIM*DIM; i++){
    if(tilesCopy[i][0].size() == lowestSize){
      potentialTiles.append(i);
    }
  }
  
  if(potentialTiles.size() > 0){
    int randomTile = potentialTiles.get(floor(random(potentialTiles.size())));
    
    if(tiles[randomTile][0].size() < 1){
      println("error");
    }else{
      int randomValue = tiles[randomTile][0].get(floor(random(tiles[randomTile][0].size())));
      
      tiles[randomTile][0].clear();
      tiles[randomTile][0].add(randomValue);
    }
  }
}

void draw(){
  background(255);
  //println("-----");
  for(int i = 0; i < DIM*DIM; i++){
    //printArray(tiles[i][0]);
  }
  
  randomCollapse();
  
  //make a copy of tiles, remove options and then update tiles
  ArrayList<Integer>[][] tilesCopy = tiles;
          
  
  //vertical
  for(int i = 0; i < DIM; i++){
    //horizontal
    for(int j = 0; j < DIM; j++){
      //for each inner square
      for(int k = 0; k < SQUARES; k++){
        //if tile is collapsed
        if(tiles[j + i * DIM][k].size() == 1){
          drawTiles(i,j,k);
        }
        //collapse tiles
        else{
          //horizontal
          for(int h = 0; h < DIM; h++){
            //println("Current Tile:",tilesCopy[j + i * DIM][k]);
            //println("Current Index:", j + i * DIM);
            //println("Other Tile:",tilesCopy[j + h * DIM][k]);
            //println("Other Index:", j + h * DIM);
            //if other tile is collapsed
            if(tilesCopy[j + h * DIM][k].size() == 1 && (j + i * DIM) != (j + h * DIM)){
              //println("Removing:",tilesCopy[j + h * DIM][k].get(0));
              tilesCopy[j + i * DIM][k].remove(Integer.valueOf(tilesCopy[j + h * DIM][k].get(0)));
            }
            //println("New Tile:",tilesCopy[j + i * DIM][k]);
          }

          
          ////vertical
          for(int h = 0; h < DIM; h++){
            //println("Current Index:", j + i * DIM);
            //println("Other Tile:",tilesCopy[h + i * DIM][k]);
            //println("Other Index:", h + i * DIM);
            if(tilesCopy[h + i * DIM][k].size() == 1 && (j + i * DIM) != (h + i * DIM)){
              //println("Removing:",tilesCopy[h + i * DIM][k].get(0));
              tilesCopy[j + i * DIM][k].remove(Integer.valueOf(tilesCopy[h + i * DIM][k].get(0)));
            }
            //println("New Tile:",tilesCopy[j + i * DIM][k]);
          }
          
          //if current cell collapsed, update others
          if(tilesCopy[j + i * DIM][k].size() == 1){
            //update horizontal cells
            for(int h = 0; h < DIM; h++){
              if((j + h * DIM) != (j + i * DIM) && tilesCopy[j + h * DIM][k].contains(tilesCopy[j + i * DIM][k].get(0))){
                tilesCopy[j + h * DIM][k].remove(Integer.valueOf(tilesCopy[j + i * DIM][k].get(0)));
              }
            }
       
            //update verticel cells
            for(int h = 0; h < DIM; h++){
              if((h + i * DIM) != (j + i * DIM) && tilesCopy[h + i * DIM][k].contains(tilesCopy[j + i * DIM][k].get(0))){
                tilesCopy[h + i * DIM][k].remove(Integer.valueOf(tilesCopy[j + i * DIM][k].get(0)));
              }
            }
          }
        }
        
      }
    }
  }
  
  tiles = tilesCopy;
  
  //println("-----");
  for(int i = 0; i < DIM*DIM; i++){
    //printArray(tiles[i][0]);
  }
}

void drawTiles(int i, int j, int k){
  stroke(0);
  
  int w = width / DIM;
  int h = height / DIM;
  float offSet = k/SQUARES * 40;
  println(offSet);
  //fill(colors.get(tiles[j + i * DIM][k].get(0)));
  //fill(tiles[j + i * DIM][k].get(floor(random(DIM))));
  rect(j * w + offSet , i * h + offSet, w - 2 * offSet , h - 2 * offSet);
}
