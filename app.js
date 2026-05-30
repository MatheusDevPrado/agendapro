const today = new Date();
const isoToday = today.toISOString().slice(0, 10);
const appConfig = window.AGENDAPRO_CONFIG || {};
const supabaseClient = window.supabase && appConfig.supabaseUrl && appConfig.supabaseAnonKey
  ? window.supabase.createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey)
  : null;
let currentUser = null;
let syncTimer = null;

const initialState = {
  business: { name: "AgendaPro", phone: "5511999990000" },
  profile: {
    name: "MatheusDevPrado",
    phone: "5511999990000",
    email: "contato@email.com",
    about: "Agenda inteligente para pequenos negocios brasileiros.",
    photo: "",
    plan: "Sistema ativo",
    loggedIn: false,
    settings: {
      notifyWhatsapp: true,
      showBrand: true,
      compactMode: false
    }
  },
  accounts: [
    {
      name: "MatheusDevPrado",
      email: "contato@email.com",
      password: "123456"
    }
  ],
  services: [
    { id: crypto.randomUUID(), name: "Manicure completa", duration: 60, price: 85 },
    { id: crypto.randomUUID(), name: "Corte e barba", duration: 45, price: 70 },
    { id: crypto.randomUUID(), name: "Escova modelada", duration: 50, price: 95 }
  ],
  professionals: [
    { id: crypto.randomUUID(), name: "Juliana", role: "Manicure", commission: 40 },
    { id: crypto.randomUUID(), name: "Rafael", role: "Barbeiro", commission: 45 },
    { id: crypto.randomUUID(), name: "Marina", role: "Cabeleireira", commission: 40 }
  ],
  clients: [
    { id: crypto.randomUUID(), name: "Ana Paula", phone: "5511999991111", tag: "Recorrente" },
    { id: crypto.randomUUID(), name: "Carlos Mendes", phone: "5511988882222", tag: "VIP" },
    { id: crypto.randomUUID(), name: "Marina Costa", phone: "5511977773333", tag: "Cliente ativo" }
  ],
  appointments: []
};

initialState.appointments = [
  {
    id: crypto.randomUUID(),
    clientId: initialState.clients[0].id,
    service: "Manicure completa",
    professional: "Juliana",
    date: isoToday,
    time: "09:00",
    price: 85,
    paid: false,
    status: "scheduled",
    paymentMethod: "",
    transactionId: "",
    paidAt: ""
  },
  {
    id: crypto.randomUUID(),
    clientId: initialState.clients[1].id,
    service: "Corte e barba",
    professional: "Rafael",
    date: isoToday,
    time: "14:30",
    price: 70,
    paid: true,
    status: "completed",
    paymentMethod: "pix",
    transactionId: "PIX-DEMO-001",
    paidAt: isoToday
  },
  {
    id: crypto.randomUUID(),
    clientId: initialState.clients[2].id,
    service: "Escova modelada",
    professional: "Marina",
    date: addDays(1),
    time: "17:00",
    price: 95,
    paid: false,
    status: "scheduled",
    paymentMethod: "",
    transactionId: "",
    paidAt: ""
  }
];

let state = normalizeState(loadState());
let activeFilter = "all";
let scheduleSearch = "";
let clientSearch = "";
const clientProfiles = ["Cliente ativo", "VIP", "Recorrente", "Retorno", "Inativo"];

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
  serviceForm: document.querySelector("#serviceForm"),
  serviceList: document.querySelector("#serviceList"),
  serviceName: document.querySelector("#serviceName"),
  serviceDuration: document.querySelector("#serviceDuration"),
  servicePrice: document.querySelector("#servicePrice"),
  professionalForm: document.querySelector("#professionalForm"),
  professionalList: document.querySelector("#professionalList"),
  professionalName: document.querySelector("#professionalName"),
  professionalRole: document.querySelector("#professionalRole"),
  professionalCommission: document.querySelector("#professionalCommission"),
  appointmentForm: document.querySelector("#appointmentForm"),
  appointmentClient: document.querySelector("#appointmentClient"),
  appointmentModal: document.querySelector("#appointmentModal"),
  appointmentModalTitle: document.querySelector("#appointmentModalTitle"),
  deleteAppointment: document.querySelector("#deleteAppointment"),
  reportMonth: document.querySelector("#reportMonth"),
  reportSummary: document.querySelector("#reportSummary"),
  reportTable: document.querySelector("#reportTable"),
  downloadReport: document.querySelector("#downloadReport"),
  clearReportMonth: document.querySelector("#clearReportMonth"),
  scheduleSearch: document.querySelector("#scheduleSearch"),
  clientSearch: document.querySelector("#clientSearch"),
  businessForm: document.querySelector("#businessForm"),
  businessName: document.querySelector("#businessName"),
  businessPhone: document.querySelector("#businessPhone"),
  businessTitle: document.querySelector("#businessTitle"),
  profileForm: document.querySelector("#profileForm"),
  profilePhoto: document.querySelector("#profilePhoto"),
  profileName: document.querySelector("#profileName"),
  profilePhone: document.querySelector("#profilePhone"),
  profileEmail: document.querySelector("#profileEmail"),
  profileAbout: document.querySelector("#profileAbout"),
  profileDisplayName: document.querySelector("#profileDisplayName"),
  profileDisplayEmail: document.querySelector("#profileDisplayEmail"),
  profilePlan: document.querySelector("#profilePlan"),
  avatarPreview: document.querySelector("#avatarPreview"),
  notifyWhatsapp: document.querySelector("#notifyWhatsapp"),
  showBrand: document.querySelector("#showBrand"),
  compactMode: document.querySelector("#compactMode"),
  authStatus: document.querySelector("#authStatus"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  loginButton: document.querySelector("#loginButton"),
  createAccountButton: document.querySelector("#createAccountButton"),
  syncCloudButton: document.querySelector("#syncCloudButton"),
  domainStatus: document.querySelector("#domainStatus"),
  paymentApiStatus: document.querySelector("#paymentApiStatus"),
  databaseStatus: document.querySelector("#databaseStatus"),
  logoutButton: document.querySelector("#logoutButton"),
  deleteAccountButton: document.querySelector("#deleteAccountButton"),
  todayCount: document.querySelector("#todayCount"),
  pendingTotal: document.querySelector("#pendingTotal"),
  clientCount: document.querySelector("#clientCount"),
  reminderCount: document.querySelector("#reminderCount"),
  exportButton: document.querySelector("#exportButton")
};

