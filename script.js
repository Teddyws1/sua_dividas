(() => {
  const toggleThemeBtn = document.getElementById("toggle-theme");
  const body = document.body;
  const tabs = document.querySelectorAll("nav.tabs button");
  const tabContents = document.querySelectorAll(".tab-content");
  const form = document.getElementById("debt-form");
  const debtsList = document.getElementById("debts-list");
  const modalOverlay = document.getElementById("modal-overlay");
  const modalClose = document.getElementById("modal-close");
  const modalDetails = document.getElementById("modal-description");
  const container = document.querySelector(".container");
  const footer = document.querySelector("footer.footer");

  // Modal editar parcelas
  const modalEditInstallmentsOverlay = document.getElementById(
    "modal-edit-installments-overlay"
  );
  const modalEditInstallmentsClose = document.getElementById(
    "modal-edit-installments-close"
  );
  const installmentsListElem = document.getElementById("installments-list");

  let debts = JSON.parse(localStorage.getItem("debts")) || [];
  let lastFocusedElement = null;
  let currentEditingIndex = null;

  // Atualiza lista histórico
  function renderDebts() {
    debtsList.innerHTML = "";
    debts.forEach((d, i) => {
      const tr = document.createElement("tr");
      tr.tabIndex = 0; // acessível com teclado
      tr.setAttribute("role", "row");
      tr.innerHTML = `
        <td>${d.companyName}</td>
        <td>${d.description}</td>
        <td>R$ ${Number(d.value).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}</td>
        <td>${d.installments}x</td>
        <td>${d.installmentsPaid}</td>
        <td>${d.paid ? "Pago" : "Pendente"}</td>
        <td>
          <button aria-label="Ver detalhes da dívida ${
            d.description
          }" data-index="${i}" class="btn-details">Detalhes</button>
          <button aria-label="Editar parcelas da dívida ${
            d.description
          }" data-index="${i}" class="btn-edit-installments">Editar Parcelas</button>
          <button aria-label="Excluir dívida ${
            d.description
          }" data-index="${i}" class="btn-delete">Excluir</button>
        </td>
      `;
      debtsList.appendChild(tr);
    });
  }

  // Salvar no localStorage
  function saveDebts() {
    localStorage.setItem("debts", JSON.stringify(debts));
  }

  // Alterna tema claro/escuro
  toggleThemeBtn.addEventListener("click", () => {
    if (body.dataset.theme === "light") {
      body.dataset.theme = "dark";
      toggleThemeBtn.textContent = "Modo Claro";
      toggleThemeBtn.dataset.theme = "dark";
      toggleThemeBtn.innerHTML += `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M21 12.79A9 9 0 0112.21 3a7 7 0 001.8 13.8 7 7 0 006.2-4z"/>
        </svg>
      `;
    } else {
      body.dataset.theme = "light";
      toggleThemeBtn.textContent = "Modo Escuro";
      toggleThemeBtn.dataset.theme = "light";
      toggleThemeBtn.innerHTML += `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M21 12.79A9 9 0 0112.21 3a7 7 0 001.8 13.8 7 7 0 006.2-4z"/>
        </svg>
      `;
    }
  });

  // Navegação das abas
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      tabContents.forEach((content) => (content.hidden = true));

      const id = btn.getAttribute("aria-controls");
      document.getElementById(id).hidden = false;
    });
  });

  // Validar e adicionar dívida
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Captura dados
    const creditorType = form["creditor-type"].value;
    const companyName = form["company-name"].value.trim();
    const description = form["debt-description"].value.trim();
    const value = parseFloat(form["debt-value"].value);
    const paymentMethod = form["payment-method"].value;
    const debtType = form["debt-type"].value;
    const issueDate = form["issue-date"].value;
    const dueDate = form["due-date"].value;
    const installments = parseInt(form["installments"].value);
    const installmentsPaid = parseInt(form["installments-paid"].value);
    const paid = form["debt-paid"].checked;

    if (
      !creditorType ||
      !companyName ||
      !description ||
      isNaN(value) ||
      value <= 0 ||
      !paymentMethod ||
      !debtType ||
      !issueDate ||
      !dueDate ||
      isNaN(installments) ||
      isNaN(installmentsPaid)
    ) {
      alert("Por favor, preencha todos os campos corretamente.");
      return;
    }
    if (installmentsPaid > installments) {
      alert("Parcelas pagas não podem ser maiores que o número de parcelas.");
      return;
    }

    // Salvar dívida
    debts.push({
      creditorType,
      companyName,
      description,
      value,
      paymentMethod,
      debtType,
      issueDate,
      dueDate,
      installments,
      installmentsPaid,
      paid,
    });
    saveDebts();
    renderDebts();
    form.reset();
  });

  // Delegação para detalhes, editar parcelas e excluir na tabela
  debtsList.addEventListener("click", (e) => {
    const index = Number(e.target.dataset.index);
    if (e.target.classList.contains("btn-details")) {
      openDetailModal(index);
    } else if (e.target.classList.contains("btn-edit-installments")) {
      openEditInstallmentsModal(index);
    } else if (e.target.classList.contains("btn-delete")) {
      if (confirm("Deseja realmente excluir esta dívida?")) {
        debts.splice(index, 1);
        saveDebts();
        renderDebts();
      }
    }
  });

  // Abrir modal detalhes
  function openDetailModal(index) {
    const d = debts[index];
    if (!d) return;

    modalDetails.innerHTML = `
      <dt>Tipo do Credor:</dt><dd>${d.creditorType}</dd>
      <dt>Nome da Empresa / Pessoa:</dt><dd>${d.companyName}</dd>
      <dt>Descrição da Dívida:</dt><dd>${d.description}</dd>
      <dt>Valor Total:</dt><dd>R$ ${Number(d.value).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}</dd>
      <dt>Forma de Pagamento:</dt><dd>${d.paymentMethod}</dd>
      <dt>Tipo da Dívida:</dt><dd>${d.debtType}</dd>
      <dt>Data de Emissão:</dt><dd>${d.issueDate}</dd>
      <dt>Data Prevista para Pagamento:</dt><dd>${d.dueDate}</dd>
      <dt>Parcelas:</dt><dd>${d.installments}x</dd>
      <dt>Parcelas Pagas:</dt><dd>${d.installmentsPaid}</dd>
      <dt>Status:</dt><dd>${d.paid ? "Pago" : "Pendente"}</dd>
    `;

    lastFocusedElement = document.activeElement;
    modalOverlay.classList.add("active");

    container.classList.add("blur-on-modal");
    footer.classList.add("blur-on-modal");

    modalClose.focus();
  }

  // Fechar modal detalhes
  function closeDetailModal() {
    modalOverlay.classList.remove("active");
    container.classList.remove("blur-on-modal");
    footer.classList.remove("blur-on-modal");

    if (lastFocusedElement) lastFocusedElement.focus();
  }

  modalClose.addEventListener("click", closeDetailModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeDetailModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
      closeDetailModal();
    }
  });

  // Abrir modal editar parcelas
  function openEditInstallmentsModal(index) {
    currentEditingIndex = index;
    const d = debts[index];
    if (!d) return;

    installmentsListElem.innerHTML = "";
    // Cada parcela vira um checkbox, marcando as já pagas
    for (let i = 1; i <= d.installments; i++) {
      const isChecked = i <= d.installmentsPaid;
      const li = document.createElement("li");
      li.innerHTML = `
        <input type="checkbox" id="installment-${i}" data-installment="${i}" ${
        isChecked ? "checked" : ""
      } />
        <label for="installment-${i}">Parcela ${i}</label>
      `;
      installmentsListElem.appendChild(li);
    }

    lastFocusedElement = document.activeElement;
    modalEditInstallmentsOverlay.style.display = "flex";

    container.classList.add("blur-on-modal");
    footer.classList.add("blur-on-modal");

    modalEditInstallmentsClose.focus();
  }

  // Fechar modal editar parcelas
  function closeEditInstallmentsModal() {
    modalEditInstallmentsOverlay.style.display = "none";
    container.classList.remove("blur-on-modal");
    footer.classList.remove("blur-on-modal");

    if (lastFocusedElement) lastFocusedElement.focus();
    currentEditingIndex = null;
  }

  modalEditInstallmentsClose.addEventListener(
    "click",
    closeEditInstallmentsModal
  );
  modalEditInstallmentsOverlay.addEventListener("click", (e) => {
    if (e.target === modalEditInstallmentsOverlay) closeEditInstallmentsModal();
  });
  window.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      modalEditInstallmentsOverlay.style.display === "flex"
    ) {
      closeEditInstallmentsModal();
    }
  });

  // Atualizar parcelas pagas ao clicar nos checkboxes dentro do modal editar parcelas
  installmentsListElem.addEventListener("change", (e) => {
    if (
      e.target &&
      e.target.type === "checkbox" &&
      currentEditingIndex !== null
    ) {
      const d = debts[currentEditingIndex];
      if (!d) return;

      // Contar quantas parcelas estão marcadas
      const checkedCount = installmentsListElem.querySelectorAll(
        'input[type="checkbox"]:checked'
      ).length;

      // Atualiza parcelas pagas
      d.installmentsPaid = checkedCount;

      // Atualiza status dívida paga
      d.paid = checkedCount === d.installments;

      // Atualiza campo readonly no formulário (caso aberto)
      document.getElementById("installments-paid").value = d.installmentsPaid;

      saveDebts();
      renderDebts();
    }
  });

  // Inicializa a lista na carga
  renderDebts();
})();

