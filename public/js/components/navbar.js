import { CONFIG } from '../config.js';

export function renderNavbar(activePageId) {
    // 1. INITIALIZE THEME IMMEDIATELY
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('VERIGATE_THEME') || 'dark';
    if (savedTheme === 'light') {
        html.classList.remove('dark');
    } else {
        html.classList.add('dark');
    }

    const navRoot = document.getElementById('navbar-root');
    if (!navRoot) return;

    const navLinks = [
        { name: 'Dashboard', path: 'index.html', id: 'home', icon: 'layout-dashboard' },
        { name: 'OCR & Vision', path: 'module1_ocr.html', id: 'ocr', icon: 'scan-text' },
        { name: 'Rules & MRZ', path: 'module2_validation.html', id: 'validation', icon: 'file-check-2' },
        { name: 'Tamper & ELA', path: 'module3_tamper.html', id: 'tamper', icon: 'microscope' },
        { name: 'Face Verify', path: 'module4_facematch.html', id: 'facematch', icon: 'user-check' },
        { name: 'Audit Logs', path: 'logs.html', id: 'logs', icon: 'clipboard-list' }
    ];

    navRoot.innerHTML = `
        <nav class="bg-brand-darker/80 border-b border-slate-800/50 backdrop-blur-md transition-colors duration-300">
            <div class="container mx-auto px-4 h-16 flex items-center justify-between">
                
                <!-- Logo -->
                <div class="flex items-center gap-3">
                    <div class="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
                        <i data-lucide="shield" class="w-6 h-6 text-emerald-500"></i>
                    </div>
                    <div>
                        <span class="text-white font-bold text-lg tracking-wide">VERIGATE<span class="text-emerald-500">AI</span></span>
                    </div>
                </div>

                <!-- Navigation Links -->
                <div class="hidden lg:flex space-x-1">
                    ${navLinks.map(link => `
                        <a href="${link.path}" 
                           class="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                           ${activePageId === link.id 
                               ? 'bg-emerald-500/10 text-emerald-500 shadow-[inset_0_-2px_0_#10b981]' 
                               : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}">
                            <i data-lucide="${link.icon}" class="w-4 h-4"></i>
                            ${link.name}
                        </a>
                    `).join('')}
                </div>

                <!-- Tools & Theme -->
                <div class="flex items-center gap-3">
                    
                    <!-- Theme Toggle Button -->
                    <button id="theme-toggle" class="p-2 text-slate-400 hover:text-emerald-500 hover:bg-slate-800/50 rounded-md transition-colors border border-transparent hover:border-emerald-500/30" title="Toggle Light/Dark Mode">
                        <i data-lucide="sun" class="w-5 h-5 hidden dark:block"></i>
                        <i data-lucide="moon" class="w-5 h-5 block dark:hidden"></i>
                    </button>

                    <!-- API Key Manager -->
                    <div class="relative group hidden sm:block">
                        <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                            <i data-lucide="key" class="w-3.5 h-3.5 text-slate-500"></i>
                        </div>
                        <input type="password" id="global-api-key" placeholder="Groq Key..." 
                               value="${CONFIG.getGroqKey()}"
                               class="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-md pl-8 pr-3 py-1.5 w-32 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600">
                    </div>
                    <button id="save-key-btn" class="bg-slate-800 hover:bg-emerald-500 hover:text-black text-slate-300 text-xs px-3 py-1.5 rounded-md font-semibold transition-colors border border-slate-700 hover:border-emerald-500 hidden sm:flex items-center gap-1">
                        Save
                    </button>
                </div>
            </div>
        </nav>
    `;

    if (window.lucide) window.lucide.createIcons();

    // 2. THEME TOGGLE CLICK LISTENER
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.setItem('VERIGATE_THEME', 'light');
        } else {
            html.classList.add('dark');
            localStorage.setItem('VERIGATE_THEME', 'dark');
        }
    });

    // 3. API KEY SAVER
    document.getElementById('save-key-btn')?.addEventListener('click', (e) => {
        const keyInput = document.getElementById('global-api-key').value.trim();
        if (keyInput) {
            CONFIG.setGroqKey(keyInput);
            const btn = e.currentTarget;
            btn.innerHTML = `Saved`;
            btn.classList.add('bg-emerald-500', 'text-black');
            setTimeout(() => {
                btn.innerHTML = `Save`;
                btn.classList.remove('bg-emerald-500', 'text-black');
            }, 2000);
        }
    });
}