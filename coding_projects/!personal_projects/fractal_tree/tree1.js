window.onload = function(){
  var t = function(tree){
    var x3;
    var y3;

    tree.setup = function() {
      var width = 400;
      var height = 400;
      canvas = tree.createCanvas(width,height);
      canvas.position(0,0);
      canvas.style('z-index','-1');
      tree.background(220,220,220);
      tree.stroke(0,0,0);
      tree.translate(width/2,height);
      tree.scale(1,-1)
      tree.drawTree(0,0,90,11,width,height);
      
    }  
 
    tree.drawTree = function(x1,y1,direction,length)  {
      if (length !== 0){
        var x2 = x1 + (length * tree.random(5,10) * tree.cos(direction));
        var y2 = y1 + (length * tree.random(5,10) * tree.sin(direction));
        
        tree.stroke(0,0,0);
        tree.strokeWeight(length);
        tree.line(x1,y1,x2,y2);
        
        x3 = x2;
        y3 = y2;
        
        tree.drawTree(x2,y2,direction-tree.random(10,40),length-1);
               tree.drawTree(x2,y2,direction+tree.random(10,40),length-1);
      }
    }
  };
var first_tree = new p5(t, 'first-tree-sketch');
<<<<<<< HEAD
=======
}

/// test stuff 
window.onload = function(){
  var t = function(tree){
    var x3;
    var y3;

    tree.setup = function() {
      var width = 400;
      var height = 400;
      canvas = tree.createCanvas(width,height);
      canvas.position(0,0);
      canvas.style('z-index','-1');
      tree.background(220,220,220);
      tree.stroke(0,0,0);
      tree.translate(width/2,height);
      tree.scale(1,-1)
      tree.drawTree(0,0,90,11);
      tree.angleMode(tree.DEGREES);
    }  
 
    tree.drawTree = function(x1,y1,direction,length)  {
      if (length !== 0){
        var x2 = x1 + (length * 5 * tree.cos(direction-.46));
        var y2 = y1 + (length * 5 * tree.sin(direction-.46));
        
        tree.stroke(0,0,0);
        tree.strokeWeight(length);
        tree.print(length,tree.cos(direction));
        tree.line(x1,y1,x2,y2);
        
        x3 = x2;
        y3 = y2;
        
        tree.drawTree(x2,y2,direction+25,length-1);
        tree.drawTree(x2,y2,direction-25,length-1);
      }
    }
  };
var first_tree = new p5(t, 'first-tree-sketch');
>>>>>>> 10ac905815ee42d9690d5ca4014d19634acf4226
}