// detecta a largura do dispositivo e reforça o bloqueio
(function () {
  function bloquearScrollHorizontal() {
    // Aplica direto no style inline para ter prioridade
    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";
    document.documentElement.style.width = "100vw";
    document.body.style.width = "100vw";
  }

  // Bloqueia scroll na carga da página
  window.addEventListener("load", bloquearScrollHorizontal);

  // Também bloqueia se a janela mudar de tamanho (ex: rotacionar celular)
  window.addEventListener("resize", bloquearScrollHorizontal);

  // Bloqueia imediatamente caso seja executado após carregamento
  bloquearScrollHorizontal();
})();
//animação de icone de download
const startBtn = document.getElementById("start-download");
const cancelBtn = document.getElementById("stop-download");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const downloadLink = document.getElementById("download-link");

let progress = 0;
let interval = null;

startBtn.addEventListener("click", () => {
  progress = 0;
  progressContainer.style.display = "block";
  progressBar.style.width = "0%";
  progressText.textContent = "0%";
  startBtn.disabled = true;

  interval = setInterval(() => {
    progress += 5;
    if (progress > 100) progress = 100;

    progressBar.style.width = progress + "%";
    progressText.textContent = progress + "%";

    if (progress >= 100) {
      clearInterval(interval);
      downloadLink.click();
      startBtn.disabled = false;

      setTimeout(() => {
        progressContainer.style.display = "none";
        progressBar.style.width = "0%";
        progressText.textContent = "0%";
      }, 1500);
    }
  }, 100);
});

