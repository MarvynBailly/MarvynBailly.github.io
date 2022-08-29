var currentKey;

function databaseInit(){
  const firebaseConfig = {
    apiKey: "AIzaSyAAIomxXli_oTJ4bfO_XN-bdtEOgJ_1yJA",
    authDomain: "pewpew-leaderboard.firebaseapp.com",
    projectId: "pewpew-leaderboard",
    storageBucket: "pewpew-leaderboard.appspot.com",
    messagingSenderId: "72769174485",
    appId: "1:72769174485:web:c76888aff1e5514a3f5b5c",
    measurementId: "G-Y0E0WMBPLQ",
    databaseURL: "https://pewpew-leaderboard-default-rtdb.firebaseio.com/"
  };
  
  // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);
  database = firebase.database();
  ref = database.ref('scores');
  
}

//submit score when submit button is pressed
function submitScore(){
  var data = {
    name:initUsername.value(),
    score:score
  }
  ref.push(data);
  
  //hide to prevent multiple entries
  submitButton.hide();
  initUsername.hide();
}

function showData(){
  ref.on('value',gotData,gotError);
}

//draw leaderboard
function displayData(data,showLimit){
  //get top scores
  sortedData = data.sort(compareSecondColumn).reverse();
  topSortedData = sortedData.slice(0,showLimit);
  
  //draw 

  let x = width/2-100;
  let y = height/2 - 80;
  let size = 20;
  
  noStroke();
  fill(255);
  rect(x,y,200,showLimit*size)
  for(let i = 0; i<showLimit; i++){
    stroke(0);
    fill(255);
    rect(x,y+i*size,200,size);
    fill(0);
    textSize(12);
    text((i+1)+": "+floor(data[i][1])+"-"+data[i][0],x,y+i*size+(size-5));
  }
}

//fancy sorting
function compareSecondColumn(a, b) {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] < b[1]) ? -1 : 1;
    }
}

//get data
function gotData(data){
  //console.log(data.val())
  let firebaseData = [];
  var entries = data.val();
  var keys = Object.keys(entries);
  for(var i = 0; i < keys.length; i ++){
    var k = keys[i];
    let username = entries[k].name;
    let score = entries[k].score;
    firebaseData[i] = [username,score]
  }
  displayData(firebaseData,5)
}

//in case of error
function gotError(err){
  console.log(err)
}
