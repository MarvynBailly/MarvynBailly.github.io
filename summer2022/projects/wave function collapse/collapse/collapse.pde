PImage[] tiles;

//Integer[][] grid;
ArrayList<Integer>[] grid;

int DIM = 2;
int TILE_AMOUNT = 5;

ArrayList<Integer>[][] rules;

//int[] getEntropy(Integer cell[]){
//  int sum = 0;
//  int index = -1;
//  for(int k = 0; k < TILE_AMOUNT; k++){
//    int c = cell[k];
//    if(c != -1){
//      sum++;
//      index = k;
//    }
//  }
//  int[] result = new int[2];
//  result[0] = sum;
//  result[1] = index;
//  return result;
//}

void mousePressed(){
  redraw();
}

void setup(){
  size(400,400); //<>//
  noLoop();
  tiles = new PImage[TILE_AMOUNT];
  //grid = new Integer[DIM*DIM][TILE_AMOUNT];
  grid = new ArrayList[DIM*DIM];
  
  rules = new ArrayList[TILE_AMOUNT][4];
  
  for(int i = 0; i < TILE_AMOUNT; i++){
    for(int j = 0; j < 4; j++){
      rules[i][j] = new ArrayList<Integer>();
    }
  }
  //blank 0 - up 1 - right 2 - down 3 - left 4
  //create rules of each tile
  rules[0][0].add(0);
  rules[0][0].add(1);
  
  rules[0][1].add(0);
  rules[0][1].add(2);
  
  rules[0][2].add(0);
  rules[0][2].add(3);
  
  rules[0][3].add(0);
  rules[0][3].add(4);

  rules[1][0].add(2);
  rules[1][0].add(3);
  rules[1][0].add(4);
  
  rules[1][1].add(1);
  rules[1][1].add(3);
  rules[1][1].add(4);
  
  rules[1][2].add(0);
  rules[1][2].add(3);
  
  rules[1][3].add(1);
  rules[1][3].add(2);
  rules[1][3].add(3);
  
  rules[2][0].add(2);
  rules[2][0].add(3);
  rules[2][0].add(4);
  
  rules[2][1].add(1);
  rules[2][1].add(3);
  rules[2][1].add(4);
  
  rules[2][2].add(1);
  rules[2][2].add(2);
  rules[2][2].add(4);
  
  rules[2][3].add(0);
  rules[2][3].add(4);
  
  rules[3][0].add(0);
  rules[3][0].add(1);
  
  rules[3][1].add(1);
  rules[3][1].add(3);
  rules[3][1].add(4);
  
  rules[3][2].add(1);
  rules[3][2].add(2);
  rules[3][2].add(4);
  
  rules[3][3].add(1);
  rules[3][3].add(2);
  rules[3][3].add(3);

  rules[4][0].add(2);
  rules[4][0].add(3);
  rules[4][0].add(4);
  
  rules[4][1].add(0);
  rules[4][1].add(2);
  
  rules[4][2].add(1);
  rules[4][2].add(2);
  rules[4][2].add(4);
  
  rules[4][3].add(1);
  rules[4][3].add(2);
  rules[4][3].add(3);
 
   
  //load images
  tiles[0] = loadImage("tiles/blank.png");
  tiles[1] = loadImage("tiles/up.png");
  tiles[2] = loadImage("tiles/right.png");
  tiles[3] = loadImage("tiles/down.png");
  tiles[4] = loadImage("tiles/left.png");
  
  //init each grid position to have every possible option
  for(int i = 0; i < DIM*DIM; i++){
    //for(int j = 0; j < TILE_AMOUNT; j++){
    //  grid[i][j] = j;
    //}
    grid[i] = new ArrayList<Integer>();
    for(int j = 0; j < TILE_AMOUNT; j++){
      grid[i].add(j);
    }
  }
  
  //grid[2].remove(0);
  //grid[2].remove(0);
  //grid[2].remove(0);
  //grid[3].remove(0);
  //grid[3].remove(0);
  //grid[3].remove(0);
  
  //grid[0][0] = -1;
  //grid[0][1] = 2;
  //grid[0][2] = -1;
  //grid[0][3] = -1;
  //grid[0][4] = -1;
  
}


