const menuButton = document.querySelector("#menuButton");
const navLinks = document.querySelectorAll(".main-nav a");
const editableFields = document.querySelectorAll("[data-save]");
const imageInputs = document.querySelectorAll(".image-input");

menuButton.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("menu-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menu");
  });
});

editableFields.forEach((field) => {
  const key = `alumivarais-${field.dataset.save}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    field.value = saved;
  }
  field.addEventListener("input", () => {
    localStorage.setItem(key, field.value);
  });
});

imageInputs.forEach((input, index) => {
  const preview = input.parentElement.querySelector(".image-preview, .avatar-preview");
  const key = `alumivarais-image-${index}`;
  const savedImage = localStorage.getItem(key);
  if (savedImage && preview) {
    setPreview(preview, savedImage);
  }

  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file || !preview) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Escolha um arquivo de imagem.");
      input.value = "";
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setPreview(preview, reader.result);
      try {
        localStorage.setItem(key, reader.result);
      } catch {
        alert("Imagem muito grande para salvar neste navegador. Use uma imagem menor ou otimize o arquivo.");
      }
    });
    reader.readAsDataURL(file);
  });
});

function setPreview(preview, imageUrl) {
  preview.style.backgroundImage = `url("${imageUrl}")`;
  preview.classList.add("has-image");
}
