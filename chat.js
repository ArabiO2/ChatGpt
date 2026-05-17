// chat.js

import {
  auth,
  db
} from "./firebase.js";

import {

  collection,

  addDoc,

  query,

  orderBy,

  onSnapshot,

  serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ========================= */
/* DOM REFERENCES */
/* ========================= */

const messagesContainer =
  document.querySelector(
    ".messages-container"
  );

const messageInput =
  document.querySelector(
    ".message-input-area input"
  );

const sendBtn =
  document.querySelector(
    ".send-btn"
  );

const fileInput =
  document.getElementById(
    "fileInput"
  );

const roomIdValue =
  document.querySelector(
    ".room-id-value"
  );

const chatHeaderName =
  document.querySelector(
    ".chat-user-header h3"
  );

const chatHeaderStatus =
  document.querySelector(
    ".chat-user-header span"
  );

/* ========================= */
/* CHAT STATE */
/* ========================= */

let activeChatUser = null;

let activeRoomId = null;

let unsubscribeMessages = null;

/* ========================= */
/* USER SELECTION */
/* ========================= */

document.addEventListener(
  "userSelected",
  (event) => {

    activeChatUser =
      event.detail;

    initializeChatRoom();

  }
);

/* ========================= */
/* GENERATE ROOM ID */
/* ========================= */

function generateRoomId(uid1, uid2) {

  return [uid1, uid2]
    .sort()
    .join("_");

}

/* ========================= */
/* INITIALIZE ROOM */
/* ========================= */

function initializeChatRoom() {

  if (
    !auth.currentUser ||
    !activeChatUser
  ) return;

  activeRoomId =
    generateRoomId(

      auth.currentUser.uid,

      activeChatUser.uid

    );

  /* ========================= */
  /* UPDATE HEADER */
  /* ========================= */

  roomIdValue.textContent =
    activeRoomId;

  chatHeaderName.textContent =
    activeChatUser.displayName;

  chatHeaderStatus.textContent =
    "Online";

  /* ========================= */
  /* CLEAR OLD LISTENER */
  /* ========================= */

  if (unsubscribeMessages) {

    unsubscribeMessages();

  }

  loadMessagesRealtime();

}

/* ========================= */
/* REALTIME MESSAGES */
/* ========================= */

function loadMessagesRealtime() {

  messagesContainer.innerHTML = `
  
    <div class="chat-loading">
      Loading conversation...
    </div>
  
  `;

  const messagesRef =
    collection(
      db,
      "chats",
      activeRoomId,
      "messages"
    );

  const messagesQuery =
    query(
      messagesRef,
      orderBy("createdAt", "asc")
    );

  unsubscribeMessages =
    onSnapshot(
      messagesQuery,
      (snapshot) => {

        messagesContainer.innerHTML = "";

        if (snapshot.empty) {

          messagesContainer.innerHTML = `
          
            <div class="empty-chat">
              Start your encrypted conversation 🚀
            </div>
          
          `;

          return;

        }

        snapshot.forEach((docSnap) => {

          const message =
            docSnap.data();

          renderMessage(message);

        });

        autoScrollToBottom();

      }
    );

}

/* ========================= */
/* SEND TEXT MESSAGE */
/* ========================= */

async function sendTextMessage() {

  if (
    !messageInput.value.trim() ||
    !activeRoomId
  ) return;

  try {

    const messageData = {

      type: "text",

      text:
        messageInput.value.trim(),

      senderId:
        auth.currentUser.uid,

      receiverId:
        activeChatUser.uid,

      createdAt:
        serverTimestamp()

    };

    await addDoc(

      collection(
        db,
        "chats",
        activeRoomId,
        "messages"
      ),

      messageData

    );

    messageInput.value = "";

  } catch (error) {

    console.error(error);

    alert(
      "Failed to send message."
    );

  }

}

/* ========================= */
/* SEND FILE MESSAGE */
/* ========================= */

async function sendFileMessage(file) {

  if (
    !file ||
    !activeRoomId
  ) return;

  try {

    const fileData =
      await convertFileToBase64(file);

    const isImage =
      file.type.startsWith("image/");

    const messageData = {

      type:
        isImage
          ? "image"
          : "file",

      fileName:
        file.name,

      fileType:
        file.type,

      fileSize:
        formatFileSize(file.size),

      fileData,

      senderId:
        auth.currentUser.uid,

      receiverId:
        activeChatUser.uid,

      createdAt:
        serverTimestamp()

    };

    await addDoc(

      collection(
        db,
        "chats",
        activeRoomId,
        "messages"
      ),

      messageData

    );

  } catch (error) {

    console.error(error);

    alert(
      "File upload failed."
    );

  }

}

/* ========================= */
/* BASE64 CONVERSION */
/* ========================= */

function convertFileToBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () => {

        resolve(reader.result);

      };

      reader.onerror = (error) => {

        reject(error);

      };

    }
  );

}

