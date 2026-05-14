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

/* =====================
   ELEMENTS
===================== */

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

/* =====================
   STATE
===================== */

let currentUser = null;
let currentChat = null;
let currentChatId = null;

/* =====================
   SIDEBAR TOGGLE (mobile)
===================== */

toggleSidebar.onclick = () => {
  document.querySelector(".sidebar").classList.toggle("hidden");
};

/* =====================
   AUTH
===================== */

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    authPage.style.display = "none";
    chatApp.style.display = "flex";
    loadChats();
  } else {
    currentUser = null;
    authPage.style.display = "flex";
    chatApp.style.display = "none";
  }
});

/* =====================
   CHAT ID
===================== */

function chatId(a, b) {
  return [a, b].sort().join("_");
}

/* =====================
   LOAD CHATS (NOT USERS)
===================== */

function loadChats() {
  const lastRef = ref(db, "lastChats");

  onValue(lastRef, (snap) => {
    usersList.innerHTML = "";

    const data = snap.val();
    if (!data) return;

    const chats = Object.entries(data)
      .filter(([_, c]) => c.users.includes(currentUser.uid))
      .sort((a, b) => b[1].time - a[1].time);

    chats.forEach(([id, chat]) => {

      const otherUid = chat.users.find(u => u !== currentUser.uid);

      /* get username */
      const userRef = ref(db, "users/" + otherUid);

      onValue(userRef, (uSnap) => {

        const u = uSnap.val();
        if (!u) return;

        const div = document.createElement("div");
        div.className = "user";

        div.innerHTML = `
          <b>${u.username}</b>
          <div style="font-size:11px;opacity:.7">
            ${chat.lastMessage || "Photo"}
          </div>
        `;

        div.onclick = () => {
          currentChat = u;
          chatUsername.innerText = u.username;
          openChat(otherUid);
        };

        usersList.appendChild(div);
      });
    });
  });
}

/* =====================
   OPEN CHAT
===================== */

function openChat(otherUid) {
  currentChatId = chatId(currentUser.uid, otherUid);

  const msgRef = ref(db, "messages/" + currentChatId);

  onValue(msgRef, (snap) => {
    messagesDiv.innerHTML = "";

    const data = snap.val();
    if (!data) return;

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

/* =====================
   SEND MESSAGE
===================== */

sendBtn.onclick = async () => {
  if (!currentChatId) return;

  const text = messageInput.value.trim();
  const file = imageInput.files[0];

  const msgRef = ref(db, "messages/" + currentChatId);

  const data = {
    sender: currentUser.uid,
    text: text || "",
    time: new Date().toLocaleTimeString(),
    ts: Date.now()
  };

  if (file) {
    const reader = new FileReader();

    reader.onload = async () => {
      data.image = reader.result;
      await push(msgRef, data);

      await set(ref(db, "lastChats/" + currentChatId), {
        users: [currentUser.uid, currentChat.uid],
        lastMessage: "📷 Photo",
        time: Date.now()
      });
    };

    reader.readAsDataURL(file);

  } else {
    await push(msgRef, data);

    await set(ref(db, "lastChats/" + currentChatId), {
      users: [currentUser.uid, currentChat.uid],
      lastMessage: text,
      time: Date.now()
    });
  }

  messageInput.value = "";
  imageInput.value = "";
};

/* =====================
   SEARCH CHATS
===================== */

searchInput.oninput = () => {
  const val = searchInput.value.toLowerCase();

  document.querySelectorAll(".user").forEach((u) => {
    u.style.display = u.innerText.toLowerCase().includes(val)
      ? "block"
      : "none";
  });
};

/* =====================
   LOGOUT
===================== */

logoutBtn.onclick = () => signOut(auth);
