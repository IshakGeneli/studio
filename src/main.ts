import './style.css'

const inputEl = document.getElementById('json-input') as HTMLTextAreaElement;
const outputEl = document.getElementById('json-output') as HTMLPreElement;
const statusBadge = document.getElementById('status-badge') as HTMLSpanElement;
const viewModeSelect = document.getElementById('view-mode') as HTMLSelectElement;

// İşlenmiş JSON'u hafızada tutuyoruz, böylece mod değiştirirken tekrar parse etmeyiz
let currentParsedData: any = null;

// --- TEXT MODU ---
// JSON verisini Tailwind renkleriyle renklendiren fonksiyon
function syntaxHighlight(json: string): string {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'text-blue-400'; // Sayılar

    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'text-pink-400'; // Anahtarlar (Keys)
      } else {
        cls = 'text-green-400'; // String değerler
      }
    } else if (/true|false/.test(match)) {
      cls = 'text-yellow-400'; // Boolean
    } else if (/null/.test(match)) {
      cls = 'text-gray-400'; // Null
    }

    return `<span class="${cls}">${match}</span>`;
  });
}

function renderTree(data: any, isRoot = true): string {
  if (data === null) return `<span class="text-gray-400">null</span>`;
  if (typeof data === 'boolean') return `<span class="text-yellow-400">${data}</span>`;
  if (typeof data === 'number') return `<span class="text-blue-400">${data}</span>`;
  if (typeof data === 'string') {
    const escapedStr = data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<span class="text-green-400">"${escapedStr}"</span>`;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return `<span class="text-gray-400">[]</span>`;
    let html = `<details ${isRoot ? 'open' : ''} class="w-full">
            <summary class="cursor-pointer select-none text-gray-400 hover:text-gray-200 transition-colors">
                [ <span class="text-xs text-gray-500 italic">${data.length} eleman</span> ]
            </summary>
            <div class="pl-4 border-l border-gray-700 ml-[5px]">`;
    data.forEach((val, idx) => {
      const isLast = idx === data.length - 1;
      html += `<div><span class="text-gray-500">${idx}:</span> ${renderTree(val, false)}${isLast ? '' : '<span class="text-gray-500">,</span>'}</div>`;
    });
    html += `</div><span class="text-gray-400 ml-1">]</span></details>`;
    return html;
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) return `<span class="text-gray-400">{}</span>`;
    let html = `<details ${isRoot ? 'open' : ''} class="w-full">
            <summary class="cursor-pointer select-none text-gray-400 hover:text-gray-200 transition-colors">
                { <span class="text-xs text-gray-500 italic">${keys.length} anahtar</span> }
            </summary>
            <div class="pl-4 border-l border-gray-700 ml-[5px]">`;
    keys.forEach((key, idx) => {
      const isLast = idx === keys.length - 1;
      html += `<div><span class="text-pink-400">"${key}"</span><span class="text-gray-500">:</span> ${renderTree(data[key], false)}${isLast ? '' : '<span class="text-gray-500">,</span>'}</div>`;
    });
    html += `</div><span class="text-gray-400 ml-1">}</span></details>`;
    return html;
  }

  return '';
}

// --- EKRAN GÜNCELLEME ---
function updateView() {
  if (!currentParsedData) {
    outputEl.innerHTML = '';
    return;
  }

  const mode = viewModeSelect.value;
  if (mode === 'text') {
    const formatted = JSON.stringify(currentParsedData, null, 4);
    outputEl.innerHTML = syntaxHighlight(formatted);
  } else if (mode === 'tree') {
    outputEl.innerHTML = renderTree(currentParsedData);
  }
}

// --- OLAY DİNLEYİCİLERİ (EVENTS) ---

// 1. Textarea'ya yazı girildiğinde
inputEl.addEventListener('input', () => {
  const rawValue = inputEl.value.trim();

  if (!rawValue) {
    currentParsedData = null;
    updateView();
    statusBadge.textContent = 'Bekleniyor';
    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-600';
    return;
  }

  try {
    currentParsedData = JSON.parse(rawValue);
    updateView();

    statusBadge.textContent = 'Geçerli JSON';
    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700';
  } catch (error) {
    currentParsedData = null;
    outputEl.innerHTML = `<span class="text-red-400">Hata: Geçersiz JSON formatı.\n${(error as Error).message}</span>`;
    statusBadge.textContent = 'Hatalı JSON';
    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700';
  }
});

viewModeSelect.addEventListener('change', updateView);

