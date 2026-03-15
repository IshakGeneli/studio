import './style.css'

const inputEl = document.getElementById('json-input') as HTMLTextAreaElement;
const outputEl = document.getElementById('json-output') as HTMLPreElement;
const statusBadge = document.getElementById('status-badge') as HTMLSpanElement;
const viewModeSelect = document.getElementById('view-mode') as HTMLSelectElement;
const textActions = document.getElementById('text-actions') as HTMLDivElement;
const minifyBtn = document.getElementById('minify-btn') as HTMLButtonElement;
const beautifyBtn = document.getElementById('beautify-btn') as HTMLButtonElement;
const copyPrimaryBtn = document.getElementById('copy-primary-btn') as HTMLButtonElement;
const copyPrimaryBtnText = document.getElementById('copy-primary-btn-text') as HTMLSpanElement;
const copyQueryResultBtn = document.getElementById('copy-query-result-btn') as HTMLButtonElement;

let currentParsedPrimaryData: any = null;
let currentParsedQueryResultData: any = null;

function syntaxHighlight(json: string): string {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'text-blue-400'; // Sayılar

    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'text-pink-400';
      } else {
        cls = 'text-green-400';
      }
    } else if (/true|false/.test(match)) {
      cls = 'text-yellow-400';
    } else if (/null/.test(match)) {
      cls = 'text-gray-400';
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

inputEl.addEventListener('input', () => {
  const rawValue = inputEl.value.trim();

  if (!rawValue) {
    currentParsedPrimaryData = null;
    updateView();
    statusBadge.textContent = 'Bekleniyor';
    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-600';
    return;
  }

  try {
    currentParsedPrimaryData = JSON.parse(rawValue);
    updateView();

    statusBadge.textContent = 'Geçerli JSON';
    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700';
  } catch (error) {
    currentParsedPrimaryData = null;
    outputEl.innerHTML = `<span class="text-red-400">Hata: Geçersiz JSON formatı.\n${(error as Error).message}</span>`;
    statusBadge.textContent = 'Hatalı JSON';
    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700';
  }
});

viewModeSelect.addEventListener('change', updateView);

const consoleToggle = document.getElementById('console-toggle') as HTMLButtonElement;
const consoleContent = document.getElementById('console-content') as HTMLDivElement;
const consoleChevron = document.querySelector('#console-chevron') as SVGElement;
const queryInput = document.getElementById('query-input') as HTMLInputElement;
const queryOutput = document.getElementById('query-output') as HTMLPreElement;

consoleToggle.addEventListener('click', () => {
  const isHidden = consoleContent.classList.contains('hidden');
  if (isHidden) {
    consoleContent.classList.remove('hidden');
    consoleContent.classList.add('flex');
    consoleChevron.classList.add('rotate-180');
    queryInput.focus();
  } else {
    consoleContent.classList.add('hidden');
    consoleContent.classList.remove('flex');
    consoleChevron.classList.remove('rotate-180');
  }
});

queryInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const query = queryInput.value.trim();

    if (!currentParsedPrimaryData) {
      queryOutput.innerHTML = `<span class="text-red-400">Hata: Önce geçerli bir JSON verisi girmelisiniz.</span>`;
      return;
    }

    if (!query) {
      queryOutput.innerHTML = `<span class="text-gray-400">Sorgu sonucu burada görüntülenecek...</span>`;
      return;
    }

    try {
      const queryFunction = new Function('data', `return data.${query}`);
      const result = queryFunction(currentParsedPrimaryData);

      if (result === undefined) {
        queryOutput.innerHTML = `<span class="text-gray-500">undefined</span>`;
      } else {
        const formattedResult = JSON.stringify(result, null, 2);
        queryOutput.innerHTML = syntaxHighlight(formattedResult);
      }
    } catch (error) {
      queryOutput.innerHTML = `<span class="text-red-400">Sorgu Hatası: ${(error as Error).message}</span>`;
    }
  }
});

let currentIndentation: number | null = 4; // Varsayılan 4 boşluk