// Cancelar Download
cancelBtn.addEventListener("click", () => {
  clearInterval(interval);
  progress = 0;
  progressBar.style.width = "0%";
  progressText.textContent = "0%";
  progressContainer.style.display = "none";
  startBtn.disabled = false;
});

//anotação
const addNoteBtn = document.getElementById("add-note");
const notesContainer = document.getElementById("notes-container");

let notes = JSON.parse(localStorage.getItem("notes")) || [];

function saveNotes() {
  const noteData = Array.from(notesContainer.children).map((note, index) => ({
    title: note.querySelector(".note-title").value,
    content: note.querySelector(".note-content").innerHTML,
    order: index,
  }));
  localStorage.setItem("notes", JSON.stringify(noteData));
}

function createNote(title = "Nova Nota", content = "") {
  const note = document.createElement("div");
  note.classList.add("note");

  note.innerHTML = `
        <div class="note-header">
            <input type="text" value="${title}" class="note-title"/>
            <div class="color-buttons">
                <button class="rename">Renomear</button>
                <button class="color" data-color="yellow" style="background:yellow"></button>
                <button class="color" data-color="lightgreen" style="background:lightgreen"></button>
                <button class="color" data-color="lightblue" style="background:lightblue"></button>
                <button class="color" data-color="pink" style="background:pink"></button>
                <button class="delete" style="background:red; color:white">X</button>
            </div>
        </div>
        <div class="note-content" contenteditable="true">${content}</div>
    `;

  const titleInput = note.querySelector(".note-title");
  const contentDiv = note.querySelector(".note-content");

  titleInput.addEventListener("input", saveNotes);
  contentDiv.addEventListener("input", saveNotes);

  note
    .querySelector(".rename")
    .addEventListener("click", () => titleInput.focus());

  note.querySelectorAll(".color").forEach((btn) => {
    btn.addEventListener("click", () =>
      highlightSelection(contentDiv, btn.dataset.color)
    );
  });

  note.querySelector(".delete").addEventListener("click", () => {
    note.remove();
    saveNotes();
  });

  // Drag & Drop
  note.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", null);
    note.classList.add("dragging");
  });
  note.addEventListener("dragend", () => {
    note.classList.remove("dragging");
    saveNotes();
  });

  notesContainer.appendChild(note);
  return note;
}

