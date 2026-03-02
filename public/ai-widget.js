document.addEventListener("DOMContentLoaded", () => {
  const fab = document.getElementById("ai-fab");
  const panel = document.getElementById("ai-panel");
  const closeBtn = document.getElementById("ai-close");
  const form = document.getElementById("ai-form");
  const input = document.getElementById("ai-input");
  const messages = document.getElementById("ai-messages");
  const chips = document.querySelectorAll(".ai-chip");

  console.log("[AI] ai-widget.js loaded ✅");

  if (!fab || !panel) return;

  function openPanel() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    input?.focus();
  }

  function closePanel() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  fab.addEventListener("click", (e) => {
    e.preventDefault();
    panel.classList.contains("open") ? closePanel() : openPanel();
  });

  closeBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    closePanel();
  });

  function addMessage(text, who) {
    const div = document.createElement("div");
    div.className = `ai-message ${who === "user" ? "ai-user" : "ai-bot"}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendMessage(text) {
    addMessage(text, "user");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.details
          ? `${data.error} (${data.status || res.status}) : ${data.details}`
          : `Erreur serveur /api/chat (${res.status})`;
        addMessage(msg, "bot");
        return;
      }

      addMessage(data.reply ?? "Je n’ai pas de réponse pour le moment.", "bot");
    } catch (err) {
      console.error("[AI] network error", err);
      addMessage("Erreur réseau (serveur indisponible).", "bot");
    }
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    openPanel();
    sendMessage(text);
  });

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const q = chip.dataset.q || "";
      if (!q) return;
      openPanel();
      sendMessage(q);
    });
  });
});