document.querySelector("[data-open-modal]").addEventListener("click", () => openAppointmentModal());
document.querySelector("[data-close-modal]").addEventListener("click", () => elements.appointmentModal.close());
elements.clientForm.addEventListener("submit", addClient);
elements.serviceForm.addEventListener("submit", addService);
elements.professionalForm.addEventListener("submit", addProfessional);
elements.appointmentForm.addEventListener("submit", saveAppointment);
elements.businessForm.addEventListener("submit", saveBusiness);
elements.profileForm.addEventListener("submit", saveProfile);
elements.profilePhoto.addEventListener("change", updateProfilePhoto);
elements.loginButton.addEventListener("click", loginAccount);
elements.createAccountButton.addEventListener("click", createAccount);
elements.syncCloudButton.addEventListener("click", syncCloudNow);
elements.logoutButton.addEventListener("click", logoutProfile);
elements.deleteAccountButton.addEventListener("click", deleteAllData);
elements.reportMonth.addEventListener("change", renderReports);
elements.downloadReport.addEventListener("click", downloadMonthlyReport);
elements.clearReportMonth.addEventListener("click", clearReportedMonth);
elements.exportButton.addEventListener("click", exportSummary);
elements.deleteAppointment.addEventListener("click", deleteAppointment);
document.querySelector("#appointmentService").addEventListener("change", applyServiceDefaults);
elements.scheduleSearch.addEventListener("input", (event) => {
  scheduleSearch = event.target.value.trim().toLowerCase();
  renderSchedule();
});
elements.clientSearch.addEventListener("input", (event) => {
  clientSearch = event.target.value.trim().toLowerCase();
  renderClients();
});

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segment").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderSchedule();
  });
});

elements.navButtons.forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view, true));
});

render();
openInitialView();
initializeServices();

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

function normalizeState(value) {
  const normalized = {
    business: value.business || structuredClone(initialState.business),
    profile: {
      ...structuredClone(initialState.profile),
      ...(value.profile || {}),
      settings: {
        ...structuredClone(initialState.profile.settings),
        ...((value.profile && value.profile.settings) || {})
      }
    },
    accounts: Array.isArray(value.accounts) && value.accounts.length ? value.accounts : structuredClone(initialState.accounts),
    services: Array.isArray(value.services) && value.services.length ? value.services : structuredClone(initialState.services),
    professionals: Array.isArray(value.professionals) && value.professionals.length ? value.professionals : structuredClone(initialState.professionals),
    clients: Array.isArray(value.clients) ? value.clients : [],
    appointments: Array.isArray(value.appointments) ? value.appointments : []
  };

  normalized.profile.loggedIn = Boolean(value.profile && value.profile.loggedIn && currentUser);

  normalized.clients = normalized.clients.map((client) => ({
    id: client.id || crypto.randomUUID(),
    name: client.name || "Cliente",
    phone: onlyDigits(client.phone || ""),
    tag: normalizeClientProfile(client.tag)
  }));

  normalized.accounts = normalized.accounts.map((account) => ({
    name: account.name || "Usuario",
    email: String(account.email || "").trim().toLowerCase(),
    password: String(account.password || "")
  })).filter((account) => account.email && account.password);

  normalized.services = normalized.services.map((service) => ({
    id: service.id || crypto.randomUUID(),
    name: service.name || "Servico",
    duration: Number(service.duration || 30),
    price: Number(service.price || 0)
  })).filter((service) => service.name && service.duration > 0);

  normalized.professionals = normalized.professionals.map((professional) => ({
    id: professional.id || crypto.randomUUID(),
    name: professional.name || "Profissional",
    role: professional.role || "Atendimento",
    commission: Number(professional.commission || 0)
  })).filter((professional) => professional.name);

  normalized.appointments = normalized.appointments.map((appointment) => ({
    id: appointment.id || crypto.randomUUID(),
    clientId: appointment.clientId,
    service: appointment.service || "Atendimento",
    professional: appointment.professional || "Profissional",
    date: appointment.date || isoToday,
    time: appointment.time || "09:00",
    price: Number(appointment.price || 0),
    paid: Boolean(appointment.paid),
    status: appointment.status || "scheduled",
    paymentMethod: appointment.paymentMethod || "",
    transactionId: appointment.transactionId || "",
    paidAt: appointment.paidAt || (appointment.paid ? appointment.date || isoToday : "")
  }));

  normalized.appointments.forEach((appointment) => {
    const serviceExists = normalized.services.some((service) => normalizeText(service.name) === normalizeText(appointment.service));
    if (!serviceExists) {
      normalized.services.push({
        id: crypto.randomUUID(),
        name: appointment.service,
        duration: 30,
        price: Number(appointment.price || 0)
      });
    }

    const professionalExists = normalized.professionals.some((professional) => normalizeText(professional.name) === normalizeText(appointment.professional));
    if (!professionalExists) {
      normalized.professionals.push({
        id: crypto.randomUUID(),
        name: appointment.professional,
        role: "Atendimento",
        commission: 0
      });
    }
  });

  return normalized;
}

function saveState() {
  localStorage.setItem("agendapro-state", JSON.stringify(state));
  scheduleCloudSync();
}

async function initializeServices() {
  renderIntegrationStatus();

  if (!supabaseClient) {
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    renderIntegrationStatus("Erro ao verificar login.");
    return;
  }

  currentUser = data.session && data.session.user ? data.session.user : null;

  if (currentUser) {
    state.profile.loggedIn = true;
    await pullCloudState();
    state.profile.loggedIn = true;
    saveState();
  }

  renderIntegrationStatus();
  renderProfile();
}

function renderIntegrationStatus(message = "") {
  elements.domainStatus.textContent = appConfig.productionDomain ? "Configurado" : "Aguardando";
  elements.paymentApiStatus.textContent = appConfig.paymentProvider ? "Endpoint pronto" : "API pendente";
  elements.databaseStatus.textContent = supabaseClient ? (currentUser ? "Sincronizado" : "Supabase pronto") : "Local";

  if (elements.authStatus) {
    if (!isAuthenticated()) {
      elements.authStatus.textContent = message || "Acesso bloqueado - entre com contato@email.com / 123456";
    } else if (!supabaseClient) {
      elements.authStatus.textContent = "Conta local ativa - configure Supabase para login real";
    } else if (currentUser) {
      elements.authStatus.textContent = `Conectado: ${currentUser.email}`;
    } else {
      elements.authStatus.textContent = message || "Supabase pronto - entre ou crie uma conta";
    }
  }
}

