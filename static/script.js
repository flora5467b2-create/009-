let registerMode = false;

const loginPage = document.getElementById("loginPage");
const sitePage = document.getElementById("sitePage");
const username = document.getElementById("username");
const password = document.getElementById("password");
const mainButton = document.getElementById("mainButton");
const switchButton = document.getElementById("switchButton");
const formTitle = document.getElementById("formTitle");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");

const welcomeContainer = document.getElementById("welcomeContainer");
const appContent = document.getElementById("appContent");

const homeButton = document.getElementById("homeButton");
const addPasteButton = document.getElementById("addPasteButton");
const homeSection = document.getElementById("homeSection");
const addPasteSection = document.getElementById("addPasteSection");

const searchInput = document.getElementById("searchInput");
const pasteList = document.getElementById("pasteList");

const pasteTitle = document.getElementById("pasteTitle");
const pasteText = document.getElementById("pasteText");
const publishButton = document.getElementById("publishButton");
const pasteError = document.getElementById("pasteError");
const publishMessage = document.getElementById("publishMessage");

const pasteDetail = document.getElementById("pasteDetail");
const detailTitle = document.getElementById("detailTitle");
const detailMeta = document.getElementById("detailMeta");
const detailText = document.getElementById("detailText");
const backHomeButton = document.getElementById("backHomeButton");

const menuButton = document.getElementById("menuButton");
const panel = document.getElementById("panel");
const logoutButton = document.getElementById("logoutButton");

function showError(text) {
  errorMessage.textContent = text;
  successMessage.textContent = "";
}

function showSuccess(text) {
  successMessage.textContent = text;
  errorMessage.textContent = "";
}

mainButton.addEventListener("click", async () => {
  const user = username.value.trim();
  const pass = password.value.trim();

  if (!user || !pass) {
    showError("Remplis tous les champs");
    return;
  }

  const url = registerMode ? "/register" : "/login";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: user,
      password: pass
    })
  });

  const data = await response.json();

  if (!data.success) {
    showError(data.message);
    return;
  }

  if (registerMode) {
    showSuccess("Compte créé avec succès");
    registerMode = false;
    formTitle.textContent = "Connecte-toi à ton compte";
    mainButton.textContent = "Se connecter";
    switchButton.textContent = "Créer un compte";
    return;
  }

  showSite();
});

switchButton.addEventListener("click", () => {
  registerMode = !registerMode;
  errorMessage.textContent = "";
  successMessage.textContent = "";

  if (registerMode) {
    formTitle.textContent = "Crée ton compte";
    mainButton.textContent = "Créer le compte";
    switchButton.textContent = "J’ai déjà un compte";
  } else {
    formTitle.textContent = "Connecte-toi à ton compte";
    mainButton.textContent = "Se connecter";
    switchButton.textContent = "Créer un compte";
  }
});

function showSite() {
  loginPage.style.display = "none";
  sitePage.style.display = "block";
  welcomeContainer.style.display = "flex";
  appContent.style.display = "none";

  setTimeout(() => {
    welcomeContainer.style.display = "none";
    appContent.style.display = "block";
    showHome();
  }, 3000);
}

function showHome() {
  homeSection.style.display = "block";
  addPasteSection.style.display = "none";
  pasteDetail.style.display = "none";

  homeButton.classList.add("active");
  addPasteButton.classList.remove("active");

  loadPastes();
}

function showAddPaste() {
  homeSection.style.display = "none";
  addPasteSection.style.display = "block";

  addPasteButton.classList.add("active");
  homeButton.classList.remove("active");
}

homeButton.addEventListener("click", showHome);
addPasteButton.addEventListener("click", showAddPaste);

async function loadPastes() {
  const search = searchInput.value.trim();

  const response = await fetch(`/pastes?search=${encodeURIComponent(search)}`);
  const pastes = await response.json();

  pasteList.innerHTML = "";

  if (pastes.length === 0) {
    pasteList.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">Aucune page trouvée.</td>
      </tr>
    `;
    return;
  }

  pastes.forEach(paste => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHTML(paste.title)}</td>
      <td>${escapeHTML(paste.author)}</td>
      <td>${paste.views}</td>
      <td>${escapeHTML(paste.date)}</td>
      <td><button class="delete-btn">Supprimer</button></td>
    `;

    row.addEventListener("click", () => openPaste(paste.id));

    row.querySelector(".delete-btn").addEventListener("click", async (event) => {
      event.stopPropagation();

      if (!confirm("Tu veux vraiment supprimer cette page ?")) return;

      await fetch(`/paste/${paste.id}`, {
        method: "DELETE"
      });

      loadPastes();
    });

    pasteList.appendChild(row);
  });
}

async function openPaste(id) {
  const response = await fetch(`/paste/${id}`);
  const paste = await response.json();

  pasteDetail.style.display = "block";

  detailTitle.textContent = paste.title;
  detailMeta.textContent = `Créé par ${paste.author} • ${paste.views} vue(s) • Publié le ${paste.date}`;
  detailText.textContent = paste.text;
}

publishButton.addEventListener("click", async () => {
  const title = pasteTitle.value.trim();
  const text = pasteText.value.trim();

  pasteError.textContent = "";
  publishMessage.textContent = "";

  if (!title || !text) {
    pasteError.textContent = "Ajoute un titre et un texte";
    return;
  }

  const response = await fetch("/paste", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title,
      text
    })
  });

  const data = await response.json();

  if (!data.success) {
    pasteError.textContent = data.message;
    return;
  }

  pasteTitle.value = "";
  pasteText.value = "";
  publishMessage.textContent = "Page publiée avec succès !";

  setTimeout(showHome, 700);
});

searchInput.addEventListener("input", loadPastes);

backHomeButton.addEventListener("click", () => {
  pasteDetail.style.display = "none";
});

menuButton.addEventListener("click", () => {
  panel.classList.toggle("active");
});

logoutButton.addEventListener("click", async () => {
  await fetch("/logout", {
    method: "POST"
  });

  sitePage.style.display = "none";
  loginPage.style.display = "flex";
  username.value = "";
  password.value = "";
});

function escapeHTML(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
