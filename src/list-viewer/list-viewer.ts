const textInput = document.getElementById('text-input') as HTMLTextAreaElement;
const listContainer = document.getElementById('list-container') as HTMLDivElement;
const lineCountEl = document.getElementById('line-count') as HTMLSpanElement;
const clearAllBtn = document.getElementById('clear-all') as HTMLButtonElement;

let lines: string[] = [];

function linkify(text: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 hover:underline decoration-2 font-medium">${url}</a>`;
  });
}

function renderList() {
  if (lines.length === 0) {
    listContainer.innerHTML = `<p class="text-gray-400 text-center mt-10 italic">Henüz veri girişi yapılmadı.</p>`;
    lineCountEl.textContent = '0';
    return;
  }

  listContainer.innerHTML = '';
  lineCountEl.textContent = lines.length.toString();

  lines.forEach((line, index) => {
    if (line.trim() === '') return;

    const item = document.createElement('div');
    item.className = "group flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200 hover:border-indigo-300 transition-all shadow-sm";
    
    const contentHtml = linkify(line);

    item.innerHTML = `
      <span class="text-sm text-gray-700 truncate mr-4">${contentHtml}</span>
      <button class="delete-btn text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0" data-index="${index}">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    `;
    listContainer.appendChild(item);
  });
}

textInput.addEventListener('input', () => {
  const rawValue = textInput.value;
  lines = rawValue.split('\n').filter(l => l.trim() !== '');
  renderList();
});

listContainer.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const deleteBtn = target.closest('.delete-btn') as HTMLButtonElement;

  if (deleteBtn) {
    const index = parseInt(deleteBtn.getAttribute('data-index')!);
    lines.splice(index, 1);
    textInput.value = lines.join('\n');
    renderList();
  }
});

clearAllBtn.addEventListener('click', () => {
  if (confirm('Tüm listeyi temizlemek istediğinize emin misiniz?')) {
    lines = [];
    textInput.value = '';
    renderList();
  }
});

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