async function createAccount() {
  if (!supabaseClient) {
    const credentials = getAuthCredentials();
    if (!credentials) {
      return;
    }

    const accountExists = state.accounts.some((item) => item.email === credentials.email);
    if (accountExists) {
      alert("Ja existe uma conta local com este e-mail. Use Entrar.");
      return;
    }

    state.profile.email = credentials.email;
    state.accounts.push({
      name: credentials.email.split("@")[0],
      email: credentials.email,
      password: credentials.password
    });
    state.profile.loggedIn = true;
    saveState();
    render();
    switchView("agenda", true);
    alert("Conta local criada. Para cliente real, configure Supabase em config.js.");
    return;
  }

  const credentials = getAuthCredentials();
  if (!credentials) {
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp(credentials);
  if (error) {
    alert(error.message);
    return;
  }

  currentUser = data.user;
  state.profile.loggedIn = true;
  await pushCloudState();
  saveState();
  renderIntegrationStatus("Conta criada. Se o Supabase pedir confirmacao, confirme pelo e-mail.");
  alert("Conta criada. Se o Supabase estiver exigindo confirmacao, confirme pelo e-mail antes de entrar.");
}

async function loginAccount() {
  if (!supabaseClient) {
    const credentials = getAuthCredentials();
    if (!credentials) {
      return;
    }

    const account = state.accounts.find((item) => (
      item.email === credentials.email && item.password === credentials.password
    ));

    if (!account) {
      alert("E-mail ou senha invalidos. Use a conta salva ou crie uma nova conta.");
      return;
    }

    state.profile.name = account.name || state.profile.name;
    state.profile.email = account.email;
    state.profile.loggedIn = true;
    saveState();
    render();
    switchView("agenda", true);
    alert("Acesso local liberado. Para cliente real, configure Supabase em config.js.");
    return;
  }

  const credentials = getAuthCredentials();
  if (!credentials) {
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword(credentials);
  if (error) {
    alert(error.message);
    return;
  }

  currentUser = data.user;
  state.profile.loggedIn = true;
  await pullCloudState();
  state.profile.loggedIn = true;
  saveState();
  renderIntegrationStatus();
  render();
  switchView("agenda", true);
  alert("Conta conectada e dados sincronizados.");
}

async function syncCloudNow() {
  if (!currentUser) {
    alert("Entre com uma conta antes de sincronizar.");
    return;
  }

  await pushCloudState();
  renderIntegrationStatus();
  alert("Dados enviados para a nuvem.");
}

function getAuthCredentials() {
  const email = elements.authEmail.value.trim().toLowerCase();
  const password = elements.authPassword.value;

  if (!isValidEmail(email)) {
    alert("Informe um e-mail valido para acesso.");
    return null;
  }

  if (!password || password.length < 6) {
    alert("A senha precisa ter pelo menos 6 caracteres.");
    return null;
  }

  return { email, password };
}

function scheduleCloudSync() {
  if (!currentUser || !supabaseClient) {
    return;
  }

  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    pushCloudState();
  }, 900);
}

async function pullCloudState() {
  if (!currentUser || !supabaseClient) {
    return;
  }

  const { data, error } = await supabaseClient
    .from("workspaces")
    .select("state")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.warn("Erro ao carregar Supabase", error);
    return;
  }

  if (!data || !data.state) {
    await pushCloudState();
    return;
  }

  state = normalizeState(data.state);
  localStorage.setItem("agendapro-state", JSON.stringify(state));
}

