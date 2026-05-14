import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getAuth } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getFirestore } from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCwWRmlOFseHZcTiPR_kCrPtzTlYmLQDD8",
  authDomain: "chat-chatgpt-e563b.firebaseapp.com",
  databaseURL: "https://chat-chatgpt-e563b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chat-chatgpt-e563b",
  storageBucket: "chat-chatgpt-e563b.firebasestorage.app",
  messagingSenderId: "723794240056",
  appId: "1:723794240056:web:804e87524c21ec470bfccd"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
