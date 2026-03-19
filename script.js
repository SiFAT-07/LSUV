const CAR_STORAGE_KEY = "lsuvCars";
const WEBHOOK_STORAGE_KEY = "lsuvWebhookUrl";
const ADMIN_AUTH_STORAGE_KEY = "lsuvAdminUnlocked";
const ADMIN_PIN = "1234";
const DEFAULT_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1484299001812746281/9Yi5X_xfVcWdXxLP4Xk1MpJwMxaaudI-qhYQ0bVOp4hVAXNXIRvfurSXvtL6UMwDKZda";

// Set these values to enable shared online storage across all users.
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
const SUPABASE_TABLE = "cars";

const DEFAULT_CARS = [
  {
    id: crypto.randomUUID(),
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
    name: "Bravado Buffalo S",
    price: "$24,500",
    description:
      "Muscle styling with smooth handling and a performance-tuned engine.",
  },
  {
    id: crypto.randomUUID(),
    image:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    name: "Obey Tailgater",
    price: "$18,900",
    description:
      "Clean executive sedan with low mileage and upgraded interior finish.",
  },
  {
    id: crypto.randomUUID(),
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    name: "Vapid Dominator",
    price: "$21,300",
    description:
      "Strong road presence, tuned suspension, and verified maintenance records.",
  },
];

const state = {
  cars: [],
  adminOpen: false,
  adminUnlocked: false,
  useCloud: false,
  filters: {
    name: "",
    minPrice: "",
    maxPrice: "",
  },
};

const carGrid = document.getElementById("carGrid");
const adminPanel = document.getElementById("adminPanel");
const openAdminBtn = document.getElementById("openAdminBtn");
const closeAdminBtn = document.getElementById("closeAdminBtn");
const addCarForm = document.getElementById("addCarForm");
const transferModal = document.getElementById("transferModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const transferForm = document.getElementById("transferForm");
const formStatus = document.getElementById("formStatus");
const selectedCarInput = document.getElementById("selectedCar");
const webhookUrlInput = document.getElementById("webhookUrl");
const searchNameInput = document.getElementById("searchName");
const minPriceInput = document.getElementById("minPrice");
const maxPriceInput = document.getElementById("maxPrice");
const dataModeNote = document.getElementById("dataModeNote");
const adminStorageNote = document.getElementById("adminStorageNote");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
const pinModal = document.getElementById("pinModal");
const pinForm = document.getElementById("pinForm");
const adminPinInput = document.getElementById("adminPin");
const pinStatus = document.getElementById("pinStatus");
const closePinModalBtn = document.getElementById("closePinModalBtn");

function parsePrice(priceText) {
  return Number(String(priceText).replace(/[^\d.]/g, "")) || 0;
}

function cloudConfigured() {
  return Boolean(SUPABASE_URL.trim() && SUPABASE_ANON_KEY.trim());
}

function supabaseHeaders(withJson = false) {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };

  if (withJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

function updateDataModeUI() {
  if (state.useCloud) {
    dataModeNote.textContent = "Data Mode: Shared online (Supabase)";
    adminStorageNote.textContent =
      "Storage mode: shared online database. Cars added here are visible to all users.";
    return;
  }

  dataModeNote.textContent = "Data Mode: Local (single browser)";
  adminStorageNote.textContent =
    "Storage mode: local browser data. Configure Supabase in script.js for shared online data.";
}

function loadAdminState() {
  state.adminUnlocked = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === "true";
}

async function loadCars() {
  if (state.useCloud) {
    await loadCarsFromCloud();
    return;
  }

  loadCarsFromLocal();
}

function loadCarsFromLocal() {
  const savedCars = localStorage.getItem(CAR_STORAGE_KEY);
  if (!savedCars) {
    state.cars = [...DEFAULT_CARS];
    saveCarsLocal();
    return;
  }

  try {
    const parsedCars = JSON.parse(savedCars);
    state.cars = Array.isArray(parsedCars) ? parsedCars : [...DEFAULT_CARS];
  } catch {
    state.cars = [...DEFAULT_CARS];
    saveCarsLocal();
  }
}

function saveCarsLocal() {
  localStorage.setItem(CAR_STORAGE_KEY, JSON.stringify(state.cars));
}

async function loadCarsFromCloud() {
  const endpoint = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=id,image,name,price,description&order=created_at.desc.nullslast`;
  const response = await fetch(endpoint, {
    headers: supabaseHeaders(),
  });

  if (!response.ok) {
    throw new Error("Could not load cars from shared storage.");
  }

  const cars = await response.json();
  state.cars = Array.isArray(cars) ? cars : [];
}

async function addCarToCloud(newCar) {
  const endpoint = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: supabaseHeaders(true),
    body: JSON.stringify([newCar]),
  });

  if (!response.ok) {
    throw new Error("Failed to add car to shared storage.");
  }
}

async function removeCarFromCloud(removeId) {
  const endpoint = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${encodeURIComponent(removeId)}`;
  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: supabaseHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to remove car from shared storage.");
  }
}

function loadWebhookSetting() {
  let savedWebhook = localStorage.getItem(WEBHOOK_STORAGE_KEY) || "";
  if (!savedWebhook && DEFAULT_WEBHOOK_URL) {
    savedWebhook = DEFAULT_WEBHOOK_URL;
    localStorage.setItem(WEBHOOK_STORAGE_KEY, savedWebhook);
  }
  webhookUrlInput.value = savedWebhook;
}

function escapeHtml(text) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(text), "text/html");
  return doc.body.textContent || "";
}