void checkValid(int index, int direction, int otherDirection, ArrayList<Integer> otherTile){
  ////print("cell");
  //printArray(grid[index]);
  
  ArrayList<Integer> keepTiles = new ArrayList<Integer>();
  for(int possibleTiles: grid[index]){
    for(int rule: rules[possibleTiles][direction]){
      if(
    }
  }
  //for(int otherPossible: otherTile){
  //  for(int possible: grid[index]){
  //    for(int rule: rules[otherPossible][otherDirection]){
  //      //need to check rules of both tiles not just opposite
  //      if(rules[possible][direction].contains(rule) && !keepTiles.contains(rule)){
  //        keepTiles.add(rule);
  //      }
  //    }
  //  }
  //}
  
  //println("Index:", index);
  //println("direction:", direction);
  //print("Other Tile: ");
  //printArray(otherTile);
  //print("Keep Tile: ");
  //printArray(keepTiles);
  
  for(int  i = grid[index].size() - 1; i >= 0; i--){
    if(!keepTiles.contains(i)){
      grid[index].remove(Integer.valueOf(i));
    }
  }
  //print("cell");
  //printArray(grid[index]);
  
  //for(int i = 0; i <grid[index].size(); i++ ){
  //  int possibleTile = grid[index].get(i);
  //  ////println(possibleTile,rules[possibleTile][direction]);
  //  for(int rule : rules[possibleTile][direction]){
  //    for(int j = 0; j < otherTile.size(); j++){
  //      if(rule != otherTile.get(j)){
  //        removeTiles.add(otherTile.get(j));
  //      }
  //    }
  //  }
  //}
  //if(removeTiles.size() > 0){
  //  //println(index,direction,otherTile,removeTiles);
  //  for(int remove : removeTiles){
  //    otherTile.remove(Integer.valueOf(remove));
  //  }
  //}
}

void draw(){
  background(0);
  
  //println("------------");
  //println("Current Grid");
  //printArray(grid);
  
  //order cells by entropy
  ArrayList<Integer>[] gridCopy = grid.clone();
  for (int i = 0; i <gridCopy.length; i++) {     
    for (int j = i+1; j <gridCopy.length; j++) {     
      if(gridCopy[i].size() > gridCopy[j].size()) {  
         ArrayList<Integer> temp = gridCopy[i];    
         gridCopy[i] = gridCopy[j];    
         gridCopy[j] = temp;    
       }     
    }     
  } 
  
  ////println("Ordered Grid");
  ////printArray(gridCopy);
  
  //get smallest entropy elements
  int len = 0;
  int startIndex = 0;
  int endIndex = gridCopy.length;
  
  for(int i = 0; i < gridCopy.length; i++){
    if(gridCopy[i].size() > 1){
      len = gridCopy[i].size();
      startIndex = i;
      break;
    }
  }
  ////println("Length:", len);
  ////println("startIndex:", startIndex);
  
  for(int i = startIndex; i < gridCopy.length; i++){
    if(gridCopy[i].size() > len){
      endIndex = i;
      break;
    }
  }
  
  ////println("endIndex:", endIndex);
  
  ArrayList<ArrayList> smallestEntropy = new ArrayList<ArrayList>(); 
  
  for(int i = startIndex; i < endIndex; i++){
    smallestEntropy.add(gridCopy[i]);
  }
  
  ////println("Smallest guys");
  ////printArray(smallestEntropy);
  
  //get a random cell with small entropy
  if(smallestEntropy.size() > 0){
    ArrayList<Integer> randomCell = smallestEntropy.get(floor(random(0,smallestEntropy.size())));
    //pick a random tile of the options
    int pick = randomCell.get(floor(random(0,randomCell.size())));
    randomCell.clear();
    randomCell.add(pick);
  }
   
  //println("Random Collapse Grid");
  //printArray(grid);
   
  //draw a tile if it is collapsed
  int w = width / DIM;
  int h = height / DIM;
  for(int i = 0; i < DIM; i++){
    for(int j = 0; j < DIM; j++){
      ArrayList<Integer> cell = grid[j + i * DIM];
      
      //int[] entropy = getEntropy(cell);
      //int index = entropy[1];
      
      //cell is collapsed
      if(cell.size() == 1){
        //get image index
        int index = cell.get(0);
        image(tiles[index], j * w, i * h,w,h );
      }
      //if cell is not
      else{
        fill(0);
        stroke(255);
        rect(j * w, i * h, w, h);
      }
    }
  }
  
  
  //next generation of tiles
  ArrayList<Integer>[] nextGrid = new ArrayList[DIM*DIM];
  for(int j = 0; j < DIM; j++){
    for(int i = 0; i < DIM; i++){
      int index = j + i * DIM;
      //if collapsed, remain the same
      if(grid[index].size() == 1){
        nextGrid[index] = grid[index];
      }
      //if not collapsed
      else{
        //look up
        if(j > 0){
          ArrayList<Integer> upTile = grid[i + (j - 1) * DIM];
          checkValid(index, 0, 2, upTile);
        }
        //look right
        if(i < DIM - 1){
          ArrayList<Integer> upTile = grid[i + 1 + j * DIM];
          checkValid(index, 1, 3, upTile);        
        }
        //look down
        if(j < DIM - 1){
          ArrayList<Integer> upTile = grid[i + (j + 1) * DIM];
          checkValid(index, 2, 0, upTile);        
        }        
        //look left
        if(i > 0){
          ArrayList<Integer> upTile = grid[i - 1 + j * DIM];
          checkValid(index, 3, 1, upTile);        
        }
        nextGrid[index] = grid[index];
      }
    }
  }
  grid = nextGrid;
  //println("Next Generation Grid");
  //printArray(grid);
}
