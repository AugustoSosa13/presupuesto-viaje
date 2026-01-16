const STORAGE_KEY = "plata_brasil_v1";

function brl(n) {
  const x = Number(n || 0);
  return x.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function todayDateOnly() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    // Defaults según tu nota
    return {
      config: {
        totalBudget: 2950,
        totalDays: 9,
        reserved: 0,
        tripStart: new Date().toISOString().slice(0, 10),
      },
      expenses: []
    };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {
      config: {
        totalBudget: 2950,
        totalDays: 9,
        reserved: 0,
        tripStart: new Date().toISOString().slice(0, 10),
      },
      expenses: []
    };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function calc() {
  const totalBudget = Number(state.config.totalBudget || 0);
  const totalDays = Number(state.config.totalDays || 1);
  const reserved = Number(state.config.reserved || 0);

  const spentTotal = state.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const usableBudget = totalBudget - reserved;
  const remaining = usableBudget - spentTotal;

  // Day index según fecha inicio
  const start = new Date(state.config.tripStart);
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const today = todayDateOnly();
  const diffDays = Math.floor((today - startDate) / 86400000);

  const dayIndex = clamp(diffDays, 0, totalDays - 1);

  // Contando HOY como día disponible:
  const remainingDays = clamp(totalDays - dayIndex, 1, totalDays);

  const maxPerDay = remaining / remainingDays;

  return { totalBudget, totalDays, reserved, spentTotal, remaining, dayIndex, remainingDays, maxPerDay };
}

function render() {
  // set inputs
  document.getElementById("totalBudget").value = state.config.totalBudget ?? "";
  document.getElementById("totalDays").value = state.config.totalDays ?? "";
  document.getElementById("reserved").value = state.config.reserved ?? "";
  document.getElementById("tripStart").value = state.config.tripStart ?? "";

  const c = calc();

  document.getElementById("remaining").textContent = brl(c.remaining);
  document.getElementById("spentTotal").textContent = brl(c.spentTotal);
  document.getElementById("maxPerDay").textContent = brl(c.maxPerDay);
  document.getElementById("daysLeft").textContent =
    `Días restantes (incluyendo hoy): ${c.remainingDays} • Día actual: ${c.dayIndex + 1}/${c.totalDays}`;

  const list = document.getElementById("list");
  list.innerHTML = "";

  if (state.expenses.length === 0) {
    list.innerHTML = `<div class="small">Todavía no cargaste gastos.</div>`;
    return;
  }

  // últimos primero
  const items = [...state.expenses].reverse();
  items.forEach((e, revIndex) => {
    const realIndex = state.expenses.length - 1 - revIndex;

    const wrapper = document.createElement("div");
    wrapper.className = "item";

    const left = document.createElement("div");
    left.innerHTML = `
      <strong>${e.category} • <span class="mono">${brl(e.amount)}</span></strong>
      <span class="pill">${new Date(e.date).toLocaleString("es-AR")}</span>
      <div class="small">${e.note ? e.note : "Sin nota"}</div>
    `;

    const right = document.createElement("div");
    right.className = "right";
    const btn = document.createElement("button");
    btn.className = "btnDanger";
    btn.textContent = "Borrar";
    btn.onclick = () => removeExpense(realIndex);

    right.appendChild(btn);
    wrapper.appendChild(left);
    wrapper.appendChild(right);

    list.appendChild(wrapper);
  });
}

function saveConfig() {
  const totalBudget = Number(document.getElementById("totalBudget").value || 0);
  const totalDays = Number(document.getElementById("totalDays").value || 1);
  const reserved = Number(document.getElementById("reserved").value || 0);
  const tripStart = document.getElementById("tripStart").value || new Date().toISOString().slice(0, 10);

  if (totalBudget <= 0 || totalDays <= 0) {
    alert("Poné un presupuesto y días válidos.");
    return;
  }

  state.config = { totalBudget, totalDays, reserved, tripStart };
  saveState(state);
  render();
}

function addExpense() {
  const amount = Number((document.getElementById("amount").value || "0").replace(",", "."));
  const category = document.getElementById("category").value || "Otros";
  const note = document.getElementById("note").value || "";

  if (!amount || amount <= 0) {
    alert("Monto inválido.");
    return;
  }

  state.expenses.push({
    date: new Date().toISOString(),
    amount,
    category,
    note
  });

  saveState(state);

  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";

  render();
}

function removeExpense(index) {
  state.expenses.splice(index, 1);
  saveState(state);
  render();
}

function resetAll() {
  if (!confirm("¿Seguro que querés resetear todo?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  render();
}

window.saveConfig = saveConfig;
window.addExpense = addExpense;
window.resetAll = resetAll;

render();
