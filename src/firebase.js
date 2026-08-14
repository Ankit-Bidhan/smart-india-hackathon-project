// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBq_h0r0ANT4Bqv6o90MR_EyVorOjstcI0",
    authDomain: "travelease-ai-71032.firebaseapp.com",
    projectId: "travelease-ai-71032",
    storageBucket: "travelease-ai-71032.firebasestorage.app",
    messagingSenderId: "299181293224",
    appId: "1:299181293224:web:70fa48007420e74f718c9d",
    measurementId: "G-ZBEPP85JQN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export{ auth, db };