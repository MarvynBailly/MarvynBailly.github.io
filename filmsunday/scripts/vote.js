
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
        const title = submission.val().title;
        filmList.innerHTML += `
          <div class="film">
            <input type="checkbox" id="${id}" name="films" value="${id}">
            <label for="${id}">${title}</label>
          </div>
        `;
      });
    
    // Handle form submission
    form.addEventListener('submit', e => {
      // Prevent the form from submitting
      e.preventDefault();
    
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
      successMessage.textContent = 'Your votes have been submitted successfully!';
      successMessage.style.color = 'green';
      form.appendChild(successMessage);
    
      // Clear the form fields
      form.reset();
    
      // Clear the form
      form.reset();
    })})});
    
    