// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ========================= */
/* FIREBASE CONFIG */
/* ========================= */

const firebaseConfig = {

  apiKey: "AIzaSyCwWRmlOFseHZcTiPR_kCrPtzTlYmLQDD8",

  authDomain:
    "chat-chatgpt-e563b.firebaseapp.com",

  databaseURL:
    "https://chat-chatgpt-e563b-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId:
    "chat-chatgpt-e563b",

  storageBucket:
    "chat-chatgpt-e563b.firebasestorage.app",

  messagingSenderId:
    "723794240056",

  appId:
    "1:723794240056:web:804e87524c21ec470bfccd"

};

/* ========================= */
/* INITIALIZE */
/* ========================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

/* ========================= */
/* EXPORTS */
/* ========================= */

export {
  auth,
  db
};
