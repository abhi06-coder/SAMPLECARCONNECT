import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBqLF8HlQnw478t7thS-NPQQrMh8kGcI_A",
    authDomain: "carconnect-626e4.firebaseapp.com",
    projectId: "carconnect-626e4",
    storageBucket: "carconnect-626e4.firebasestorage.app",
    messagingSenderId: "229444731664",
    appId: "1:229444731664:web:5b099477141e42a15f5b95",
    measurementId: "G-T3JXHMQPYK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