function getFilteredCars() {
  const nameQuery = state.filters.name.toLowerCase();
  const min = Number(state.filters.minPrice) || 0;
  const max = Number(state.filters.maxPrice) || Number.POSITIVE_INFINITY;

  return state.cars.filter((car) => {
    const matchesName = car.name.toLowerCase().includes(nameQuery);
    const numericPrice = parsePrice(car.price);
    const matchesMin = numericPrice >= min;
    const matchesMax = numericPrice <= max;
    return matchesName && matchesMin && matchesMax;
  });
}

function renderCars() {
  const filteredCars = getFilteredCars();

  if (!filteredCars.length) {
    const hasCars = state.cars.length > 0;
    carGrid.innerHTML = hasCars
      ? '<p class="admin-note">No cars match your current search or price filter.</p>'
      : '<p class="admin-note">No cars yet. Add one from the admin panel.</p>';
    return;
  }

  carGrid.innerHTML = filteredCars
    .map(
      (car) => `
      <article class="car-card fade-in-up" data-id="${escapeHtml(car.id)}">
        <img src="${escapeHtml(car.image)}" alt="${escapeHtml(car.name)}" loading="lazy" />
        <div class="car-body">
          <div class="car-meta">
            <h3>${escapeHtml(car.name)}</h3>
            <span class="price">${escapeHtml(car.price)}</span>
          </div>
          <p class="car-description">${escapeHtml(car.description)}</p>
          <button class="btn btn-primary request-transfer-btn" data-car-name="${escapeHtml(car.name)}">Request Transfer</button>
          ${
            state.adminOpen
              ? `<button class="btn remove-car-btn" data-remove-id="${escapeHtml(car.id)}">Remove Car</button>`
              : ""
          }
        </div>
      </article>
    `,
    )
    .join("");
}

function toggleAdminPanel(forceOpen) {
  state.adminOpen =
    typeof forceOpen === "boolean" ? forceOpen : !state.adminOpen;
  adminPanel.classList.toggle("open", state.adminOpen);
  adminPanel.setAttribute("aria-hidden", String(!state.adminOpen));
  openAdminBtn.setAttribute("aria-expanded", String(state.adminOpen));
  openAdminBtn.textContent = state.adminOpen ? "Admin Open" : "Admin Panel";
  renderCars();
}

function openPinModal() {
  pinStatus.textContent = "";
  adminPinInput.value = "";
  pinModal.classList.add("open");
  pinModal.setAttribute("aria-hidden", "false");
  adminPinInput.focus();
}

function closePinModal() {
  pinModal.classList.remove("open");
  pinModal.setAttribute("aria-hidden", "true");
}

function openTransferModal(carName) {
  selectedCarInput.value = carName;
  formStatus.textContent = "";
  transferModal.classList.add("open");
  transferModal.setAttribute("aria-hidden", "false");
}

function closeTransferModal() {
  transferModal.classList.remove("open");
  transferModal.setAttribute("aria-hidden", "true");
  transferForm.reset();
}

