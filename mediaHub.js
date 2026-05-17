// mediaHub.js

import {
  auth,
  db
} from "./firebase.js";

import {

  collection,

  query,

  orderBy,

  onSnapshot

} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ========================= */
/* DOM REFERENCES */
/* ========================= */

const imageGrid =
  document.querySelector(
    ".image-grid"
  );

const filesSection =
  document.querySelector(
    ".files-section"
  );

const linksSection =
  document.querySelector(
    ".links-section"
  );

const mediaTabs =
  document.querySelectorAll(
    ".media-tab"
  );

const mediaContent =
  document.querySelector(
    ".media-content"
  );

/* ========================= */
/* STATE */
/* ========================= */

let activeMediaTab =
  "images";

let unsubscribeMedia = null;

/* ========================= */
/* TAB SWITCHING */
/* ========================= */

mediaTabs.forEach((tab, index) => {

  tab.addEventListener(
    "click",
    () => {

      mediaTabs.forEach(btn =>
        btn.classList.remove("active")
      );

      tab.classList.add("active");

      if (index === 0) {

        activeMediaTab = "images";

      }

      else if (index === 1) {

        activeMediaTab = "files";

      }

      else {

        activeMediaTab = "links";

      }

      updateVisibleTab();

    }
  );

});

/* ========================= */
/* UPDATE TAB VISIBILITY */
/* ========================= */

function updateVisibleTab() {

  imageGrid.parentElement.style.display =
    activeMediaTab === "images"
      ? "block"
      : "none";

  filesSection.style.display =
    activeMediaTab === "files"
      ? "block"
      : "none";

  linksSection.style.display =
    activeMediaTab === "links"
      ? "flex"
      : "none";

}

/* ========================= */
/* CHAT ROOM LISTENER */
/* ========================= */

document.addEventListener(
  "userSelected",
  () => {

    const roomId =
      window.chatState.getRoomId();

    if (!roomId) return;

    initializeMediaHub(roomId);

  }
);

/* ========================= */
/* INITIALIZE MEDIA HUB */
/* ========================= */

function initializeMediaHub(roomId) {

  if (unsubscribeMedia) {

    unsubscribeMedia();

  }

  const messagesRef =
    collection(
      db,
      "chats",
      roomId,
      "messages"
    );

  const messagesQuery =
    query(
      messagesRef,
      orderBy("createdAt", "asc")
    );

  unsubscribeMedia =
    onSnapshot(
      messagesQuery,
      (snapshot) => {

        const images = [];

        const files = [];

        const links = [];

        snapshot.forEach((docSnap) => {

          const message =
            docSnap.data();

          /* ========================= */
          /* IMAGES */
          /* ========================= */

          if (
            message.type === "image"
          ) {

            images.push(message);

          }

          /* ========================= */
          /* FILES */
          /* ========================= */

          if (
            message.type === "file"
          ) {

            files.push(message);

          }

          /* ========================= */
          /* LINKS */
          /* ========================= */

          if (
            message.type === "text"
          ) {

            const extractedLinks =
              extractLinks(
                message.text
              );

            extractedLinks.forEach(
              (link) => {

                links.push({

                  url: link,

                  senderId:
                    message.senderId

                });

              }
            );

          }

        });

        renderImages(images);

        renderFiles(files);

        renderLinks(links);

      }
    );

}

/* ========================= */
/* LINK REGEX PARSER */
/* ========================= */

function extractLinks(text) {

  if (!text) return [];

  const urlRegex =

    /https?:\/\/[^\s]+/g;

  return text.match(urlRegex) || [];

}

/* ========================= */
/* RENDER IMAGES */
/* ========================= */

function renderImages(images) {

  imageGrid.innerHTML = "";

  if (!images.length) {

    imageGrid.innerHTML = `

      <div class="media-empty">
        No shared images.
      </div>

    `;

    return;

  }

  images.forEach((image) => {

    const imageCard =
      document.createElement("div");

    imageCard.className =
      "image-card";

    imageCard.innerHTML = `

      <img
        src="${image.fileData}"
        alt="${image.fileName}"
      >

    `;

    /* ========================= */
    /* OPEN IMAGE */
    /* ========================= */

    imageCard.addEventListener(
      "click",
      () => {

        window.open(
          image.fileData,
          "_blank"
        );

      }
    );

    imageGrid.appendChild(
      imageCard
    );

  });

}

/* ========================= */
/* RENDER FILES */
/* ========================= */

function renderFiles(files) {

  filesSection.innerHTML = "";

  if (!files.length) {

    filesSection.innerHTML = `

      <div class="media-empty">
        No shared files.
      </div>

    `;

    return;

  }

  files.forEach((file) => {

    const fileElement =
      document.createElement("div");

    fileElement.className =
      "shared-file";

    fileElement.innerHTML = `

      <div class="shared-file-icon">
        📄
      </div>

      <div class="shared-file-info">

        <h5>
          ${file.fileName}
        </h5>

        <span>
          ${file.fileSize}
        </span>

      </div>

      <a
        href="${file.fileData}"
        download="${file.fileName}"
        class="shared-download"
      >
        ⬇
      </a>

    `;

    filesSection.appendChild(
      fileElement
    );

  });

}

/* ========================= */
/* RENDER LINKS */
/* ========================= */

function renderLinks(links) {

  linksSection.innerHTML = "";

  if (!links.length) {

    linksSection.innerHTML = `

      <div class="media-empty">
        No shared links.
      </div>

    `;

    return;

  }

  links.forEach((linkObj) => {

    const linkElement =
      document.createElement("a");

    linkElement.href =
      linkObj.url;

    linkElement.target =
      "_blank";

    linkElement.rel =
      "noopener noreferrer";

    linkElement.className =
      "shared-link";

    linkElement.textContent =
      linkObj.url;

    linksSection.appendChild(
      linkElement
    );

  });

}

/* ========================= */
/* INITIAL TAB */
/* ========================= */

updateVisibleTab();
