// Local desktop storage: mirrors the same get/set interface,
// backed by this app's own persistent localStorage (survives restarts).
window.storage = {
  async get(key) {
    const v = localStorage.getItem(key);
    if (v === null) throw new Error('not found');
    return { key, value: v };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  }
};

const PHASE_ITEMS = [
  { id: 'p1', name: 'Intro to CS' },
  { id: 'p2', name: 'Intro to Math Thinking' },
  { id: 'p3', name: 'How to Code: Simple Data' },
  { id: 'p4', name: 'CISC 505 — Object Oriented Programming and Python' },
  { id: 'p5', name: 'Core Programming: System Program Design' },
  { id: 'p6', name: 'Core Math: Mathematics for CS' },
  { id: 'p7', name: 'How to Code: Complex Data' },
  { id: 'p8', name: 'CISC 510 — Theoretical Concepts in CS' },
];

const HABIT_COLORS = ['#E8799F', '#B695D6', '#F0A868', '#7FC9A8', '#88B8E8', '#E86B8A'];
const DEFAULT_HABITS = [
  { id: 'coding-challenge', name: 'Coding challenge' },
  { id: 'study-session', name: 'Study session' },
  { id: 'exercise', name: 'Exercise' },
  { id: 'art', name: 'Art' },
];

let state = { habits: DEFAULT_HABITS.slice(), habitData: {}, phaseChecklist: {} };
let viewYear, viewMonth;

