import { auth, db } from "./firebase.js";

import {

  createUserWithEmailAndPassword,

  signInWithEmailAndPassword,

  onAuthStateChanged,

  signOut

} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {

  ref,

  set,

  push,

  onValue,

  get

} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ELEMENTS */

const authPage =
  document.getElementById("authPage");

const chatApp =
  document.getElementById("chatApp");

const signupBtn =
  document.getElementById("signupBtn");

const loginBtn =
  document.getElementById("loginBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const usersList =
  document.getElementById("usersList");

const sendBtn =
  document.getElementById("sendBtn");

const messages =
  document.getElementById("messages");

const messageInput =
  document.getElementById("messageInput");

const chatUsername =
  document.getElementById("chatUsername");

const searchInput =
  document.getElementById("searchInput");

/* GLOBAL */

let currentChatUser = null;

/* SIGNUP */

signupBtn.onclick = async ()=>{

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

    await set(
      ref(db, "users/" + userCred.user.uid),
      {

        uid:userCred.user.uid,

        username,

        email
      }
    );

    alert("Account created!");

  }catch(err){

    alert(err.message);
  }
};

/* LOGIN */

loginBtn.onclick = async ()=>{

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

/* AUTH */

onAuthStateChanged(auth, (user)=>{

  if(user){

    authPage.style.display = "none";

    chatApp.style.display = "flex";

    loadUsers();

  }else{

    authPage.style.display = "flex";

    chatApp.style.display = "none";
  }
});

/* LOAD USERS */

function loadUsers(){

  const usersRef = ref(db, "users");

  onValue(usersRef, async(snapshot)=>{

    usersList.innerHTML = "";

    const data = snapshot.val();

    for(let uid in data){

      if(uid === auth.currentUser.uid)
        continue;

      const user = data[uid];

      const div =
        document.createElement("div");

      div.classList.add("user");

      div.innerHTML = `
        <b>${user.username}</b>
      `;

      div.onclick = ()=>{

        currentChatUser = user;

        chatUsername.innerText =
          user.username;

        loadMessages();
      };

      usersList.appendChild(div);
    }
  });
}

/* CHAT ID */

function getChatId(uid1, uid2){

  return [uid1, uid2].sort().join("_");
}

/* SEND */

sendBtn.onclick = async ()=>{

  if(!currentChatUser) return;

  const text =
    messageInput.value;

  if(text.trim() === "")
    return;

  const chatId = getChatId(

    auth.currentUser.uid,

    currentChatUser.uid
  );

  const messagesRef =
    ref(db, "messages/" + chatId);

  const now = new Date();

  await push(messagesRef, {

    text,

    sender: auth.currentUser.uid,

    time:
      now.toLocaleTimeString(),

    date:
      now.toLocaleDateString(),

    timestamp: Date.now()
  });

  messageInput.value = "";
};

/* LOAD MESSAGES */

function loadMessages(){

  const chatId = getChatId(

    auth.currentUser.uid,

    currentChatUser.uid
  );

  const messagesRef =
    ref(db, "messages/" + chatId);

  onValue(messagesRef, async(snapshot)=>{

    messages.innerHTML = "";

    const data = snapshot.val();

    for(let id in data){

      const msg = data[id];

      const div =
        document.createElement("div");

      div.classList.add("message");

      if(
        msg.sender === auth.currentUser.uid
      ){

        div.classList.add("me");

      }else{

        div.classList.add("other");
      }

      div.innerHTML = `

        ${msg.text}

        <div class="time">

          ${msg.time}
          <br>
          ${msg.date}

        </div>
      `;

      messages.appendChild(div);
    }

    messages.scrollTop =
      messages.scrollHeight;
  });
}

/* SEARCH */

searchInput.oninput = ()=>{

  const value =
    searchInput.value.toLowerCase();

  const users =
    document.querySelectorAll(".user");

  users.forEach((user)=>{

    if(
      user.innerText
      .toLowerCase()
      .includes(value)
    ){

      user.style.display = "block";

    }else{

      user.style.display = "none";
    }
  });
};

/* LOGOUT */

logoutBtn.onclick = ()=>{

  signOut(auth);
};
