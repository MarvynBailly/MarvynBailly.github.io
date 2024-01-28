// JavaScript for handling the film submission form
document.addEventListener('DOMContentLoaded', () => {
  

    // Get a reference to the form element
    const form = document.querySelector('#film-form');
  
    // Add an event listener for the submit event
    form.addEventListener('submit', event => {
      // Prevent the default form submission behavior
      event.preventDefault();
      
      //make sure that the required boxes have been filled 
      var title = document.getElementById("title").value;
      var name = document.getElementById("name").value.toLowerCase();

      if (title == "" || name == "") {
        alert("Please fill in all mandatory fields.");
        if (title == "") {
          document.getElementById("title").style.borderColor = "red";
        }
        if (name == "") {
          document.getElementById("name").style.borderColor = "red";
        }
        return;
      }
      
      // Get the form data
      const data = new FormData(form);
      
      // Submit the form data to the database
      firebase.database().ref('waitlist').push({
        title: data.get('title'),
        year: form.year.value,
        youtubeLink: form.youtubeLink.value,
        imdbLink: form.imdbLink.value,
        comment: form.comment.value,
        name: form.name.value.toLowerCase()
      });

      // Show a success message to the user
      const successMessage = document.createElement('p');
      successMessage.textContent = `Your film idea has been submitted for "film-verification."`;
      successMessage.style.color = 'green';
      form.appendChild(successMessage);
  
      // Clear the form fields
      form.reset();  
    });
  });