function highlightSelection(container, color) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer) || range.collapsed)
    return;

  const span = document.createElement("span");
  span.style.backgroundColor = color;
  span.textContent = range.toString();

  range.deleteContents();
  range.insertNode(span);
  selection.removeAllRanges();
  saveNotes();
}

// Renderiza notas salvas
notes
  .sort((a, b) => a.order - b.order)
  .forEach((n) => createNote(n.title, n.content));

addNoteBtn.addEventListener("click", () => createNote());

notesContainer.addEventListener("dragover", (e) => {
  e.preventDefault();
  const dragging = document.querySelector(".dragging");
  const afterElement = getDragAfterElement(notesContainer, e.clientY);
  if (afterElement == null) {
    notesContainer.appendChild(dragging);
  } else {
    notesContainer.insertBefore(dragging, afterElement);
  }
});

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".note:not(.dragging)"),
  ];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}
//janela de aviso
// Elementos
const uaOpen = document.getElementById("uaOpen");
const uaOverlay = document.getElementById("uaOverlay");
const uaModal = document.getElementById("uaModal");
const uaClose = document.getElementById("uaClose");

let uaLastActive = null;

// Foco ciclável dentro do modal
function trapFocus(container, e) {
  if (e.key !== "Tab") return;
  const focusables = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    last.focus();
    e.preventDefault();
  } else if (!e.shiftKey && document.activeElement === last) {
    first.focus();
    e.preventDefault();
  }
}

// Abrir
function uaOpenModal() {
  uaLastActive = document.activeElement;
  uaOverlay.classList.add("is-open");
  // animação do box
  requestAnimationFrame(() => uaModal.classList.add("is-in"));
  // trava scroll da página, se existir body
  try {
    document.body.style.overflow = "hidden";
  } catch (e) {}
  // foco inicial
  setTimeout(() => uaClose.focus(), 10);

  uaOverlay.addEventListener("keydown", onKeydown);
}

// Fechar
function uaCloseModal() {
  uaModal.classList.remove("is-in");
  setTimeout(() => {
    uaOverlay.classList.remove("is-open");
    try {
      document.body.style.overflow = "";
    } catch (e) {}
    if (uaLastActive) uaLastActive.focus();
  }, 280);
  uaOverlay.removeEventListener("keydown", onKeydown);
}

// Handlers
function onKeydown(e) {
  if (e.key === "Escape") {
    uaCloseModal();
    return;
  }
  trapFocus(uaModal, e);
}

// Eventos
uaOpen.addEventListener("click", uaOpenModal);
uaClose.addEventListener("click", uaCloseModal);
uaOverlay.addEventListener("click", (e) => {
  if (e.target === uaOverlay) uaCloseModal(); // clique fora fecha
});
// cursor personalizando
const clickCursor = document.getElementById("click-cursor");

document.addEventListener("mousedown", (e) => {
  // Posicionar o cursor animado onde clicou
  clickCursor.style.left = e.clientX + "px";
  clickCursor.style.top = e.clientY + "px";

  // Ativar a animação
  clickCursor.classList.add("active");

  // Remover a classe depois da animação
  setTimeout(() => clickCursor.classList.remove("active"), 300);
});

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.tab;

    tabContents.forEach((tab) => {
      tab.style.display = tab.id === target ? "block" : "none";
    });
  });
});
