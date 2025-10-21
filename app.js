const API_BASE = 'https://api.exchangerate.host';
const els = {
  amount: document.getElementById('amount'),
  from: document.getElementById('from'),
  to: document.getElementById('to'),
  form: document.getElementById('convert-form'),
  result: document.getElementById('result'),
  chartCanvas: document.getElementById('trendChart')
};

let trendChart = null;

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  return res.json();
}

async function loadSymbols() {
  try {
    const data = await fetchJSON(`${API_BASE}/symbols`);
    return Object.keys(data.symbols).sort().map(k => ({ code: k, name: data.symbols[k].description }));
  } catch (_) {
    // Fallback to a common subset
    const fallback = ['USD','EUR','GBP','JPY','INR','AUD','CAD','CHF','CNY'];
    return fallback.map(c => ({ code: c, name: c }));
  }
}

function populateSelect(el, symbols) {
  el.innerHTML = '';
  for (const { code, name } of symbols) {
    const opt = document.createElement('option');
    opt.value = code; opt.textContent = `${code} — ${name}`;
    el.appendChild(opt);
  }
}

async function convertAndRender() {
  const amount = parseFloat(els.amount.value) || 0;
  const from = els.from.value;
  const to = els.to.value;

  let rate = 1;
  try {
    const data = await fetchJSON(`${API_BASE}/latest?base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`);
    rate = data?.rates?.[to] ?? 1;
  } catch (_) {
    // naive fallback map
    const fallbackRates = { USD: { EUR: 0.9, GBP: 0.78, INR: 83 }, EUR: { USD: 1.1, GBP: 0.86, INR: 92 } };
    rate = fallbackRates?.[from]?.[to] ?? 1;
  }

  const converted = amount * rate;
  els.result.textContent = `${amount.toFixed(2)} ${from} = ${converted.toFixed(2)} ${to}`;

  await renderTrend(from, to);
}

function getDateStr(d) { return d.toISOString().slice(0,10); }

async function renderTrend(from, to) {
  const end = new Date();
  const start = new Date(); start.setDate(end.getDate() - 30);

  let labels = [], series = [];
  try {
    const data = await fetchJSON(`${API_BASE}/timeseries?start_date=${getDateStr(start)}&end_date=${getDateStr(end)}&base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`);
    const entries = Object.entries(data.rates).sort((a,b) => a[0].localeCompare(b[0]));
    labels = entries.map(e => e[0]);
    series = entries.map(e => e[1][to]);
  } catch (_) {
    // simple fallback: flat line around current rate
    labels = Array.from({ length: 31 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i); return getDateStr(d);
    });
    series = labels.map(() => 1);
  }

  const ctx = els.chartCanvas.getContext('2d');
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `${from} → ${to}`,
        data: series,
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96,165,250,0.15)',
        borderWidth: 2,
        fill: true,
        tension: 0.25,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxTicksLimit: 6, color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

(async function init() {
  const symbols = await loadSymbols();
  populateSelect(els.from, symbols);
  populateSelect(els.to, symbols);
  els.from.value = 'USD';
  els.to.value = 'EUR';

  els.form.addEventListener('submit', (e) => { e.preventDefault(); convertAndRender(); });
  els.from.addEventListener('change', convertAndRender);
  els.to.addEventListener('change', convertAndRender);
  els.amount.addEventListener('input', () => {
    // throttle with a timeout if necessary; for simplicity, convert immediately
  });

  await convertAndRender();
})();
