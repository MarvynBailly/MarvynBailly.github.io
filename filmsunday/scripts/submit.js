// JavaScript for handling the film submission form
document.addEventListener('DOMContentLoaded', () => {
    // Get a reference to the form element
    const form = document.querySelector('#film-form');
  
    // Add an event listener for the submit event
    form.addEventListener('submit', event => {
      // Prevent the default form submission behavior
      event.preventDefault();
  
      // Get the form data
      const data = new FormData(form);
  
      // Submit the form data to the database
      firebase.database().ref('submissions').push({
        title: data.get('title')
      });
  
      // Show a success message to the user
      const successMessage = document.createElement('p');
      successMessage.textContent = 'Your film idea has been submitted successfully!';
      successMessage.style.color = 'green';
      form.appendChild(successMessage);
  
      // Clear the form fields
      form.reset();
    });
  });