async function sendTransferRequest(payload) {
  const webhookUrl = (localStorage.getItem(WEBHOOK_STORAGE_KEY) || "").trim();

  if (!webhookUrl) {
    throw new Error(
      "Discord webhook URL is not set. Add it in the Admin Panel.",
    );
  }

  const content = [
    "New Car Transfer Request:",
    `Name: ${payload.name}`,
    `Phone: ${payload.phone}`,
    `Car: ${payload.car}`,
    `Message: ${payload.message}`,
  ].join("\n");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error("Failed to send request to Discord webhook.");
  }
}

carGrid.addEventListener("click", async (event) => {
  const requestButton = event.target.closest(".request-transfer-btn");
  if (requestButton) {
    openTransferModal(requestButton.dataset.carName || "");
    return;
  }

  const removeButton = event.target.closest("[data-remove-id]");
  if (removeButton) {
    const removeId = removeButton.dataset.removeId;
    try {
      if (state.useCloud) {
        await removeCarFromCloud(removeId);
        await loadCarsFromCloud();
      } else {
        state.cars = state.cars.filter((car) => car.id !== removeId);
        saveCarsLocal();
      }

      renderCars();
    } catch (error) {
      alert(error.message);
    }
  }
});

addCarForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const newCar = {
    id: crypto.randomUUID(),
    image: document.getElementById("carImage").value.trim(),
    name: document.getElementById("carName").value.trim(),
    price: document.getElementById("carPrice").value.trim(),
    description: document.getElementById("carDescription").value.trim(),
  };

  const webhookValue = webhookUrlInput.value.trim();
  localStorage.setItem(WEBHOOK_STORAGE_KEY, webhookValue);

  try {
    if (state.useCloud) {
      await addCarToCloud(newCar);
      await loadCarsFromCloud();
    } else {
      state.cars.unshift(newCar);
      saveCarsLocal();
    }

    addCarForm.reset();
    webhookUrlInput.value = webhookValue;
    renderCars();
  } catch (error) {
    alert(error.message);
  }
});

transferForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = "Sending request...";

  const payload = {
    name: document.getElementById("fullName").value.trim(),
    phone: document.getElementById("contactNumber").value.trim(),
    car: selectedCarInput.value.trim(),
    message: document.getElementById("requestMessage").value.trim(),
  };

  try {
    await sendTransferRequest(payload);
    formStatus.textContent = "Request sent successfully.";
    transferForm.reset();
    selectedCarInput.value = payload.car;

    setTimeout(() => {
      closeTransferModal();
    }, 1200);
  } catch (error) {
    formStatus.textContent = error.message;
  }
});

openAdminBtn.addEventListener("click", () => {
  if (state.adminOpen) {
    toggleAdminPanel(false);
    return;
  }

  if (state.adminUnlocked) {
    toggleAdminPanel(true);
    return;
  }

  openPinModal();
});

closeAdminBtn.addEventListener("click", () => toggleAdminPanel(false));
closeModalBtn.addEventListener("click", closeTransferModal);
closePinModalBtn.addEventListener("click", closePinModal);

pinForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (adminPinInput.value.trim() !== ADMIN_PIN) {
    pinStatus.textContent = "Invalid PIN. Please try again.";
    return;
  }

  state.adminUnlocked = true;
  localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "true");
  closePinModal();
  toggleAdminPanel(true);
});

transferModal.addEventListener("click", (event) => {
  if (event.target === transferModal) {
    closeTransferModal();
  }
});

pinModal.addEventListener("click", (event) => {
  if (event.target === pinModal) {
    closePinModal();
  }
});

navToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

navLinks.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    navLinks.classList.remove("open");
  }
});

webhookUrlInput.addEventListener("change", () => {
  localStorage.setItem(WEBHOOK_STORAGE_KEY, webhookUrlInput.value.trim());
});

searchNameInput.addEventListener("input", () => {
  state.filters.name = searchNameInput.value.trim();
  renderCars();
});

minPriceInput.addEventListener("input", () => {
  state.filters.minPrice = minPriceInput.value.trim();
  renderCars();
});

maxPriceInput.addEventListener("input", () => {
  state.filters.maxPrice = maxPriceInput.value.trim();
  renderCars();
});

async function init() {
  loadAdminState();
  loadWebhookSetting();
  state.useCloud = cloudConfigured();
  updateDataModeUI();

  try {
    await loadCars();
  } catch (error) {
    state.useCloud = false;
    updateDataModeUI();
    loadCarsFromLocal();
    alert(`${error.message} Falling back to local browser storage.`);
  }

  renderCars();
}

init();
