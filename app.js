const today = new Date();
const isoToday = today.toISOString().slice(0, 10);

const initialState = {
  clients: [
    { id: crypto.randomUUID(), name: "Ana Paula", phone: "5511999991111" },
    { id: crypto.randomUUID(), name: "Carlos Mendes", phone: "5511988882222" },
    { id: crypto.randomUUID(), name: "Marina Costa", phone: "5511977773333" }
  ],
  appointments: []
};

initialState.appointments = [
  {
    id: crypto.randomUUID(),
    clientId: initialState.clients[0].id,
    service: "Manicure completa",
    date: isoToday,
    time: "09:00",
    price: 85,
    paid: false
  },
  {
    id: crypto.randomUUID(),
    clientId: initialState.clients[1].id,
    service: "Corte e barba",
    date: isoToday,
    time: "14:30",
    price: 70,
    paid: true
  },
  {
    id: crypto.randomUUID(),
    clientId: initialState.clients[2].id,
    service: "Aula particular",
    date: addDays(1),
    time: "17:00",
    price: 120,
    paid: false
  }
];

const state = loadState();
let activeFilter = "all";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const elements = {
  navButtons: document.querySelectorAll(".nav-button"),
  views: document.querySelectorAll(".view"),
  scheduleList: document.querySelector("#scheduleList"),
  clientList: document.querySelector("#clientList"),
  paymentList: document.querySelector("#paymentList"),
  clientForm: document.querySelector("#clientForm"),
  appointmentForm: document.querySelector("#appointmentForm"),
  appointmentClient: document.querySelector("#appointmentClient"),
  appointmentModal: document.querySelector("#appointmentModal"),
  todayCount: document.querySelector("#todayCount"),
  pendingTotal: document.querySelector("#pendingTotal"),
  clientCount: document.querySelector("#clientCount"),
  reminderCount: document.querySelector("#reminderCount"),
  exportButton: document.querySelector("#exportButton")
};

document.querySelector("[data-open-modal]").addEventListener("click", openAppointmentModal);
document.querySelector("[data-close-modal]").addEventListener("click", () => elements.appointmentModal.close());
elements.clientForm.addEventListener("submit", addClient);
elements.appointmentForm.addEventListener("submit", addAppointment);
elements.exportButton.addEventListener("click", exportSummary);

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segment").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderSchedule();
  });
});

elements.navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.dataset.view;
    elements.navButtons.forEach((item) => item.classList.toggle("active", item === button));
    elements.views.forEach((item) => item.classList.toggle("active", item.id === view));
  });
});

render();

function loadState() {
  const saved = localStorage.getItem("agendapro-state");
  if (!saved) {
    return structuredClone(initialState);
  }

  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  localStorage.setItem("agendapro-state", JSON.stringify(state));
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getClient(clientId) {
  return state.clients.find((client) => client.id === clientId) || {
    name: "Cliente removido",
    phone: ""
  };
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  });
}

function render() {
  renderMetrics();
  renderSchedule();
  renderClients();
  renderPayments();
  renderClientOptions();
}

function renderMetrics() {
  const todayAppointments = state.appointments.filter((appointment) => appointment.date === isoToday);
  const pending = state.appointments.filter((appointment) => !appointment.paid);
  const pendingTotal = pending.reduce((total, appointment) => total + Number(appointment.price), 0);

  elements.todayCount.textContent = todayAppointments.length;
  elements.pendingTotal.textContent = currency.format(pendingTotal);
  elements.clientCount.textContent = state.clients.length;
  elements.reminderCount.textContent = pending.length;
}