async function pushCloudState() {
  if (!currentUser || !supabaseClient) {
    return;
  }

  const { error } = await supabaseClient
    .from("workspaces")
    .upsert({
      user_id: currentUser.id,
      state,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });

  if (error) {
    console.warn("Erro ao salvar Supabase", error);
  }
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getClient(clientId) {
  return state.clients.find((client) => client.id === clientId) || {
    name: "Cliente removido",
    phone: "",
    tag: ""
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
  renderBusiness();
  renderProfile();
  renderAccessState();
  renderMetrics();
  renderCatalog();
  renderSchedule();
  renderClients();
  renderPayments();
  renderReports();
  renderClientOptions();
  renderAppointmentOptions();
}

function renderBusiness() {
  elements.businessName.value = state.business.name;
  elements.businessPhone.value = state.business.phone;
  elements.businessTitle.textContent = state.business.name || "AgendaPro";
  if (!elements.reportMonth.value) {
    elements.reportMonth.value = isoToday.slice(0, 7);
  }
}

function renderProfile() {
  const profile = state.profile;
  elements.profileName.value = profile.name;
  elements.profilePhone.value = profile.phone;
  elements.profileEmail.value = profile.email;
  elements.profileAbout.value = profile.about;
  elements.notifyWhatsapp.checked = Boolean(profile.settings.notifyWhatsapp);
  elements.showBrand.checked = Boolean(profile.settings.showBrand);
  elements.compactMode.checked = Boolean(profile.settings.compactMode);
  elements.profileDisplayName.textContent = profile.loggedIn ? profile.name : "Perfil desconectado";
  elements.profileDisplayEmail.textContent = profile.loggedIn ? profile.email : "Entre novamente para editar";
  elements.profilePlan.textContent = "Sistema ativo";

  if (profile.photo) {
    elements.avatarPreview.innerHTML = `<img src="${profile.photo}" alt="Foto de perfil" />`;
  } else {
    elements.avatarPreview.textContent = getInitials(profile.name);
  }

  document.body.classList.toggle("compact-mode", Boolean(profile.settings.compactMode));
  document.querySelector(".footer").hidden = !profile.settings.showBrand;
}

function renderAccessState() {
  const locked = !isAuthenticated();
  document.body.classList.toggle("locked", locked);
  const activeView = document.querySelector(".view.active");
  elements.navButtons.forEach((button) => {
    const protectedView = button.dataset.view !== "perfil";
    button.disabled = locked && protectedView;
    button.classList.toggle("locked-item", locked && protectedView);
  });
  if (locked && (!activeView || activeView.id !== "perfil")) {
    switchView("perfil");
  }
  elements.logoutButton.hidden = locked;
  elements.syncCloudButton.disabled = locked || (!currentUser && Boolean(supabaseClient));
  elements.profilePlan.textContent = locked ? "Acesso bloqueado" : "Sistema ativo";
  renderIntegrationStatus();
}

function renderMetrics() {
  const activeAppointments = state.appointments.filter((appointment) => appointment.status !== "canceled");
  const todayAppointments = activeAppointments.filter((appointment) => appointment.date === isoToday);
  const pending = activeAppointments.filter((appointment) => !appointment.paid);
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
    const status = statusInfo(appointment.status, appointment.paid);
    return `
      <article class="appointment ${appointment.status}">
        <div class="date-pill">
          <small>${formatDate(appointment.date).split(",")[0]}</small>
          <span>${formatDate(appointment.date).replace(",", "")}</span>
          <small>${appointment.time}</small>
        </div>
        <div>
          <h3>${escapeHtml(client.name)} - ${escapeHtml(appointment.service)}</h3>
          <p class="meta">${currency.format(Number(appointment.price))} · ${escapeHtml(appointment.professional)} · ${escapeHtml(client.tag)} · WhatsApp ${escapeHtml(client.phone)}</p>
        </div>
        <div class="row-actions">
          <span class="status ${status.className}">${status.label}</span>
          ${appointment.status !== "canceled" && !appointment.paid ? `<a class="whatsapp-link" href="${buildWhatsAppLink(client, appointment, "reminder")}" target="_blank" rel="noreferrer">Lembrar</a>` : ""}
          ${appointment.status !== "completed" && appointment.status !== "canceled" ? `<button class="text-button" type="button" data-complete="${appointment.id}">Concluir</button>` : ""}
          ${appointment.status !== "completed" && appointment.status !== "canceled" ? `<button class="text-button danger" type="button" data-cancel="${appointment.id}">Cancelar</button>` : ""}
          <button class="text-button" type="button" data-edit-appointment="${appointment.id}">Editar</button>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-edit-appointment]").forEach((button) => {
    button.addEventListener("click", () => openAppointmentModal(button.dataset.editAppointment));
  });

  document.querySelectorAll("[data-complete]").forEach((button) => {
    button.addEventListener("click", () => completeAppointment(button.dataset.complete));
  });

  document.querySelectorAll("[data-cancel]").forEach((button) => {
    button.addEventListener("click", () => cancelAppointment(button.dataset.cancel));
  });
}

function getFilteredAppointments() {
  return state.appointments.filter((appointment) => {
    const client = getClient(appointment.clientId);
    const text = `${client.name} ${client.phone} ${client.tag} ${appointment.service} ${appointment.professional}`.toLowerCase();
    const matchesSearch = !scheduleSearch || text.includes(scheduleSearch);

    if (!matchesSearch) {
      return false;
    }

    if (activeFilter === "today") {
      return appointment.date === isoToday && appointment.status !== "canceled";
    }
    if (activeFilter === "pending") {
      return !appointment.paid && appointment.status !== "canceled";
    }
    if (activeFilter === "canceled") {
      return appointment.status === "canceled";
    }
    return true;
  });
}

function renderClients() {
  const clients = state.clients.filter((client) => {
    const text = `${client.name} ${client.phone} ${client.tag}`.toLowerCase();
    return !clientSearch || text.includes(clientSearch);
  });

  if (!clients.length) {
    elements.clientList.innerHTML = '<div class="empty-state">Nenhum cliente encontrado.</div>';
    return;
  }

  elements.clientList.innerHTML = clients.map((client) => {
    const appointments = state.appointments.filter((appointment) => appointment.clientId === client.id);
    const openValue = appointments
      .filter((appointment) => !appointment.paid && appointment.status !== "canceled")
      .reduce((total, appointment) => total + Number(appointment.price), 0);

    return `
      <article class="client-row">
        <div>
          <h3>${escapeHtml(client.name)}</h3>
          <p class="meta">${escapeHtml(client.tag)} · WhatsApp ${escapeHtml(client.phone)} · ${appointments.length} atendimento${appointments.length === 1 ? "" : "s"} · ${currency.format(openValue)} aberto</p>
        </div>
        <button class="text-button" type="button" data-new-for-client="${client.id}">Agendar</button>
        <a class="whatsapp-link" href="https://wa.me/${client.phone}" target="_blank" rel="noreferrer">WhatsApp</a>
        <button class="text-button danger" type="button" data-delete-client="${client.id}">Remover</button>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-delete-client]").forEach((button) => {
    button.addEventListener("click", () => deleteClient(button.dataset.deleteClient));
  });

  document.querySelectorAll("[data-new-for-client]").forEach((button) => {
    button.addEventListener("click", () => openAppointmentModal(null, button.dataset.newForClient));
  });
}

function renderCatalog() {
  renderServices();
  renderProfessionals();
}

function renderServices() {
  if (!state.services.length) {
    elements.serviceList.innerHTML = '<div class="empty-state">Cadastre o primeiro servico do salao.</div>';
    return;
  }

  elements.serviceList.innerHTML = state.services.map((service) => `
    <article class="catalog-row">
      <div>
        <h3>${escapeHtml(service.name)}</h3>
        <p class="meta">${service.duration} min · ${currency.format(Number(service.price))}</p>
      </div>
      <button class="text-button danger" type="button" data-delete-service="${service.id}">Remover</button>
    </article>
  `).join("");

  document.querySelectorAll("[data-delete-service]").forEach((button) => {
    button.addEventListener("click", () => deleteService(button.dataset.deleteService));
  });
}

function renderProfessionals() {
  if (!state.professionals.length) {
    elements.professionalList.innerHTML = '<div class="empty-state">Cadastre o primeiro profissional.</div>';
    return;
  }

  elements.professionalList.innerHTML = state.professionals.map((professional) => `
    <article class="catalog-row">
      <div>
        <h3>${escapeHtml(professional.name)}</h3>
        <p class="meta">${escapeHtml(professional.role)} · Comissao ${Number(professional.commission || 0)}%</p>
      </div>
      <button class="text-button danger" type="button" data-delete-professional="${professional.id}">Remover</button>
    </article>
  `).join("");

  document.querySelectorAll("[data-delete-professional]").forEach((button) => {
    button.addEventListener("click", () => deleteProfessional(button.dataset.deleteProfessional));
  });
}