function todayStr() { return fmt(new Date()); }
function fmt(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function habitColor(index) { return HABIT_COLORS[index % HABIT_COLORS.length]; }

async function loadData() {
  try {
    const res = await window.storage.get('tracker-data');
    if (res && res.value) {
      const parsed = JSON.parse(res.value);
      if (parsed.habits && parsed.habits.length) state.habits = parsed.habits;
      state.habitData = parsed.habitData || {};
      state.phaseChecklist = parsed.phaseChecklist || {};
    }
  } catch (e) {
    // first launch, nothing saved yet — start fresh
  }
}

async function saveData() {
  try {
    await window.storage.set('tracker-data', JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('Save failed', e);
    return false;
  }
}

function computeStreaks() {
  if (state.habits.length === 0) return { current: 0, longest: 0, total: 0 };

  const habitDateSets = state.habits.map(h =>
    new Set(Object.keys(state.habitData[h.id] || {}).filter(d => state.habitData[h.id][d]))
  );
  let completeDates = [...habitDateSets[0]];
  for (let i = 1; i < habitDateSets.length; i++) {
    completeDates = completeDates.filter(d => habitDateSets[i].has(d));
  }
  const doneDates = completeDates.sort();
  if (doneDates.length === 0) return { current: 0, longest: 0, total: 0 };

  const doneSet = new Set(doneDates);
  let longest = 0, run = 0, prev = null;
  for (const d of doneDates) {
    const dt = new Date(d + 'T00:00:00');
    if (prev) {
      const diff = (dt - prev) / (1000*60*60*24);
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = dt;
  }

  let current = 0;
  let cursor = new Date();
  cursor.setHours(0,0,0,0);
  if (!doneSet.has(fmt(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (doneSet.has(fmt(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, longest, total: doneDates.length };
}

function renderStats() {
  const s = computeStreaks();
  document.getElementById('stat-current').textContent = s.current;
  document.getElementById('stat-longest').textContent = s.longest;
  document.getElementById('stat-total').textContent = s.total;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

async function toggleDay(habitId, dateStr) {
  if (!state.habitData[habitId]) state.habitData[habitId] = {};
  state.habitData[habitId][dateStr] = !state.habitData[habitId][dateStr];
  if (!state.habitData[habitId][dateStr]) delete state.habitData[habitId][dateStr];
  await saveData();
  renderStats();
  renderHabitTable();
}

async function removeHabit(habitId) {
  state.habits = state.habits.filter(h => h.id !== habitId);
  delete state.habitData[habitId];
  await saveData();
  renderStats();
  renderHabitTable();
}

function renderHabitTable() {
  document.getElementById('month-label').textContent = MONTH_NAMES[viewMonth] + ' ' + viewYear;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = todayStr();
  const table = document.getElementById('habit-table');
  table.innerHTML = '';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const cornerTh = document.createElement('th');
  cornerTh.className = 'habit-name-col';
  headRow.appendChild(cornerTh);
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = viewYear + '-' + String(viewMonth+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
    const th = document.createElement('th');
    th.className = 'day-head' + (dateStr === today ? ' today-col' : '');
    th.textContent = day;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  state.habits.forEach((habit, idx) => {
    const tr = document.createElement('tr');
    const nameTd = document.createElement('td');
    nameTd.className = 'habit-name-col';
    nameTd.style.borderLeft = '3px solid ' + habitColor(idx);
    nameTd.style.paddingLeft = '6px';
    nameTd.innerHTML = habit.name + ' <button class="del-btn" title="Remove habit">×</button>';
    nameTd.querySelector('.del-btn').addEventListener('click', () => removeHabit(habit.id));
    tr.appendChild(nameTd);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = viewYear + '-' + String(viewMonth+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
      const td = document.createElement('td');
      const cell = document.createElement('button');
      cell.className = 'day-cell' + (dateStr === today ? ' today-col' : '');
      const done = state.habitData[habit.id] && state.habitData[habit.id][dateStr];
      if (done) {
        cell.style.background = habitColor(idx);
        cell.style.borderColor = habitColor(idx);
        cell.textContent = '✓';
      }
      cell.setAttribute('aria-label', habit.name + ' on ' + dateStr);
      cell.addEventListener('click', () => toggleDay(habit.id, dateStr));
      td.appendChild(cell);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

async function addHabit() {
  const input = document.getElementById('new-habit-input');
  const name = input.value.trim();
  if (!name) return;
  const id = 'h-' + Date.now();
  state.habits.push({ id, name });
  input.value = '';
  await saveData();
  renderStats();
  renderHabitTable();
}

function renderChecklist() {
  const list = document.getElementById('checklist');
  list.innerHTML = '';
  let checkedCount = 0;
  PHASE_ITEMS.forEach(item => {
    const isChecked = !!state.phaseChecklist[item.id];
    if (isChecked) checkedCount++;
    const row = document.createElement('div');
    row.className = 'check-item' + (isChecked ? ' checked' : '');
    row.innerHTML = '<input type="checkbox" id="chk-' + item.id + '" ' + (isChecked ? 'checked' : '') + '><label for="chk-' + item.id + '">' + item.name + '</label>';
    row.querySelector('input').addEventListener('change', async (e) => {
      state.phaseChecklist[item.id] = e.target.checked;
      await saveData();
      renderChecklist();
    });
    list.appendChild(row);
  });
  const pct = Math.round((checkedCount / PHASE_ITEMS.length) * 100);
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('phase-progress-label').textContent = checkedCount + ' of ' + PHASE_ITEMS.length + ' courses complete (' + pct + '%)';
}

async function init() {
  const now = new Date();
  viewYear = now.getFullYear();
  viewMonth = now.getMonth();

  await loadData();
  renderStats();
  renderHabitTable();
  renderChecklist();

  document.getElementById('prev-month').addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderHabitTable();
  });
  document.getElementById('next-month').addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderHabitTable();
  });
  document.getElementById('add-habit-btn').addEventListener('click', addHabit);
  document.getElementById('new-habit-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addHabit();
  });
  document.getElementById('reset-btn').addEventListener('click', async () => {
    if (confirm('This clears your habit history and checklist. Are you sure?')) {
      state = { habits: DEFAULT_HABITS.slice(), habitData: {}, phaseChecklist: {} };
      await saveData();
      renderStats();
      renderHabitTable();
      renderChecklist();
    }
  });
}

init();