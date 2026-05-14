import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  ref,
  set,
  push,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* =======================
   ELEMENTS
======================= */

const authPage = document.getElementById("authPage");
const chatApp = document.getElementById("chatApp");

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const usersList = document.getElementById("usersList");
const messagesDiv = document.getElementById("messages");

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const chatUsername = document.getElementById("chatUsername");
const searchInput = document.getElementById("searchInput");

/* =======================
   GLOBAL STATE
======================= */

let currentUser = null;
let currentChatUser = null;
let currentMessagesRef = null;

/* =======================
   SIGN UP
======================= */

signupBtn.onclick = async () => {

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !email || !password) {
    alert("Fill all fields");
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    await set(ref(db, "users/" + userCred.user.uid), {
      uid: userCred.user.uid,
      username,
      email
    });

    alert("Account Created");
  } catch (err) {
    alert(err.message);
  }
};

/* =======================
   LOGIN
======================= */

loginBtn.onclick = async () => {

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    alert(err.message);
  }
};

/* =======================
   AUTH STATE
======================= */

onAuthStateChanged(auth, (user) => {

  if (user) {

    currentUser = user;

    authPage.style.display = "none";
    chatApp.style.display = "flex";

    loadUsers();

  } else {

    currentUser = null;

    authPage.style.display = "flex";
    chatApp.style.display = "none";
  }
});

/* =======================
   LOAD USERS (HIDDEN BY DEFAULT)
======================= */

function loadUsers() {

  const usersRef = ref(db, "users");

  onValue(usersRef, (snapshot) => {

    usersList.innerHTML = "";

    const data = snapshot.val();

    if (!data) return;

    Object.values(data).forEach((user) => {

      if (user.uid === currentUser.uid) return;

      const div = document.createElement("div");
      div.className = "user";

      div.style.display = "none"; // ❌ hidden by default

      div.innerHTML = `<b>${user.username}</b>`;

      div.onclick = () => {

        currentChatUser = user;
        chatUsername.innerText = user.username;

        loadMessages();

      };

      usersList.appendChild(div);
    });
  });
}

/* =======================
   SEARCH USERS (ONLY SHOW WHEN TYPING)
======================= */

searchInput.oninput = () => {

  const value = searchInput.value.trim().toLowerCase();

  const users = document.querySelectorAll(".user");

  users.forEach((u) => {

    const text = u.innerText.toLowerCase();

    if (value === "") {
      u.style.display = "none";
    } else if (text.includes(value)) {
      u.style.display = "block";
    } else {
      u.style.display = "none";
    }
  });
};

/* =======================
   CHAT ID
======================= */

function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

/* =======================
   SEND MESSAGE
======================= */

sendBtn.onclick = async () => {

  if (!currentChatUser) {
    alert("Select user first");
    return;
  }

  const text = messageInput.value.trim();

  if (!text) return;

  const chatId = getChatId(currentUser.uid, currentChatUser.uid);

  const messagesRef = ref(db, "messages/" + chatId);

  const now = new Date();

  await push(messagesRef, {

    text,
    sender: currentUser.uid,

    time: now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }),

    date: now.toLocaleDateString(),

    timestamp: Date.now()
  });

  /* save last chat */
  await set(ref(db, "lastChats/" + chatId), {

    users: [currentUser.uid, currentChatUser.uid],
    lastMessage: text,
    time: Date.now()
  });

  messageInput.value = "";
};

/* =======================
   LOAD MESSAGES
======================= */

function loadMessages() {

  if (currentMessagesRef) {
    currentMessagesRef = null;
  }

  const chatId = getChatId(currentUser.uid, currentChatUser.uid);

  const messagesRef = ref(db, "messages/" + chatId);

  currentMessagesRef = messagesRef;

  onValue(messagesRef, (snapshot) => {

    messagesDiv.innerHTML = "";

    const data = snapshot.val();

    if (!data) return;

    Object.values(data).forEach((msg) => {

      const div = document.createElement("div");
      div.className = "message";

      if (msg.sender === currentUser.uid) {
        div.classList.add("me");
      } else {
        div.classList.add("other");
      }

      div.innerHTML = `
        ${msg.text}
        <div class="time">${msg.time}</div>
      `;

      messagesDiv.appendChild(div);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

/* =======================
   LOGOUT
======================= */

logoutBtn.onclick = () => {
  signOut(auth);
};
