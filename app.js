import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");

signupBtn.onclick = async () => {

  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    const userCred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await setDoc(doc(db, "users", userCred.user.uid), {
      username,
      email,
      uid: userCred.user.uid
    });

    alert("Account Created!");

  } catch(err){
    alert(err.message);
  }
};

loginBtn.onclick = async () => {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try{

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("Logged In!");

  } catch(err){
    alert(err.message);
  }
};
