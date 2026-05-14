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
  update // ضفنا update عشان النجمة
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
const scrollBtn = document.getElementById("smart-scroll-btn"); // زرار السكرول

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
   AUTH & LOGIN/SIGNUP LOGIC
===================== */
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const usernameInput = document.getElementById("username");

signupBtn.onclick = async () => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    await set(ref(db, "users/" + cred.user.uid), {
      username: usernameInput.value || "مستخدم جديد",
      uid: cred.user.uid,
      email: cred.user.email
    });
  } catch (error) {
    alert("خطأ في التسجيل: " + error.message);
  }
};

loginBtn.onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (error) {
    alert("خطأ في الدخول: " + error.message);
  }
};

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
   CHAT ID (توليد ID ثابت للمحادثة بين شخصين)
===================== */
function chatId(a, b) {
  return [a, b].sort().join("_");
}

/* =====================
   LOAD CHATS 
===================== */
function loadChats() {
  const lastRef = ref(db, "lastChats");

  onValue(lastRef, (snap) => {
    usersList.innerHTML = "";
    const data = snap.val();
    if (!data) return;

    const chats = Object.entries(data)
      .filter(([_, c]) => c.users && c.users.includes(currentUser.uid))
      .sort((a, b) => b[1].time - a[1].time);

    chats.forEach(([id, chat]) => {
      const otherUid = chat.users.find(u => u !== currentUser.uid);
      const userRef = ref(db, "users/" + otherUid);

      onValue(userRef, (uSnap) => {
        const u = uSnap.val();
        if (!u) return;

        const div = document.createElement("div");
        div.className = "user";
        div.innerHTML = `
          <b>${u.username}</b>
          <div style="font-size:11px;opacity:.7">
            ${chat.lastMessage || "صورة 📷"}
          </div>
        `;

        div.onclick = () => {
          currentChat = u;
          chatUsername.innerText = u.username;
          openChat(otherUid);
          // قفل القائمة الجانبية في الموبايل بعد اختيار الشات
          if (window.innerWidth <= 768) {
            document.querySelector(".sidebar").classList.add("hidden");
          }
        };

        usersList.appendChild(div);
      });
    });
  });
}

/* =====================
   OPEN CHAT & RENDER MESSAGES
===================== */
function openChat(otherUid) {
  currentChatId = chatId(currentUser.uid, otherUid);
  const msgRef = ref(db, "messages/" + currentChatId);

  onValue(msgRef, (snap) => {
    messagesDiv.innerHTML = "";
    const data = snap.val();
    if (!data) return;

    // حولنا الـ Object لـ Array عشان نحتفظ بالـ key بتاع كل رسالة
    const sorted = Object.entries(data)
      .map(([key, val]) => ({ key, ...val }))
      .sort((a, b) => a.ts - b.ts);

    sorted.forEach((m) => {
      const div = document.createElement("div");
      div.className = "message";
      div.classList.add(m.sender === currentUser.uid ? "me" : "other");

      const isStarred = m.starredBy && m.starredBy.includes(currentUser.uid);

      div.innerHTML = `
        ${isStarred ? `<div style="font-size:12px; color:#ff9800; margin-bottom:2px;">⭐ مفضلة</div>` : ""}
        ${m.text ? `<div>${m.text}</div>` : ""}
        ${m.image ? `<img src="${m.image}">` : ""}
        <div class="time">${m.time}</div>
      `;

      // منطق الضغط المزدوج (Double Tap)
      let lastTap = 0;
      div.addEventListener('click', (e) => {
        const now = Date.now();
        if (now - lastTap < 300) {
          // جلب مسار الرسالة المحددة
          const specificMsgRef = ref(db, `messages/${currentChatId}/${m.key}`);
          let stars = m.starredBy || [];
          
          if (stars.includes(currentUser.uid)) {
            stars = stars.filter(id => id !== currentUser.uid); // لو موجودة شيلها
          } else {
            stars.push(currentUser.uid); // لو مش موجودة ضيفها
          }
          update(specificMsgRef, { starredBy: stars });
        }
        lastTap = now;
      });

      messagesDiv.appendChild(div);
    });

    // السكرول التلقائي للأسفل
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

/* =====================
   SMART SCROLL BUTTON
===================== */
messagesDiv.addEventListener("scroll", () => {
  // لو المستخدم طلع لفوق أكتر من 150 بيكسل، أظهر الزرار
  const isAtBottom = messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight < 150;
  if (!isAtBottom) {
    scrollBtn.style.display = "flex";
  } else {
    scrollBtn.style.display = "none";
  }
});

scrollBtn.onclick = () => {
  messagesDiv.scrollTo({ top: messagesDiv.scrollHeight, behavior: 'smooth' });
};

/* =====================
   SEND MESSAGE
===================== */
sendBtn.onclick = async () => {
  if (!currentChatId) return;

  const text = messageInput.value.trim();
  const file = imageInput.files[0];

  // منع الإرسال لو مفيش نص ولا صورة
  if (!text && !file) return; 

  const msgRef = ref(db, "messages/" + currentChatId);

  const data = {
    sender: currentUser.uid,
    text: text || "",
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute:'2-digit' }),
    ts: Date.now(),
    starredBy: []
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = async () => {
      data.image = reader.result;
      await push(msgRef, data);
      await set(ref(db, "lastChats/" + currentChatId), {
        users: [currentUser.uid, currentChat.uid],
        lastMessage: "صورة 📷",
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

// تشغيل زرار الإنتر للإرسال
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});

/* =====================
   SEARCH CHATS
===================== */
searchInput.oninput = () => {
  const val = searchInput.value.toLowerCase();
  document.querySelectorAll(".user").forEach((u) => {
    u.style.display = u.innerText.toLowerCase().includes(val) ? "flex" : "none";
  });
};
// تحسين الرؤية عند فتح الكيبورد في الموبايل
messageInput.addEventListener("focus", () => {
  setTimeout(() => {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }, 300);
});

/* =====================
   LOGOUT
===================== */
logoutBtn.onclick = () => signOut(auth);