function renderPayments() {
  const pending = state.appointments
    .filter((appointment) => !appointment.paid && appointment.status !== "canceled")
    .sort(sortByDateTime);

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
          <p class="meta">${formatDate(appointment.date)} as ${appointment.time} · ${escapeHtml(appointment.professional)} · ${escapeHtml(client.phone)}</p>
        </div>
        <strong>${currency.format(Number(appointment.price))}</strong>
        <a class="whatsapp-link" href="${buildWhatsAppLink(client, appointment, "charge")}" target="_blank" rel="noreferrer">Cobrar</a>
        <button class="text-button" type="button" data-create-payment="${appointment.id}">Link pagamento</button>
        <button class="text-button" type="button" data-mark-paid="${appointment.id}" data-method="pix">Pix recebido</button>
        <button class="text-button" type="button" data-mark-paid="${appointment.id}" data-method="card">Cartao</button>
        <button class="text-button" type="button" data-mark-paid="${appointment.id}" data-method="cash">Dinheiro</button>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-mark-paid]").forEach((button) => {
    button.addEventListener("click", () => markPaid(button.dataset.markPaid, button.dataset.method));
  });

  document.querySelectorAll("[data-create-payment]").forEach((button) => {
    button.addEventListener("click", () => createPaymentLink(button.dataset.createPayment));
  });
}

function renderClientOptions() {
  elements.appointmentClient.innerHTML = '<option value="">Selecione o cliente</option>' + state.clients.map((client) => (
    `<option value="${client.id}">${escapeHtml(client.name)}</option>`
  )).join("");
}

function renderAppointmentOptions() {
  const serviceOptions = state.services.map((service) => (
    `<option value="${escapeHtml(service.name)}" data-price="${service.price}" data-duration="${service.duration}">${escapeHtml(service.name)} · ${currency.format(Number(service.price))}</option>`
  )).join("");
  const professionalOptions = state.professionals.map((professional) => (
    `<option value="${escapeHtml(professional.name)}">${escapeHtml(professional.name)} · ${escapeHtml(professional.role)}</option>`
  )).join("");

  document.querySelector("#appointmentService").innerHTML = `<option value="">Selecione o servico</option>${serviceOptions}`;
  document.querySelector("#appointmentProfessional").innerHTML = `<option value="">Selecione o profissional</option>${professionalOptions}`;
}

function addService(event) {
  event.preventDefault();
  const name = elements.serviceName.value.trim();
  const duration = Number(elements.serviceDuration.value);
  const price = Number(elements.servicePrice.value);

  if (name.length < 3) {
    alert("Informe um servico com pelo menos 3 caracteres.");
    return;
  }

  if (!Number.isFinite(duration) || duration < 5 || duration > 480) {
    alert("Informe uma duracao entre 5 e 480 minutos.");
    return;
  }

  if (!Number.isFinite(price) || price <= 0) {
    alert("Informe um valor maior que zero para o servico.");
    return;
  }

  const exists = state.services.some((service) => normalizeText(service.name) === normalizeText(name));
  if (exists) {
    alert("Este servico ja esta cadastrado.");
    return;
  }

  state.services.push({ id: crypto.randomUUID(), name, duration, price });
  saveState();
  elements.serviceForm.reset();
  render();
}

function deleteService(serviceId) {
  const service = state.services.find((item) => item.id === serviceId);
  if (!service) {
    return;
  }

  const inUse = state.appointments.some((appointment) => normalizeText(appointment.service) === normalizeText(service.name));
  if (inUse) {
    alert("Este servico ja esta em agendamentos. Mantenha para preservar o historico.");
    return;
  }

  state.services = state.services.filter((item) => item.id !== serviceId);
  saveState();
  render();
}

function addProfessional(event) {
  event.preventDefault();
  const name = elements.professionalName.value.trim();
  const role = elements.professionalRole.value.trim();
  const commission = Number(elements.professionalCommission.value || 0);

  if (name.length < 2) {
    alert("Informe o nome do profissional.");
    return;
  }

  if (role.length < 2) {
    alert("Informe a especialidade do profissional.");
    return;
  }

  if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
    alert("A comissao deve ficar entre 0 e 100%.");
    return;
  }

  const exists = state.professionals.some((professional) => normalizeText(professional.name) === normalizeText(name));
  if (exists) {
    alert("Este profissional ja esta cadastrado.");
    return;
  }

  state.professionals.push({ id: crypto.randomUUID(), name, role, commission });
  saveState();
  elements.professionalForm.reset();
  render();
}

function deleteProfessional(professionalId) {
  const professional = state.professionals.find((item) => item.id === professionalId);
  if (!professional) {
    return;
  }

  const inUse = state.appointments.some((appointment) => normalizeText(appointment.professional) === normalizeText(professional.name));
  if (inUse) {
    alert("Este profissional ja possui agendamentos. Mantenha para preservar o historico.");
    return;
  }

  state.professionals = state.professionals.filter((item) => item.id !== professionalId);
  saveState();
  render();
}

function addClient(event) {
  event.preventDefault();
  const name = document.querySelector("#clientName").value.trim();
  const phone = onlyDigits(document.querySelector("#clientPhone").value);
  const tag = normalizeClientProfile(document.querySelector("#clientTag").value);

  if (name.length < 3) {
    alert("Informe um nome de cliente com pelo menos 3 caracteres.");
    return;
  }

  if (!isValidPhone(phone)) {
    alert("Informe um WhatsApp valido com DDD. Exemplo: 11999998888.");
    return;
  }

  const phoneExists = state.clients.some((client) => client.phone === phone);
  if (phoneExists) {
    alert("Ja existe um cliente cadastrado com este telefone.");
    return;
  }

  state.clients.push({ id: crypto.randomUUID(), name, phone, tag });
  saveState();
  elements.clientForm.reset();
  render();
}

function deleteClient(clientId) {
  const hasAppointments = state.appointments.some((appointment) => appointment.clientId === clientId);
  if (hasAppointments) {
    alert("Este cliente possui horarios cadastrados. Cancele ou exclua os horarios antes.");
    return;
  }

  state.clients = state.clients.filter((client) => client.id !== clientId);
  saveState();
  render();
}