function renderSchedule() {
  const appointments = getFilteredAppointments().sort(sortByDateTime);

  if (!appointments.length) {
    elements.scheduleList.innerHTML = '<div class="empty-state">Nenhum horario encontrado para este filtro.</div>';
    return;
  }

  elements.scheduleList.innerHTML = appointments.map((appointment) => {
    const client = getClient(appointment.clientId);
    return `
      <article class="appointment">
        <div class="date-pill">
          <small>${formatDate(appointment.date).split(",")[0]}</small>
          <span>${formatDate(appointment.date).replace(",", "")}</span>
          <small>${appointment.time}</small>
        </div>
        <div>
          <h3>${escapeHtml(client.name)} - ${escapeHtml(appointment.service)}</h3>
          <p class="meta">${currency.format(Number(appointment.price))} · WhatsApp ${escapeHtml(client.phone)}</p>
        </div>
        <div>
          <span class="status ${appointment.paid ? "paid" : "pending"}">${appointment.paid ? "Pago" : "Pendente"}</span>
          ${!appointment.paid ? `<a class="whatsapp-link" href="${buildWhatsAppLink(client, appointment)}" target="_blank" rel="noreferrer">Lembrar</a>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

function getFilteredAppointments() {
  if (activeFilter === "today") {
    return state.appointments.filter((appointment) => appointment.date === isoToday);
  }
  if (activeFilter === "pending") {
    return state.appointments.filter((appointment) => !appointment.paid);
  }
  return state.appointments;
}

function renderClients() {
  if (!state.clients.length) {
    elements.clientList.innerHTML = '<div class="empty-state">Cadastre seu primeiro cliente.</div>';
    return;
  }

  elements.clientList.innerHTML = state.clients.map((client) => {
    const count = state.appointments.filter((appointment) => appointment.clientId === client.id).length;
    return `
      <article class="client-row">
        <div>
          <h3>${escapeHtml(client.name)}</h3>
          <p class="meta">WhatsApp ${escapeHtml(client.phone)} · ${count} atendimento${count === 1 ? "" : "s"}</p>
        </div>
        <a class="whatsapp-link" href="https://wa.me/${client.phone}" target="_blank" rel="noreferrer">WhatsApp</a>
        <button class="text-button" type="button" data-delete-client="${client.id}">Remover</button>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-delete-client]").forEach((button) => {
    button.addEventListener("click", () => deleteClient(button.dataset.deleteClient));
  });
}

function renderPayments() {
  const pending = state.appointments.filter((appointment) => !appointment.paid).sort(sortByDateTime);

  if (!pending.length) {
    elements.paymentList.innerHTML = '<div class="empty-state">Nenhum pagamento pendente.</div>';
    return;
  }

  elements.paymentList.innerHTML = pending.map((appointment) => {
    const client = getClient(appointment.clientId);
    return `
      <article class="payment-row">
        <div>
          <h3>${escapeHtml(client.name)} - ${escapeHtml(appointment.service)}</h3>
          <p class="meta">${formatDate(appointment.date)} as ${appointment.time}</p>
        </div>
        <strong>${currency.format(Number(appointment.price))}</strong>
        <button class="text-button" type="button" data-mark-paid="${appointment.id}">Marcar pago</button>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-mark-paid]").forEach((button) => {
    button.addEventListener("click", () => markPaid(button.dataset.markPaid));
  });
}

function renderClientOptions() {
  elements.appointmentClient.innerHTML = state.clients.map((client) => (
    `<option value="${client.id}">${escapeHtml(client.name)}</option>`
  )).join("");
}

function addClient(event) {
  event.preventDefault();
  const name = document.querySelector("#clientName").value.trim();
  const phone = document.querySelector("#clientPhone").value.replace(/\D/g, "");

  if (!name || !phone) {
    return;
  }

  state.clients.push({ id: crypto.randomUUID(), name, phone });
  saveState();
  elements.clientForm.reset();
  render();
}

function deleteClient(clientId) {
  const hasAppointments = state.appointments.some((appointment) => appointment.clientId === clientId);
  if (hasAppointments) {
    alert("Este cliente possui horarios cadastrados. Remova ou conclua os horarios antes.");
    return;
  }

  state.clients = state.clients.filter((client) => client.id !== clientId);
  saveState();
  render();
}

function openAppointmentModal() {
  if (!state.clients.length) {
    alert("Cadastre um cliente antes de criar um horario.");
    return;
  }

  document.querySelector("#appointmentDate").value = isoToday;
  elements.appointmentModal.showModal();
}

function addAppointment(event) {
  event.preventDefault();
  state.appointments.push({
    id: crypto.randomUUID(),
    clientId: document.querySelector("#appointmentClient").value,
    service: document.querySelector("#appointmentService").value.trim(),
    date: document.querySelector("#appointmentDate").value,
    time: document.querySelector("#appointmentTime").value,
    price: Number(document.querySelector("#appointmentPrice").value),
    paid: document.querySelector("#appointmentPaid").checked
  });

  saveState();
  elements.appointmentForm.reset();
  elements.appointmentModal.close();
  render();
}

function markPaid(appointmentId) {
  const appointment = state.appointments.find((item) => item.id === appointmentId);
  if (!appointment) {
    return;
  }
  appointment.paid = true;
  saveState();
  render();
}

function sortByDateTime(a, b) {
  return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
}

function buildWhatsAppLink(client, appointment) {
  const text = `Oi ${client.name}, passando para lembrar do seu horario de ${appointment.service} no dia ${formatDate(appointment.date)} as ${appointment.time}. Valor pendente: ${currency.format(Number(appointment.price))}.`;
  return `https://wa.me/${client.phone}?text=${encodeURIComponent(text)}`;
}

function exportSummary() {
  const pendingTotal = state.appointments
    .filter((appointment) => !appointment.paid)
    .reduce((total, appointment) => total + Number(appointment.price), 0);

  const summary = [
    "Resumo AgendaPro",
    `Clientes: ${state.clients.length}`,
    `Atendimentos: ${state.appointments.length}`,
    `Pagamentos pendentes: ${currency.format(pendingTotal)}`
  ].join("\n");

  navigator.clipboard.writeText(summary).then(() => {
    alert("Resumo copiado para a area de transferencia.");
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
