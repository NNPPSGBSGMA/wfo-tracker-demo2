// JavaScript Document// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJH99zuNvwzHmF8gq2eXJ_mskNIsw500Q",
  authDomain: "wfo-attendance-tracker.firebaseapp.com",
  databaseURL: "https://wfo-attendance-tracker-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wfo-attendance-tracker",
  storageBucket: "wfo-attendance-tracker.firebasestorage.app",
  messagingSenderId: "354601551996",
  appId: "1:354601551996:web:23b9cc586a2801bd45e1f9",
  measurementId: "G-BH9YD7Y1FD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);