function openAppointmentModal(appointmentId = null, clientId = null) {
  if (!state.clients.length) {
    alert("Cadastre um cliente antes de criar um agendamento.");
    switchView("clientes", true);
    return;
  }

  if (!state.services.length) {
    alert("Cadastre pelo menos um servico antes de agendar.");
    switchView("operacao", true);
    return;
  }

  if (!state.professionals.length) {
    alert("Cadastre pelo menos um profissional antes de agendar.");
    switchView("operacao", true);
    return;
  }

  elements.appointmentForm.reset();
  document.querySelector("#appointmentId").value = "";
  document.querySelector("#appointmentClient").value = "";
  document.querySelector("#appointmentDate").value = isoToday;
  document.querySelector("#appointmentStatus").value = "scheduled";
  elements.deleteAppointment.hidden = true;
  elements.appointmentModalTitle.textContent = "Agendar cliente";

  if (clientId) {
    document.querySelector("#appointmentClient").value = clientId;
  }

  if (appointmentId) {
    const appointment = state.appointments.find((item) => item.id === appointmentId);
    if (!appointment) {
      return;
    }

    document.querySelector("#appointmentId").value = appointment.id;
    document.querySelector("#appointmentClient").value = appointment.clientId;
    document.querySelector("#appointmentService").value = appointment.service;
    document.querySelector("#appointmentProfessional").value = appointment.professional;
    document.querySelector("#appointmentDate").value = appointment.date;
    document.querySelector("#appointmentTime").value = appointment.time;
    document.querySelector("#appointmentPrice").value = appointment.price;
    document.querySelector("#appointmentStatus").value = appointment.status || "scheduled";
    document.querySelector("#appointmentPaymentMethod").value = appointment.paymentMethod;
    document.querySelector("#appointmentTransactionId").value = appointment.transactionId;
    document.querySelector("#appointmentPaid").checked = appointment.paid;
    elements.deleteAppointment.hidden = false;
    elements.appointmentModalTitle.textContent = "Editar atendimento";
  }

  elements.appointmentModal.showModal();
}

function applyServiceDefaults() {
  const selected = document.querySelector("#appointmentService").selectedOptions[0];
  if (!selected) {
    return;
  }

  const price = Number(selected.dataset.price || 0);
  const priceInput = document.querySelector("#appointmentPrice");
  if (price > 0 && (!priceInput.value || Number(priceInput.value) <= 0)) {
    priceInput.value = price;
  }
}

function saveAppointment(event) {
  event.preventDefault();
  const appointmentId = document.querySelector("#appointmentId").value;
  const payload = {
    clientId: document.querySelector("#appointmentClient").value,
    service: document.querySelector("#appointmentService").value.trim(),
    professional: document.querySelector("#appointmentProfessional").value.trim(),
    date: document.querySelector("#appointmentDate").value,
    time: document.querySelector("#appointmentTime").value,
    price: Number(document.querySelector("#appointmentPrice").value),
    status: getAppointmentStatusForSave(appointmentId),
    paymentMethod: document.querySelector("#appointmentPaymentMethod").value,
    transactionId: document.querySelector("#appointmentTransactionId").value.trim(),
    paid: document.querySelector("#appointmentPaid").checked
  };

  const validation = validateAppointment(payload, appointmentId);
  if (!validation.ok) {
    alert(validation.message);
    return;
  }

  payload.paidAt = payload.paid ? isoToday : "";

  if (appointmentId) {
    const appointment = state.appointments.find((item) => item.id === appointmentId);
    Object.assign(appointment, payload);
  } else {
    state.appointments.push({ id: crypto.randomUUID(), ...payload });
  }

  saveState();
  elements.appointmentModal.close();
  render();
}

function getAppointmentStatusForSave(appointmentId) {
  if (!appointmentId) {
    return "scheduled";
  }

  const appointment = state.appointments.find((item) => item.id === appointmentId);
  return appointment ? appointment.status : "scheduled";
}

function deleteAppointment() {
  const appointmentId = document.querySelector("#appointmentId").value;
  if (!appointmentId) {
    return;
  }

  state.appointments = state.appointments.filter((appointment) => appointment.id !== appointmentId);
  saveState();
  elements.appointmentModal.close();
  render();
}

function completeAppointment(appointmentId) {
  const appointment = state.appointments.find((item) => item.id === appointmentId);
  if (!appointment) {
    return;
  }
  appointment.status = "completed";
  appointment.paid = true;
  appointment.paymentMethod = appointment.paymentMethod || "pix";
  appointment.transactionId = appointment.transactionId || `MANUAL-${Date.now()}`;
  appointment.paidAt = isoToday;
  saveState();
  render();
}

function cancelAppointment(appointmentId) {
  const appointment = state.appointments.find((item) => item.id === appointmentId);
  if (!appointment) {
    return;
  }

  const confirmed = confirm("Cancelar este agendamento? Ele continua aparecendo no filtro de cancelados e nos relatorios.");
  if (!confirmed) {
    return;
  }

  appointment.status = "canceled";
  appointment.paid = false;
  appointment.paidAt = "";
  saveState();
  render();
}

function markPaid(appointmentId, method = "pix") {
  const appointment = state.appointments.find((item) => item.id === appointmentId);
  if (!appointment) {
    return;
  }
  appointment.paid = true;
  appointment.paymentMethod = method;
  appointment.transactionId = appointment.transactionId || `${method.toUpperCase()}-${Date.now()}`;
  appointment.paidAt = isoToday;
  saveState();
  render();
}

async function createPaymentLink(appointmentId) {
  const appointment = state.appointments.find((item) => item.id === appointmentId);
  if (!appointment) {
    return;
  }

  const client = getClient(appointment.clientId);
  const endpoint = `${appConfig.apiBaseUrl || ""}/api/create-payment`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: appointment.id,
        clientName: client.name,
        clientPhone: client.phone,
        service: appointment.service,
        professional: appointment.professional,
        date: appointment.date,
        time: appointment.time,
        price: Number(appointment.price),
        businessName: state.business.name
      })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Nao foi possivel criar o link de pagamento.");
    }

    if (result.paymentUrl) {
      window.open(result.paymentUrl, "_blank", "noreferrer");
      return;
    }

    alert("Pagamento criado, mas a API nao retornou o link.");
  } catch (error) {
    alert(`API de pagamento ainda nao esta configurada: ${error.message}`);
  }
}

function saveBusiness(event) {
  event.preventDefault();
  state.business.name = elements.businessName.value.trim() || "AgendaPro";
  state.business.phone = onlyDigits(elements.businessPhone.value);
  saveState();
  renderBusiness();
}

function saveProfile(event) {
  event.preventDefault();
  const email = elements.profileEmail.value.trim();
  const phone = onlyDigits(elements.profilePhone.value);

  if (email && !isValidEmail(email)) {
    alert("Informe um e-mail valido.");
    return;
  }

  if (phone && !isValidPhone(phone)) {
    alert("Informe um telefone valido com DDD.");
    return;
  }

  state.profile.name = elements.profileName.value.trim() || "MatheusDevPrado";
  state.profile.phone = phone;
  state.profile.email = email || "contato@email.com";
  state.profile.about = elements.profileAbout.value.trim();
  state.profile.settings.notifyWhatsapp = elements.notifyWhatsapp.checked;
  state.profile.settings.showBrand = elements.showBrand.checked;
  state.profile.settings.compactMode = elements.compactMode.checked;
  saveState();
  render();
  alert("Perfil salvo com sucesso.");
}

