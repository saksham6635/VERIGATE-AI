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
        { name: 'Overview', path: 'index.html', id: 'home', icon: 'layout-dashboard' },
        { name: 'OCR & Vision', path: 'module1_ocr.html', id: 'ocr', icon: 'scan-text' },
        { name: 'Rules & MRZ', path: 'module2_validation.html', id: 'validation', icon: 'file-check-2' },
        { name: 'Tamper & ELA', path: 'module3_tamper.html', id: 'tamper', icon: 'microscope' },
        { name: 'Face Verify', path: 'module4_facematch.html', id: 'facematch', icon: 'user-check' },
        { name: 'Audit Logs', path: 'logs.html', id: 'logs', icon: 'clipboard-list' }
    ];

    navRoot.innerHTML = `
        <nav class="app-nav" aria-label="Main navigation">
            <div class="app-nav-inner">
                <a class="app-brand" href="index.html" aria-label="VeriGate AI overview">
                    <span class="brand-mark" aria-hidden="true">
                        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 3.75 33.5 8.8v10.1c0 8.25-5.3 14.15-13.5 17.35C11.8 33.05 6.5 27.15 6.5 18.9V8.8L20 3.75Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                            <path d="M14 12.25h8.1l4 4v4.1M22 12.25v4.1h4.1" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="m13.5 22.15 4.15 4.15 8.85-8.85" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                    <span class="brand-wordmark"><span class="brand-name">VeriGate</span><span class="brand-ai">AI</span></span>
                </a>

                <div class="app-nav-links">
                    ${navLinks.map(link => `
                        <a href="${link.path}" ${activePageId === link.id ? 'aria-current="page"' : ''}
                           class="app-nav-link ${activePageId === link.id ? 'is-active' : ''}">
                            <i data-lucide="${link.icon}" aria-hidden="true"></i><span>${link.name}</span>
                        </a>
                    `).join('')}
                </div>

                <div class="app-nav-tools">
                    <label class="api-key-field" for="global-api-key">
                        <i data-lucide="key-round" aria-hidden="true"></i>
                        <input type="password" id="global-api-key" placeholder="Groq API key" autocomplete="off" value="${CONFIG.getGroqKey()}" aria-label="Groq API key">
                    </label>
                    <button id="save-key-btn" class="api-key-save" type="button">Save key</button>
                    <button id="theme-toggle" class="icon-button" type="button" title="Toggle light or dark theme" aria-label="Toggle light or dark theme">
                        <i data-lucide="sun" class="theme-icon-light" aria-hidden="true"></i>
                        <i data-lucide="moon" class="theme-icon-dark" aria-hidden="true"></i>
                    </button>
                    <button id="mobile-nav-toggle" class="icon-button mobile-nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav-links" aria-label="Open navigation menu">
                        <i data-lucide="menu" class="menu-open-icon" aria-hidden="true"></i>
                        <i data-lucide="x" class="menu-close-icon" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
            <div id="mobile-nav-links" class="mobile-nav-links" hidden>
                ${navLinks.map(link => `<a href="${link.path}" ${activePageId === link.id ? 'aria-current="page"' : ''} class="mobile-nav-link ${activePageId === link.id ? 'is-active' : ''}"><i data-lucide="${link.icon}" aria-hidden="true"></i>${link.name}</a>`).join('')}
                <div class="mobile-api-key">
                    <label for="mobile-api-key">Groq API key</label>
                    <div class="mobile-api-key-row"><input type="password" id="mobile-api-key" placeholder="Enter API key" autocomplete="off" value="${CONFIG.getGroqKey()}"><button id="mobile-save-key-btn" class="api-key-save" type="button">Save key</button></div>
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

    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const mobileLinks = document.getElementById('mobile-nav-links');
    mobileToggle?.addEventListener('click', () => {
        const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileToggle.setAttribute('aria-expanded', String(!isExpanded));
        mobileToggle.setAttribute('aria-label', isExpanded ? 'Open navigation menu' : 'Close navigation menu');
        mobileLinks.hidden = isExpanded;
    });

    mobileLinks?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileLinks.hidden = true;
            mobileToggle?.setAttribute('aria-expanded', 'false');
        });
    });

    // 3. API KEY SAVER
    document.getElementById('save-key-btn')?.addEventListener('click', (e) => {
        const keyInput = document.getElementById('global-api-key').value.trim();
        if (keyInput) {
            CONFIG.setGroqKey(keyInput);
            const mobileKey = document.getElementById('mobile-api-key');
            if (mobileKey) mobileKey.value = keyInput;
            const btn = e.currentTarget;
            btn.textContent = 'Saved';
            btn.classList.add('is-saved');
            setTimeout(() => {
                btn.textContent = 'Save key';
                btn.classList.remove('is-saved');
            }, 2000);
        }
    });

    document.getElementById('mobile-save-key-btn')?.addEventListener('click', (e) => {
        const keyInput = document.getElementById('mobile-api-key').value.trim();
        if (!keyInput) return;
        CONFIG.setGroqKey(keyInput);
        const desktopKey = document.getElementById('global-api-key');
        if (desktopKey) desktopKey.value = keyInput;
        const button = e.currentTarget;
        button.textContent = 'Saved';
        button.classList.add('is-saved');
        setTimeout(() => {
            button.textContent = 'Save key';
            button.classList.remove('is-saved');
        }, 2000);
    });
}