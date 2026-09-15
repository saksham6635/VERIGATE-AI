class ApplicationCore {
    static init() {
        console.log('[Verigate AI] System initializing...');
        this.setupThemeManager();
    }

    static setupThemeManager() {
        const html = document.documentElement;
        
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('VERIGATE_THEME');
        if (savedTheme === 'light') {
            html.classList.remove('dark');
        } else {
            html.classList.add('dark'); // Default to dark
        }

        // Listen for toggle requests from navbar
        window.addEventListener('theme-toggle-requested', () => {
            if (html.classList.contains('dark')) {
                html.classList.remove('dark');
                localStorage.setItem('VERIGATE_THEME', 'light');
            } else {
                html.classList.add('dark');
                localStorage.setItem('VERIGATE_THEME', 'dark');
            }
        });
    }
}

ApplicationCore.init();