function updateProfilePhoto(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.profile.photo = reader.result;
    saveState();
    renderProfile();
  });
  reader.readAsDataURL(file);
}

async function logoutProfile() {
  state.profile.loggedIn = false;
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
    currentUser = null;
    renderIntegrationStatus();
  }
  saveState();
  render();
  switchView("perfil", true);
  alert("Voce saiu. O painel fica bloqueado ate entrar novamente.");
}

function deleteAllData() {
  const confirmed = confirm("Excluir todos os dados deste navegador? Isso remove perfil, clientes, horarios e pagamentos.");
  if (!confirmed) {
    return;
  }

  localStorage.removeItem("agendapro-state");
  location.reload();
}

function renderReports() {
  const month = elements.reportMonth.value || isoToday.slice(0, 7);
  const rows = getMonthlyAppointments(month);
  const paidRows = rows.filter((appointment) => appointment.paid);
  const pendingRows = rows.filter((appointment) => !appointment.paid && appointment.status !== "canceled");
  const canceledRows = rows.filter((appointment) => appointment.status === "canceled");
  const received = paidRows.reduce((total, appointment) => total + Number(appointment.price), 0);
  const pending = pendingRows.reduce((total, appointment) => total + Number(appointment.price), 0);
  const byMethod = groupPaymentsByMethod(paidRows);

  elements.reportSummary.innerHTML = `
    <article class="report-card">
      <span>Recebido</span>
      <strong>${currency.format(received)}</strong>
      <small>${paidRows.length} pagamentos confirmados</small>
    </article>
    <article class="report-card">
      <span>A receber</span>
      <strong>${currency.format(pending)}</strong>
      <small>${pendingRows.length} pagamentos pendentes</small>
    </article>
    <article class="report-card">
      <span>Cancelados</span>
      <strong>${canceledRows.length}</strong>
      <small>registros no mes</small>
    </article>
    <article class="report-card">
      <span>Por forma</span>
      <strong>${paymentMethodLabel("pix")}: ${currency.format(byMethod.pix || 0)}</strong>
      <small>Cartao ${currency.format(byMethod.card || 0)} · Dinheiro ${currency.format(byMethod.cash || 0)}</small>
    </article>
  `;

  if (!rows.length) {
    elements.reportTable.innerHTML = '<div class="empty-state">Nenhum atendimento encontrado neste mes.</div>';
    return;
  }

  elements.reportTable.innerHTML = `
    <div class="table-row table-head">
      <span>Data</span>
      <span>Cliente</span>
      <span>Servico</span>
      <span>Profissional</span>
      <span>Valor</span>
      <span>Pagamento</span>
    </div>
    ${rows.map((appointment) => {
      const client = getClient(appointment.clientId);
      return `
        <div class="table-row">
          <span>${formatDate(appointment.date)} ${appointment.time}</span>
          <span>${escapeHtml(client.name)}</span>
          <span>${escapeHtml(appointment.service)}</span>
          <span>${escapeHtml(appointment.professional)}</span>
          <span>${currency.format(Number(appointment.price))}</span>
          <span>${appointment.paid ? paymentMethodLabel(appointment.paymentMethod) : statusInfo(appointment.status, appointment.paid).label}</span>
        </div>
      `;
    }).join("")}
  `;
}

