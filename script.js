const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1484299001812746281/9Yi5X_xfVcWdXxLP4Xk1MpJwMxaaudI-qhYQ0bVOp4hVAXNXIRvfurSXvtL6UMwDKZda";

const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
const galleryGrid = document.getElementById("galleryGrid");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");
const requestForm = document.getElementById("requestForm");
const formStatus = document.getElementById("formStatus");

navToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

navLinks.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    navLinks.classList.remove("open");
  }
});

galleryGrid.addEventListener("click", (event) => {
  const image = event.target.closest("img");
  if (!image) {
    return;
  }

  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
});

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.src = "";
}

lightboxClose.addEventListener("click", closeLightbox);

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLightbox();
  }
});

async function sendDiscordRequest(payload) {
  const content = [
    "New Service Request:",
    `Name: ${payload.name}`,
    `Contact: ${payload.contact}`,
    `Subject: ${payload.subject}`,
    `Message: ${payload.message}`,
  ].join("\n");

  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error("Failed to send the request. Please try again.");
  }
}

requestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = "Sending your request...";

  const payload = {
    name: document.getElementById("name").value.trim(),
    contact: document.getElementById("contactInfo").value.trim(),
    subject: document.getElementById("subject").value.trim(),
    message: document.getElementById("message").value.trim(),
  };

  try {
    await sendDiscordRequest(payload);
    formStatus.textContent =
      "Request sent successfully. Our team will contact you soon.";
    requestForm.reset();
  } catch (error) {
    formStatus.textContent = error.message;
  }
});
