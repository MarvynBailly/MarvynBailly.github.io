function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBRg-m5hB92lxAlY4adzWD1iUOKYV481-g",
  authDomain: "film-sunday.firebaseapp.com",
  databaseURL: "https://film-sunday-default-rtdb.firebaseio.com",
  projectId: "film-sunday",
  storageBucket: "film-sunday.appspot.com",
  messagingSenderId: "883932192394",
  appId: "1:883932192394:web:e5562985d1ac1aebf0d773",
  measurementId: "G-R54KTHYDPX"
};

firebase.initializeApp(firebaseConfig);
// Get a reference to the Firebase Realtime Database
const database = firebase.database();

// JavaScript for adding fancy old-timey styling to the home page
document.addEventListener('DOMContentLoaded', () => {
  // Add a vintage font to the body element
  document.body.style.fontFamily = '"Great Vibes"';

  // Add a border around the navigation menu
  const nav = document.querySelector('nav');
  nav.style.border = '4px solid #ddd';
});