function downloadMonthlyReport() {
  const month = elements.reportMonth.value || isoToday.slice(0, 7);
  const rows = getMonthlyAppointments(month);
  if (!rows.length) {
    alert("Nao ha dados para baixar neste mes.");
    return;
  }

  const header = ["data", "horario", "cliente", "telefone", "servico", "profissional", "valor", "status", "forma_pagamento", "comprovante"];
  const csvRows = rows.map((appointment) => {
    const client = getClient(appointment.clientId);
    return [
      appointment.date,
      appointment.time,
      client.name,
      client.phone,
      appointment.service,
      appointment.professional,
      Number(appointment.price).toFixed(2),
      statusInfo(appointment.status, appointment.paid).label,
      paymentMethodLabel(appointment.paymentMethod),
      appointment.transactionId
    ].map(csvCell).join(",");
  });

  const csv = [header.join(","), ...csvRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio-agendapro-${month}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function clearReportedMonth() {
  const month = elements.reportMonth.value || isoToday.slice(0, 7);
  const removable = state.appointments.filter((appointment) => (
    appointment.date.startsWith(month) &&
    (appointment.status === "canceled" || appointment.paid)
  ));

  if (!removable.length) {
    alert("Nao ha registros pagos ou cancelados para limpar neste mes.");
    return;
  }

  const confirmed = confirm(`Remover ${removable.length} registros pagos/cancelados de ${month}? Baixe o relatorio antes de limpar.`);
  if (!confirmed) {
    return;
  }

  const removableIds = new Set(removable.map((appointment) => appointment.id));
  state.appointments = state.appointments.filter((appointment) => !removableIds.has(appointment.id));
  saveState();
  render();
}

function switchView(view, updateHash = false) {
  if (!isAuthenticated() && view !== "perfil") {
    view = "perfil";
    if (updateHash) {
      alert("Entre na conta para acessar o painel.");
    }
  }

  elements.navButtons.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  elements.views.forEach((item) => item.classList.toggle("active", item.id === view));
  if (updateHash) {
    history.replaceState(null, "", `#${view}`);
  }
}

function openInitialView() {
  const view = window.location.hash.replace("#", "");
  if (!view) {
    return;
  }

  const exists = Array.from(elements.views).some((item) => item.id === view);
  if (exists) {
    switchView(view);
  }
}

function isAuthenticated() {
  return Boolean(currentUser || state.profile.loggedIn);
}

function sortByDateTime(a, b) {
  return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
}

function buildWhatsAppLink(client, appointment, type = "reminder") {
  const business = state.business.name || "AgendaPro";
  const businessPhone = state.business.phone ? `\nContato: ${state.business.phone}` : "";
  const appLink = getSectionLink(type);
  const paymentStatus = appointment.paid ? "Pago" : "Pendente";
  const details = [
    `Servico: ${appointment.service}`,
    `Profissional: ${appointment.professional}`,
    `Data: ${formatDate(appointment.date)}`,
    `Horario: ${appointment.time}`,
    `Valor: ${currency.format(Number(appointment.price))}`,
    `Pagamento: ${paymentStatus}`,
    appointment.paymentMethod ? `Forma: ${paymentMethodLabel(appointment.paymentMethod)}` : "",
    appointment.transactionId ? `Comprovante/ID: ${appointment.transactionId}` : ""
  ].filter(Boolean).join("\n");

  const messages = {
    reminder: `Oi ${client.name}, tudo bem?\n\nAqui e ${business}. Passando para lembrar do seu atendimento:\n\n${details}\n\nAcompanhe sua agenda aqui:\n${appLink}\n\nSe precisar remarcar, me avise por aqui.${businessPhone}`,
    charge: `Oi ${client.name}, tudo bem?\n\nAqui e ${business}. Estou enviando a cobranca do atendimento:\n\n${details}\n\nLink de pagamento/acompanhamento:\n${appLink}\n\nPode me chamar por aqui quando realizar o pagamento. Obrigado.${businessPhone}`,
    confirmation: `Oi ${client.name}, seu atendimento foi confirmado.\n\n${details}\n\nVeja os detalhes da agenda aqui:\n${appLink}\n\nObrigado pela preferencia.\n${business}`
  };

  const text = messages[type] || messages.reminder;
  return `https://wa.me/${client.phone}?text=${encodeURIComponent(text)}`;
}

function getSectionLink(type) {
  const sectionByType = {
    charge: "pagamentos",
    reminder: "agenda",
    confirmation: "agenda"
  };
  const section = sectionByType[type] || "agenda";
  const url = new URL(window.location.href);
  url.hash = section;
  return url.toString();
}

function validateAppointment(payload, appointmentId) {
  if (!payload.clientId) {
    return { ok: false, message: "Selecione o nome do cliente para criar o agendamento." };
  }

  if (!payload.service || payload.service.length < 3) {
    return { ok: false, message: "Selecione o servico adquirido." };
  }

  if (!payload.professional || payload.professional.length < 2) {
    return { ok: false, message: "Selecione o profissional responsavel pelo atendimento." };
  }

  const serviceExists = state.services.some((service) => normalizeText(service.name) === normalizeText(payload.service));
  if (!serviceExists) {
    return { ok: false, message: "Este servico nao esta cadastrado na tabela do salao." };
  }

  const professionalExists = state.professionals.some((professional) => normalizeText(professional.name) === normalizeText(payload.professional));
  if (!professionalExists) {
    return { ok: false, message: "Este profissional nao esta cadastrado na equipe do salao." };
  }

  if (!payload.date || !payload.time) {
    return { ok: false, message: "Informe data e horario do atendimento." };
  }

  if (!Number.isFinite(payload.price) || payload.price <= 0) {
    return { ok: false, message: "Informe um valor maior que zero." };
  }

  if (payload.paid && !payload.paymentMethod) {
    return { ok: false, message: "Informe a forma de pagamento para marcar como pago." };
  }

  const payloadStart = timeToMinutes(payload.time);
  const payloadEnd = payloadStart + getServiceDuration(payload.service);
  const hasConflict = state.appointments.some((appointment) => {
    if (
      appointment.id === appointmentId ||
      appointment.status === "canceled" ||
      payload.status === "canceled" ||
      appointment.date !== payload.date ||
      normalizeText(appointment.professional) !== normalizeText(payload.professional)
    ) {
      return false;
    }

    const appointmentStart = timeToMinutes(appointment.time);
    const appointmentEnd = appointmentStart + getServiceDuration(appointment.service);
    return payloadStart < appointmentEnd && payloadEnd > appointmentStart;
  });

  if (hasConflict) {
    return { ok: false, message: "Este profissional ja tem atendimento nesse intervalo de horario." };
  }

  return { ok: true };
}

function getMonthlyAppointments(month) {
  return state.appointments
    .filter((appointment) => appointment.date.startsWith(month))
    .sort(sortByDateTime);
}

function groupPaymentsByMethod(rows) {
  return rows.reduce((totals, appointment) => {
    const method = appointment.paymentMethod || "unknown";
    totals[method] = (totals[method] || 0) + Number(appointment.price);
    return totals;
  }, {});
}

function paymentMethodLabel(method) {
  const labels = {
    pix: "Pix",
    card: "Cartao",
    cash: "Dinheiro",
    unknown: "Nao informado",
    "": "Nao informado"
  };
  return labels[method] || method;
}

function csvCell(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}

function isValidPhone(phone) {
  return /^\d{10,13}$/.test(String(phone));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeClientProfile(value) {
  const text = normalizeText(value);
  if (text.includes("vip")) {
    return "VIP";
  }
  if (text.includes("recorrente") || text.includes("recorente") || text.includes("mensal") || text.includes("semanal")) {
    return "Recorrente";
  }
  if (text.includes("retorno")) {
    return "Retorno";
  }
  if (text.includes("inativo") || text.includes("cancelado")) {
    return "Inativo";
  }

  return clientProfiles.includes(value) ? value : "Cliente ativo";
}

function getServiceDuration(serviceName) {
  const service = state.services.find((item) => normalizeText(item.name) === normalizeText(serviceName));
  return service ? Number(service.duration || 30) : 30;
}

function timeToMinutes(value) {
  const [hours, minutes] = String(value || "00:00").split(":").map(Number);
  return (hours * 60) + (minutes || 0);
}

function statusInfo(status, paid) {
  if (status === "canceled") {
    return { label: "Cancelado", className: "canceled" };
  }
  if (status === "completed") {
    return { label: "Concluido", className: "paid" };
  }
  if (paid) {
    return { label: "Pago", className: "paid" };
  }
  return { label: "Pendente", className: "pending" };
}

function exportSummary() {
  const activeAppointments = state.appointments.filter((appointment) => appointment.status !== "canceled");
  const pendingTotal = activeAppointments
    .filter((appointment) => !appointment.paid)
    .reduce((total, appointment) => total + Number(appointment.price), 0);
  const receivedTotal = activeAppointments
    .filter((appointment) => appointment.paid)
    .reduce((total, appointment) => total + Number(appointment.price), 0);

  const summary = [
    `Resumo ${state.business.name}`,
    `Clientes: ${state.clients.length}`,
    `Atendimentos ativos: ${activeAppointments.length}`,
    `Recebido: ${currency.format(receivedTotal)}`,
    `A receber: ${currency.format(pendingTotal)}`
  ].join("\n");

  navigator.clipboard.writeText(summary).then(() => {
    alert("Resumo copiado para a area de transferencia.");
  });
}

function onlyDigits(value) {
  return String(value).replace(/\D/g, "");
}

function getInitials(value) {
  const parts = String(value || "M").trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0] || "").join("").toUpperCase() || "M";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
