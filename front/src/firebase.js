// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBzVuc8X-JZ4xovffJVoyyGyjJ-LSyIw7s",
  authDomain: "pixel-20bc6.firebaseapp.com",
  projectId: "pixel-20bc6",
  storageBucket: "pixel-20bc6.appspot.com",
  messagingSenderId: "348664887318",
  appId: "1:348664887318:web:fa8e44a723e22f01a4dd37",
  measurementId: "G-0G1F1HD5ET"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db};