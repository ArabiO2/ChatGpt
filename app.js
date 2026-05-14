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
  onValue,
  get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ELEMENTS */

const authPage = document.getElementById("authPage");
const chatApp = document.getElementById("chatApp");

const usersList = document.getElementById("usersList");
const messagesDiv = document.getElementById("messages");

const messageInput = document.getElementById("messageInput");
const imageInput = document.getElementById("imageInput");

const sendBtn = document.getElementById("sendBtn");

const searchInput = document.getElementById("searchInput");
const chatUsername = document.getElementById("chatUsername");

const logoutBtn = document.getElementById("logoutBtn");
const toggleSidebar = document.getElementById("toggleSidebar");

/* STATE */

let currentUser = null;
let currentChat = null;

/* TOGGLE SIDEBAR */

toggleSidebar.onclick = () => {
  document.querySelector(".sidebar").classList.toggle("hidden");
};

/* AUTH */

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    authPage.style.display = "none";
    chatApp.style.display = "flex";
    loadUsers();
  } else {
    authPage.style.display = "flex";
    chatApp.style.display = "none";
  }
});

/* USERS */

function loadUsers() {
  const usersRef = ref(db, "users");

  onValue(usersRef, (snap) => {
    usersList.innerHTML = "";

    const data = snap.val();
    if (!data) return;

    Object.values(data).forEach((u) => {
      if (u.uid === currentUser.uid) return;

      const div = document.createElement("div");
      div.className = "user";
      div.innerText = u.username;

      div.onclick = () => {
        currentChat = u;
        chatUsername.innerText = u.username;
        loadMessages();
      };

      usersList.appendChild(div);
    });
  });
}

/* CHAT ID */

function chatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

/* SEND */

sendBtn.onclick = async () => {
  if (!currentChat) return;

  const text = messageInput.value.trim();
  const file = imageInput.files[0];

  const id = chatId(currentUser.uid, currentChat.uid);

  const msgRef = ref(db, "messages/" + id);

  const data = {
    sender: currentUser.uid,
    text: text || "",
    time: new Date().toLocaleTimeString(),
    ts: Date.now()
  };

  /* IMAGE SUPPORT */
  if (file) {
    const reader = new FileReader();

    reader.onload = async () => {
      data.image = reader.result;
      await push(msgRef, data);
    };

    reader.readAsDataURL(file);
  } else {
    await push(msgRef, data);
  }

  messageInput.value = "";
  imageInput.value = "";
};

/* LOAD MESSAGES */

function loadMessages() {
  const id = chatId(currentUser.uid, currentChat.uid);
  const msgRef = ref(db, "messages/" + id);

  onValue(msgRef, (snap) => {
    messagesDiv.innerHTML = "";

    const data = snap.val();
    if (!data) return;

    /* SORT BY TIME */
    const sorted = Object.values(data).sort((a, b) => a.ts - b.ts);

    sorted.forEach((m) => {
      const div = document.createElement("div");
      div.className = "message";

      div.classList.add(
        m.sender === currentUser.uid ? "me" : "other"
      );

      div.innerHTML = `
        ${m.text ? `<div>${m.text}</div>` : ""}
        ${m.image ? `<img src="${m.image}">` : ""}
        <div class="time">${m.time}</div>
      `;

      messagesDiv.appendChild(div);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

/* SEARCH */

searchInput.oninput = () => {
  const val = searchInput.value.toLowerCase();

  document.querySelectorAll(".user").forEach((u) => {
    u.style.display = u.innerText.toLowerCase().includes(val)
      ? "block"
      : "none";
  });
};

/* LOGOUT */

logoutBtn.onclick = () => signOut(auth);
