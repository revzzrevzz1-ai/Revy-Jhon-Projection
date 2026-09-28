/* =========================================
   FIREBASE INITIALIZATION
   Place this file in the same folder as
   index.html, script.js, and welcome.js
========================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBhxcIyk-hYwhhOHG4DfOkZ9w3j01yoL0o",
  authDomain: "revy-jhon-website.firebaseapp.com",
  projectId: "revy-jhon-website",
  storageBucket: "revy-jhon-website.firebasestorage.app",
  messagingSenderId: "50769553530",
  appId: "1:50769553530:web:7c7e562f9e34877bde73c3"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

/* No auto-login here anymore. welcome.js now calls
   auth.signInWithEmailAndPassword() when the person
   submits the login form, so that the SAME account
   (same uid) is used whether they open the desktop
   app or the website. */