/* ========================= */
/* FORMAT FILE SIZE */
/* ========================= */

function formatFileSize(bytes) {

  if (bytes < 1024) {

    return bytes + " B";

  }

  else if (bytes < 1048576) {

    return (
      (bytes / 1024)
      .toFixed(1) + " KB"
    );

  }

  else {

    return (
      (bytes / 1048576)
      .toFixed(1) + " MB"
    );

  }

}

/* ========================= */
/* RENDER MESSAGE */
/* ========================= */

function renderMessage(message) {

  const isOwnMessage =

    message.senderId ===
    auth.currentUser.uid;

  const messageElement =
    document.createElement("div");

  messageElement.className =
    `message ${
      isOwnMessage
        ? "outgoing"
        : "incoming"
    }`;

  /* ========================= */
  /* TEXT */
  /* ========================= */

  if (message.type === "text") {

    messageElement.innerHTML = `

      <div class="message-bubble">

        ${escapeHTML(message.text)}

      </div>

      <span class="message-time">

        ${formatTime(
          message.createdAt
        )}

      </span>

    `;

  }

  /* ========================= */
  /* IMAGE */
  /* ========================= */

  else if (message.type === "image") {

    messageElement.classList.add(
      "image-message"
    );

    messageElement.innerHTML = `

      <div class="message-bubble">

        <img
          src="${message.fileData}"
          alt="${message.fileName}"
        />

      </div>

      <span class="message-time">

        ${formatTime(
          message.createdAt
        )}

      </span>

    `;

  }

  /* ========================= */
  /* FILE */
  /* ========================= */

  else if (message.type === "file") {

    messageElement.classList.add(
      "file-message"
    );

    messageElement.innerHTML = `

      <div
        class="message-bubble file-bubble"
      >

        <div class="file-icon">
          📄
        </div>

        <div class="file-info">

          <h5>
            ${message.fileName}
          </h5>

          <span>
            ${message.fileSize}
          </span>

        </div>

        <a
          class="download-btn"
          href="${message.fileData}"
          download="${message.fileName}"
        >
          ⬇
        </a>

      </div>

      <span class="message-time">

        ${formatTime(
          message.createdAt
        )}

      </span>

    `;

  }

  messagesContainer.appendChild(
    messageElement
  );

}

/* ========================= */
/* AUTO SCROLL */
/* ========================= */

function autoScrollToBottom() {

  messagesContainer.scrollTop =

    messagesContainer.scrollHeight;

}

/* ========================= */
/* TIME FORMAT */
/* ========================= */

function formatTime(timestamp) {

  if (
    !timestamp ||
    !timestamp.toDate
  ) {

    return "Now";

  }

  return timestamp
    .toDate()
    .toLocaleTimeString([], {

      hour: "2-digit",

      minute: "2-digit"

    });

}

/* ========================= */
/* ESCAPE HTML */
/* ========================= */

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}

/* ========================= */
/* ENTER KEY SEND */
/* ========================= */

messageInput.addEventListener(
  "keydown",
  (e) => {

    if (e.key === "Enter") {

      sendTextMessage();

    }

  }
);

/* ========================= */
/* SEND BUTTON */
/* ========================= */

sendBtn.addEventListener(
  "click",
  sendTextMessage
);

/* ========================= */
/* FILE INPUT */
/* ========================= */

fileInput.addEventListener(
  "change",
  async (e) => {

    const file =
      e.target.files[0];

    if (!file) return;

    /* ========================= */
    /* FILE LIMIT */
    /* ========================= */

    const MAX_FILE_SIZE =
      10 * 1024 * 1024;

    if (
      file.size >
      MAX_FILE_SIZE
    ) {

      alert(
        "Max file size is 10MB."
      );

      fileInput.value = "";

      return;

    }

    await sendFileMessage(file);

    fileInput.value = "";

  }
);

/* ========================= */
/* GLOBAL ACCESS */
/* ========================= */

window.chatState = {

  getRoomId: () => activeRoomId,

  getActiveUser: () => activeChatUser

};