minifyBtn.addEventListener('click', () => {
  currentIndentation = null;
  updateView();
});

beautifyBtn.addEventListener('click', () => {
  currentIndentation = 4;
  updateView();
});

copyPrimaryBtn.addEventListener('click', async () => {
  if (!currentParsedPrimaryData) return;

  try {
    const textToCopy = JSON.stringify(currentParsedPrimaryData, null, currentIndentation as any);

    await navigator.clipboard.writeText(textToCopy);

    const originalText = copyPrimaryBtnText.textContent;

    copyPrimaryBtnText.textContent = 'Kopyalandı!';
    copyPrimaryBtn.classList.replace('bg-indigo-600', 'bg-green-600');
    copyPrimaryBtn.classList.replace('hover:bg-indigo-500', 'hover:bg-green-500');
    copyPrimaryBtn.disabled = true;

    setTimeout(() => {
      copyPrimaryBtnText.textContent = originalText;
      copyPrimaryBtn.classList.replace('bg-green-600', 'bg-indigo-600');
      copyPrimaryBtn.classList.replace('hover:bg-green-500', 'hover:bg-indigo-500');
      copyPrimaryBtn.disabled = false;
    }, 2000);

  } catch (err) {
    console.error('Kopyalama hatası:', err);
    copyPrimaryBtnText.textContent = 'Hata!';
    setTimeout(() => { copyPrimaryBtnText.textContent = 'Kopyala'; }, 2000);
  }
});


copyQueryResultBtn.addEventListener('click', async () => {
  const textToCopy = queryOutput.innerText;

  if (textToCopy === 'Sorgu sonucu burada görüntülenecek...') return;

  try {
    await navigator.clipboard.writeText(textToCopy);

    const originalContent = copyQueryResultBtn.innerHTML;

    copyQueryResultBtn.innerHTML = `
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      Kopyalandı!
    `;
    copyQueryResultBtn.classList.replace('text-gray-400', 'text-green-400');
    copyQueryResultBtn.classList.replace('border-gray-600', 'border-green-600');
    copyQueryResultBtn.disabled = true;

    setTimeout(() => {
      copyQueryResultBtn.innerHTML = originalContent;
      copyQueryResultBtn.classList.replace('text-green-400', 'text-gray-400');
      copyQueryResultBtn.classList.replace('border-green-600', 'border-gray-600');
      copyQueryResultBtn.disabled = false;
    }, 2000);

  } catch (err) {
    console.error('Kopyalama hatası:', err);
    copyQueryResultBtn.textContent = 'Hata!';
    setTimeout(() => {
      location.reload(); 
    }, 2000);
  }
});

const queryHelp = document.getElementById('query-help') as HTMLAnchorElement;
queryHelp.addEventListener('click', (e) => {
  e.stopPropagation();
});

function updateView() {
  if (!currentParsedPrimaryData) {
    outputEl.innerHTML = '';
    return;
  }

  const mode = viewModeSelect.value;

  if (mode === 'text') {
    textActions.classList.remove('hidden');
    textActions.classList.add('flex');

    const formatted = JSON.stringify(currentParsedPrimaryData, null, currentIndentation as any);
    outputEl.innerHTML = syntaxHighlight(formatted);
  } else {
    textActions.classList.add('hidden');
    textActions.classList.remove('flex');
    outputEl.innerHTML = renderTree(currentParsedPrimaryData);
  }
}

// Dropdown START
const dropdownButton = document.getElementById('dropdown-button') as HTMLButtonElement;
const dropdownMenu = document.getElementById('dropdown-menu') as HTMLDivElement;

dropdownButton.addEventListener('click', (e) => {
  e.stopPropagation();
  dropdownMenu.classList.toggle('hidden');
});

document.addEventListener('click', (event) => {
  if (!dropdownButton.contains(event.target as Node) && !dropdownMenu.contains(event.target as Node)) {
    dropdownMenu.classList.add('hidden');
  }
});

dropdownMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    dropdownMenu.classList.add('hidden');
  });
});
// Dropdown END