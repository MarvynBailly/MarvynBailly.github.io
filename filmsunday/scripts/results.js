//Javascript for results

// Get a reference to the votes div
const votesDiv = document.getElementById('votes');

// Get a reference to the chart canvas
const chartCanvas = document.getElementById('chart');

// Create the chart
const chart = new Chart(chartCanvas, {
  type: 'pie',
  data: {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: []
    }]
  },
  options: {
    legend: {
      position: 'bottom',
    },
    maintainAspectRatio: false,
    responsive: true,
  }
});

// Fetch the list of votes from the database
firebase.database().ref('votes').once('value', snapshot => {
  // Keep track of the number of votes for each film
  const votes = {};

  // Loop through the votes
  snapshot.forEach(vote => {
    // Get the film IDs
    const films = vote.val().films;

    // Loop through the films
    films.forEach(filmId => {
      // Increment the vote count for this film
      if (votes[filmId]) {
        votes[filmId]++;
      } else {
        votes[filmId] = 1;
      }
    });
  });

  // Get the list of submissions
  firebase.database().ref('submissions').once('value', snapshot => {
    // Create an array of films
    const films = [];

    // Loop through the submissions
    snapshot.forEach(submission => {
      // Get the submission data
      const id = submission.key;
      const title = submission.val().title;
      const color = getRandomColor();

      // Add the film to the array
      films.push({
        id,
        title,
        color,
        votes: votes[id] || 0
      });
    });

    // Sort the films by votes
    films.sort((a, b) => b.votes - a.votes);

    // Loop through the sorted films
    films.forEach(film => {
      // Add the film to the chart
      chart.data.labels.push(film.title);
      chart.data.datasets[0].data.push(film.votes);
      chart.data.datasets[0].backgroundColor.push(film.color);
      // Add the votes to the list
      const voteDiv = document.createElement('div');
      voteDiv.classList.add('vote');
      voteDiv.innerHTML = `<span class="film" style="color: ${film.color}">${film.title}</span>: ${film.votes} votes`;
      votesDiv.appendChild(voteDiv);
    });

    // Update the chart
    chart.update();
  });
});



  // Get a reference to the voter statistics container and voter list container
  const voterStatistics = document.getElementById('voter-statistics');
  const voterList = document.getElementById('voter-list');

  // Use the once() method to get a snapshot of the votes in the database
  firebase.database().ref('votes').once('value')
    .then((snapshot) => {
      // Get the votes from the snapshot
      const votes = snapshot.val();

      // Initialize the total number of voters and total number of votes to 0
      let totalVoters = 0;
      let totalVotes = 0;

      // Iterate through the votes and add a list item for each voter
      for (const voterId in votes) {
        const voter = votes[voterId];
        const li = document.createElement('li');
        li.innerHTML = `${voter.name}: ${voter.films.join(', ')}`;
        voterList.appendChild(li);

        // Increment the total number of voters and total number of votes
        totalVoters += 1;
        totalVotes += voter.films.length;
      }

      // Update the voter statistics with the total number of voters and total number of votes
      voterStatistics.querySelector('#total-voters').innerHTML = totalVoters;
      voterStatistics.querySelector('#total-votes').innerHTML = totalVotes;
    

  // Use the once() method to get a snapshot of the submissions in the database
  firebase.database().ref('submissions').once('value')
    .then((snapshot) => {
      // Get the submissions from the snapshot
      const submissions = snapshot.val();

      // Create an object to store the film names keyed by their IDs
      const filmNames = {};

      // Iterate through the submissions and store the film names
      for (const filmId in submissions) {
        const film = submissions[filmId];
        filmNames[filmId] = film.title;
      }

      // Iterate through the list items and update the film names
      voterList.querySelectorAll('li').forEach((li) => {
        // Split the text by the colon
        const [voterName, filmIds] = li.innerHTML.split(':');
        // Split the film IDs by the comma and map them to the corresponding film names
        const filmName = filmIds.split(',').map(filmId => filmNames[filmId.trim()]);
        // Update the list item with the film names
        li.innerHTML = `${voterName}: ${filmName.join(', ')}`;
        });
        }).catch((error) => {
          // If there was an error, display an error message
          alert(`Error retrieving submissions: ${error.message}`);
          })
      })
      .catch((error) => {
        // If there was an error, display an error message
        alert(`Error retrieving votes: ${error.message}`);
      });