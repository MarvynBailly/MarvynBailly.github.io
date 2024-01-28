//admin code
// Add an event listener for the keydown event
document.addEventListener('keydown', (event) => {
    // Check if the key pressed was the `~` key
    if (event.key === '`') {
      // If the `~` key was pressed, show the secret button
      document.getElementById('admin-form').style.display = 'flex';
    }
  });
  
  const form = document.getElementById('admin-form');
  const adminTab = document.getElementById('admin-code');
  
  form.addEventListener('submit', event => {
    // Prevent the form from submitting
    event.preventDefault();
  
    // Get the secret code from the input field
    const code = form.elements['admin-code'].value;
  
    // Check the secret code
    if (code === 'test') {
      // Show the "admin" tab
      document.getElementById('admin-menu').style.display = 'block';
    } else {
      // Show an error message
      alert('Invalid secret code');
    }
  });

  // Add an event listener for the click event on the reset votes button
  const resetVotesButton = document.getElementById('reset-votes-button');
  // Get a reference to the Firebase Realtime Database
  //const database = firebase.database();
  // Get a reference to the votes node in the database
  const votesRef = database.ref('votes');

  resetVotesButton.addEventListener('click', () => {
    // Reset the votes using your Firebase code here
    votesRef.remove()
    .then(() => {
      // If the remove operation was successful, display a success message
      alert('Votes reset successfully');
    })
    .catch((error) => {
      // If there was an error, display an error message
      alert(`Error resetting votes: ${error.message}`);
    });
  });




  //vote page on
  const votePageOnButton = document.getElementById('vote-page-on-button');
  votePageOnButton.addEventListener('click', () => {
    database.ref('votingStatus').set('on');
    alert(`Voting is now open`);
  });

  //vote page off
  const votePageOffButton = document.getElementById('vote-page-off-button');
  votePageOffButton.addEventListener('click', () => {
    database.ref('votingStatus').set('off');
    alert(`Voting is now closed`);
  });



  // Get a reference to the film list drop-down and delete film button
  const filmList = document.getElementById('film-list');
  const deleteFilmButton = document.getElementById('delete-film-button');

  //add an event listener for the click event on the select winner button
  const winnerButton = document.getElementById('select-winner-button');
  winnerButton.addEventListener('click', () => {
    const dbRef = firebase.database().ref();
    const selectedFilm = filmList.value;
    const childRef = dbRef.child(`submissions/${selectedFilm}`); // Reference to the child node you want to move

    childRef.once('value', function(snapshot) {
      const data = snapshot.val(); // Get the data of the child node
      const newRef = dbRef.child(`winners/${selectedFilm}`); // Reference to the new parent node

      newRef.update(data, function(error) {
        if (error) {
          alert('Error moving child:');
          console.log(error)
        } else {
          alert('Child moved successfully.');
          childRef.remove(); // Remove the child node from its old parent node
        }
      });
  });



  });

  // Add an event listener for the click event on the delete film button
  deleteFilmButton.addEventListener('click', () => {
    // Get the value of the selected film
    const selectedFilm = filmList.value;

    // Use the remove() method to delete the selected film from the database
    firebase.database().ref(`submissions/${selectedFilm}`).remove()
      .then(() => {
        // If the remove operation was successful, display a success message
        alert('Film deleted successfully');
      })
      .catch((error) => {
        // If there was an error, display an error message
        alert(`Error deleting film: ${error.message}`);
      });
  });

// Use the once() method to get a snapshot of the films in the database
firebase.database().ref('submissions').once('value')
.then((snapshot) => {
  // Get the films from the snapshot
  const films = snapshot.val();

  // Iterate through the films and add an option for each film
  for (const filmId in films) {
    const film = films[filmId];
    const option = document.createElement('option');
    option.value = filmId;
    option.innerHTML = film.title;
    filmList.appendChild(option);
  }
})
.catch((error) => {
  // If there was an error, display an error message
  alert(`Error retrieving films: ${error.message}`);
});




// Reference to the new waitlist drop-down
const waitlistFilmList = document.getElementById('waitlist');


// Use the once() method to get a snapshot of the films in the database
firebase.database().ref('waitlist').once('value')
.then((snapshot) => {
  // Get the films from the snapshot
  const films = snapshot.val();

  // Iterate through the films and add an option for each film
  for (const filmId in films) {
    const film = films[filmId];
    const option = document.createElement('option');
    option.value = filmId;
    option.innerHTML = film.title;
    filmList.appendChild(option);
  }
})
.catch((error) => {
  // If there was an error, display an error message
  alert(`Error retrieving films: ${error.message}`);
});

// Reference to the 'Toggle Waitlist' button
const toggleWaitlistButton = document.getElementById('toggle-waitlist-button');

toggleWaitlistButton.addEventListener('click', () => {
  // Get the value of the selected film
  const selectedFilm = filmList.value;

  // First, check if the film is in 'submissions' or 'waitlist'
  firebase.database().ref(`submissions/${selectedFilm}`).once('value', submissionSnapshot => {
    if (submissionSnapshot.exists()) {
      // If the film is in 'submissions', move it to 'waitlist'
      moveFilm(selectedFilm, 'submissions', 'waitlist');
    } else {
      // If the film is not in 'submissions', assume it's in 'waitlist' and move it to 'submissions'
      moveFilm(selectedFilm, 'waitlist', 'submissions');
    }
  });
});

// Function to move a film between categories
function moveFilm(filmId, fromCategory, toCategory) {
  const fromRef = firebase.database().ref(`${fromCategory}/${filmId}`);
  const toRef = firebase.database().ref(`${toCategory}/${filmId}`);

  fromRef.once('value', snapshot => {
    const data = snapshot.val();
    toRef.set(data, error => {
      if (!error) {
        fromRef.remove()
          .then(() => alert(`Film moved from ${fromCategory} to ${toCategory}`))
          .catch(error => alert(`Error removing film: ${error.message}`));
      } else {
        alert(`Error moving film: ${error.message}`);
      }
    });
  });
}