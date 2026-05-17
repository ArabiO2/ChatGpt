// auth.js

import {
  auth,
  db
} from "./firebase.js";

import {

  createUserWithEmailAndPassword,

  signInWithEmailAndPassword,

  onAuthStateChanged,

  signOut

} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {

  collection,

  addDoc,

  getDocs,

  query,

  where,

  doc,

  setDoc,

  onSnapshot

} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ========================= */
/* DOM REFERENCES */
/* ========================= */

const authOverlay =
  document.querySelector(".auth-overlay");

const authForm =
  document.querySelector(".auth-form");

const authTabs =
  document.querySelectorAll(".tab-btn");

const authSubmitBtn =
  document.querySelector(".auth-submit");

const authInputs =
  document.querySelectorAll(".input-group input");

const searchInput =
  document.querySelector(".search-box input");

const chatList =
  document.querySelector(".chat-list");

const brandStatus =
  document.querySelector(".brand-area span");

/* ========================= */
/* AUTH STATE */
/* ========================= */

let isLoginMode = true;

let allUsers = [];

let currentUserData = null;

/* ========================= */
/* AUTH TAB SWITCHING */
/* ========================= */

authTabs.forEach((tab, index) => {

  tab.addEventListener("click", () => {

    authTabs.forEach(btn =>
      btn.classList.remove("active")
    );

    tab.classList.add("active");

    isLoginMode = index === 0;

    toggleUsernameField();

  });

});

/* ========================= */
/* TOGGLE USERNAME FIELD */
/* ========================= */

function toggleUsernameField() {

  const usernameGroup =
    authInputs[2].parentElement;

  if (isLoginMode) {

    usernameGroup.style.display = "none";

    authSubmitBtn.textContent =
      "Enter ChatterBox";

  } else {

    usernameGroup.style.display = "flex";

    authSubmitBtn.textContent =
      "Create Account";

  }

}

toggleUsernameField();

/* ========================= */
/* FORM SUBMIT */
/* ========================= */

authForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  const email =
    authInputs[0].value.trim();

  const password =
    authInputs[1].value.trim();

  const username =
    authInputs[2].value.trim();

  if (!email || !password) {

    alert("Please fill all fields.");

    return;

  }

  /* ========================= */
  /* LOGIN */
  /* ========================= */

  if (isLoginMode) {

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    } catch (error) {

      console.error(error);

      alert(error.message);

    }

  }

  /* ========================= */
  /* REGISTER */
  /* ========================= */

  else {

    if (!username) {

      alert("Username is required.");

      return;

    }

    if (username.length < 3) {

      alert(
        "Username must be at least 3 characters."
      );

      return;

    }

    try {

      /* ========================= */
      /* CHECK USERNAME EXISTS */
      /* ========================= */

      const usersRef =
        collection(db, "users");

      const usernameQuery =
        query(
          usersRef,
          where(
            "username",
            "==",
            username.toLowerCase()
          )
        );

      const existingUsers =
        await getDocs(usernameQuery);

      if (!existingUsers.empty) {

        alert("Username already taken.");

        return;

      }

      /* ========================= */
      /* CREATE USER */
      /* ========================= */

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user =
        userCredential.user;

      /* ========================= */
      /* SAVE USER TO FIRESTORE */
      /* ========================= */

      await setDoc(

        doc(db, "users", user.uid),

        {

          uid: user.uid,

          email: user.email,

          username:
            username.toLowerCase(),

          displayName: username,

          createdAt:
            Date.now(),

          online: true

        }

      );

      alert(
        "Account created successfully."
      );

    } catch (error) {

      console.error(error);

      alert(error.message);

    }

  }

});

/* ========================= */
/* SESSION HANDLING */
/* ========================= */

onAuthStateChanged(auth, async (user) => {

  if (user) {

    authOverlay.style.display = "none";

    await loadCurrentUser(user.uid);

    loadUsersRealtime();

  } else {

    authOverlay.style.display = "flex";

  }

});

/* ========================= */
/* LOAD CURRENT USER */
/* ========================= */

async function loadCurrentUser(uid) {

  const usersSnapshot =
    await getDocs(collection(db, "users"));

  usersSnapshot.forEach((docSnap) => {

    const data = docSnap.data();

    if (data.uid === uid) {

      currentUserData = data;

    }

  });

  if (currentUserData) {

    brandStatus.textContent =
      `Logged in as @${currentUserData.username}`;

  }

}

/* ========================= */
/* REALTIME USERS LIST */
/* ========================= */

function loadUsersRealtime() {

  const usersRef =
    collection(db, "users");

  onSnapshot(usersRef, (snapshot) => {

    allUsers = [];

    snapshot.forEach((docSnap) => {

      const userData =
        docSnap.data();

      /* ========================= */
      /* EXCLUDE SELF */
      /* ========================= */

      if (
        auth.currentUser &&
        userData.uid !== auth.currentUser.uid
      ) {

        allUsers.push(userData);

      }

    });

    renderUsers(allUsers);

  });

}

/* ========================= */
/* RENDER USERS */
/* ========================= */

function renderUsers(users) {

  chatList.innerHTML = "";

  if (!users.length) {

    chatList.innerHTML = `

      <div class="empty-users">
        No users found.
      </div>

    `;

    return;

  }

  users.forEach((user) => {

    const userCard =
      document.createElement("div");

    userCard.className =
      "chat-user";

    userCard.dataset.uid =
      user.uid;

    const firstLetter =
      user.displayName
        .charAt(0)
        .toUpperCase();

    userCard.innerHTML = `

      <div class="avatar">

        ${firstLetter}

        <span class="online-dot"></span>

      </div>

      <div class="chat-user-info">

        <h4>
          ${user.displayName}
        </h4>

        <p>
          @${user.username}
        </p>

      </div>

      <div class="chat-meta">

        <span>
          Online
        </span>

      </div>

    `;

    /* ========================= */
    /* OPEN CHAT ROOM */
    /* ========================= */

    userCard.addEventListener("click", () => {

      document
        .querySelectorAll(".chat-user")
        .forEach(card =>
          card.classList.remove("active")
        );

      userCard.classList.add("active");

      /* ========================= */
      /* DISPATCH CHAT EVENT */
      /* ========================= */

      document.dispatchEvent(

        new CustomEvent(
          "userSelected",
          {
            detail: user
          }
        )

      );

    });

    chatList.appendChild(userCard);

  });

}

/* ========================= */
/* LIVE USER SEARCH */
/* ========================= */

searchInput.addEventListener("input", (e) => {

  const searchValue =
    e.target.value
      .toLowerCase()
      .trim();

  if (!searchValue) {

    renderUsers(allUsers);

    return;

  }

  const filteredUsers =
    allUsers.filter((user) => {

      return (

        user.username
          .toLowerCase()
          .includes(searchValue)

        ||

        user.displayName
          .toLowerCase()
          .includes(searchValue)

      );

    });

  renderUsers(filteredUsers);

});

/* ========================= */
/* LOGOUT HELPER */
/* ========================= */

window.logoutUser = async () => {

  try {

    await signOut(auth);

    location.reload();

  } catch (error) {

    console.error(error);

  }

};
