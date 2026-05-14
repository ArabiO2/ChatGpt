import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ELEMENTS */

const authBox = document.getElementById("authBox");
const chatPage = document.getElementById("chatPage");

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");

const logoutBtn = document.getElementById("logoutBtn");

const sendBtn = document.getElementById("sendBtn");

const messagesDiv = document.getElementById("messages");

/* SIGN UP */

signupBtn.onclick = async () => {

  const username =
    document.getElementById("username").value;

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  try{

    const userCred =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    await setDoc(
      doc(db, "users", userCred.user.uid),
      {
        username,
        email,
        uid:userCred.user.uid
      }
    );

    alert("Account created!");

  }catch(err){
    alert(err.message);
  }
};

/* LOGIN */

loginBtn.onclick = async () => {

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  try{

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  }catch(err){
    alert(err.message);
  }
};

/* AUTH STATE */

onAuthStateChanged(auth, (user)=>{

  if(user){

    authBox.style.display = "none";

    chatPage.style.display = "flex";

    loadMessages();

  }else{

    authBox.style.display = "flex";

    chatPage.style.display = "none";
  }
});

/* SEND MESSAGE */

sendBtn.onclick = async ()=>{

  const text =
    document.getElementById("messageInput").value;

  if(text.trim() === "") return;

  await addDoc(collection(db, "messages"), {

    text,

    uid: auth.currentUser.uid,

    email: auth.currentUser.email,

    createdAt: serverTimestamp()

  });

  document.getElementById("messageInput").value = "";
};

/* LOAD MESSAGES */

function loadMessages(){

  const q = query(
    collection(db, "messages"),
    orderBy("createdAt")
  );

  onSnapshot(q, (snapshot)=>{

    messagesDiv.innerHTML = "";

    snapshot.forEach((doc)=>{

      const msg = doc.data();

      const div = document.createElement("div");

      div.classList.add("message");

      if(msg.uid === auth.currentUser.uid){

        div.classList.add("me");

      }else{

        div.classList.add("other");
      }

      div.innerHTML = `
        <b>${msg.email}</b><br>
        ${msg.text}
      `;

      messagesDiv.appendChild(div);
    });

    messagesDiv.scrollTop =
      messagesDiv.scrollHeight;
  });
}

/* LOGOUT */

logoutBtn.onclick = ()=>{

  signOut(auth);
};
