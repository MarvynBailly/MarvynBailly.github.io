
function updateVoteTab(votingStatus) {
  if (votingStatus === 'on') {
    // Enable voting
    voteTurnOn();
  } else if (votingStatus === 'off') {
    // Disable voting
    voteTurnOff();
  }
}

function checkVotingStatus() {
  database.ref('votingStatus').once('value').then((snapshot) => {
    const votingStatus = snapshot.val();
    if (votingStatus === 'on') {
      // Enable voting
      voteTurnOn();
    } else if (votingStatus === 'off') {
      // Disable voting
      voteTurnOff();
    }
  });
}

function voteTurnOn(){
  document.getElementById('vote-form-on').style.display = 'block';
  document.getElementById('vote-form-off').style.display = 'none';
}

function voteTurnOff(){
  document.getElementById('vote-form-on').style.display = 'none';
  document.getElementById('vote-form-off').style.display = 'block';
}

//get current votingStatue
checkVotingStatus();

// Listen for changes to the "votingStatus" node
database.ref('votingStatus').on('value', (snapshot) => {
  const votingStatus = snapshot.val();
  updateVoteTab(votingStatus);
});

function toggleDetails(itemID){
  var detailsDiv = document.getElementById(`film-item-`+itemID);
  if (detailsDiv.style.display === 'none') {
    detailsDiv.style.display = 'block';
  } else {
    detailsDiv.style.display = 'none';
  }
}





// JavaSCript for handling the voting
document.addEventListener('DOMContentLoaded', () => {
    // Get a reference to the voting form
    const form = document.getElementById('vote-form-on');

    // Get a reference to the film list element
    const filmList = document.getElementById('film-list');
    
    // Fetch the list of submissions from the database
    firebase.database().ref('submissions').once('value', snapshot => {
      // Create a checkbox for each submission
      snapshot.forEach(submission => {
        const id = submission.key;
        
        // Create a new list item for the film
        var filmItem = document.createElement("div");
        //filmItem.className = "film";
        
        //Add the film title to the list item
        //var title = document.createElement("h2");
        //title.textContent = submission.val().title ;
        //filmItem.appendChild(title);

        // Add the film year
        if (submission.val().year) {
          var year = document.createElement("p");
          year.textContent = "The Film was released in " + submission.val().year+".";
          filmItem.appendChild(year);
        }

        // Add the YouTube Link
        if (submission.val().youtubeLink) {
          var trailerPlayer = document.createElement("div");
          trailerPlayer.className = "trailerPlayer";
          filmItem.appendChild(trailerPlayer);

          // Create the YouTube player
          var player = new YT.Player(trailerPlayer, {
            height: "500px",
            width: "100%",
            videoId: getYoutubeVideoId(submission.val().youtubeLink)
          });
        }

        // Add the IMDb Link
        if (submission.val().imdbLink) {
          var imdbLink = document.createElement("a");
          imdbLink.href = submission.val().imdbLink;
          imdbLink.textContent = "Link to the IMDb page for the film."
          imdbLink.style.display = "block";
          imdbLink.style.textAlign = "center";
          imdbLink.style.marginTop = "10px";
          filmItem.appendChild(imdbLink);
        }

        // Add the Comments
        if (submission.val().comment) {
          var comment = document.createElement("p");
          comment.textContent = "\""+submission.val().comment+`\" -`+submission.val().name;
          filmItem.appendChild(comment);
        }

        // Enter name
        var name = document.createElement("p");
        name.textContent = "Submitted by: " + submission.val().name;
        filmItem.appendChild(name);
        
        

        // filmList.innerHTML += `
        //   <div class="film">
        //     <label for="${id}">${submission.val().title}</label>
        //     <button onclick="toggleDetails('${id}')"> See more</button>
        //     <div class="film-item" id="film-item-${id}">
        //       ${filmItem.outerHTML}
        //     </div>
            
        //     <p style="margin-bottom: 10px"> Click to select vote</p>
        //     <input type="checkbox" id="${id}" name="films" value="${id}" class="film-checkbox">
        //   </div>
        // `;
        
        //filmList.appendChild(filmItem);
        filmList.innerHTML += `
        <div class="film">
          <label for="${id}">${submission.val().title}</label>
          <button class="details-button" data-id="${id}"> See more</button>
          <div class="film-item" id="film-item-${id}" style="display:none">
            ${filmItem.outerHTML}
          </div>
          <p style="margin-bottom: 10px"> Click to select vote</p>
          <input type="checkbox" id="${id}" name="films" value="${id}" class="film-checkbox">
        </div>
        `;
        document.querySelectorAll('.details-button').forEach(button => {
          button.addEventListener('click', function() {
            toggleDetails(this.getAttribute('data-id'));
          });
        });
      });
      

    // Attach click event listener to each button
    const buttons = form.querySelectorAll('button');
    var selectButton = null;
    buttons.forEach(button => {
      button.addEventListener('click', function(button) {
        // Set data-id attribute on clicked button
        selectButton = button.target.id
      });
    });

    // Handle form submission
    form.addEventListener('submit', e => {
      // Prevent the form from submitting
      e.preventDefault();

      if(selectButton != "submit-btn"){
        return;
      }

      // Get the user's name
      const name = form.name.value;
    
      // Get the selected films
      const films = [];
      const filmInputs = form.films;
      for (let i = 0; i < filmInputs.length; i++) {
        if (filmInputs[i].checked) {
          films.push(filmInputs[i].value);
        }
      }
    
      //Make sure the user has entered a name
      if(name == ''){
        alert('Please enter your name')
        return
      }
    
       // Make sure the user has selected at least 1 films
       if (films.length < 1) {
        alert('Please select at least 1 film to vote for');
        return;
      }
    
      // Make sure the user has selected at least 3 films
      if (films.length > 3) {
        alert('Please select at most 3 films to vote for');
        return;
      }
    
      // Save the vote to the database
      firebase.database().ref('votes').push({
        name: name,
        films: films
      });
    
      // Show a success message to the user
      const successMessage = document.createElement('p');
      successMessage.textContent = 'Your votes have been recorded!';
      successMessage.style.color = 'green';
      form.appendChild(successMessage);
    
      // Clear the form fields
      form.reset();
    
      // Clear the form
      form.reset();
    })})});
    


// Extracts the video ID from a YouTube link
function getYoutubeVideoId(url) {
  var videoId = "";
  var regex = /[?&]v=([^&#]*)/;
  var match = regex.exec(url);
  if (match) {
    videoId = match[1];
  }
  return videoId;
}
