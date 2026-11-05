"use strict";
// Estado acadêmico e autenticação permanecem no servidor.
document.querySelectorAll("form").forEach(form => {
  form.addEventListener("submit", () => {
    const button = form.querySelector("button");
    if (!button) return;
    button.disabled = true;
    if (form.action.endsWith("/start")) button.textContent = "Preparando ambiente…";
  });
});
