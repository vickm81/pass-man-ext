// Extension-specific theme switching logic
document.addEventListener('DOMContentLoaded', function() {
    const themeSwitch = document.getElementById('themeSwitch');
    const htmlTag = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    
    // Use chrome.storage.sync instead of localStorage
    function updateThemeIcon() {
        const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
        themeIcon.classList.toggle('bi-moon-fill', isDark);
        themeIcon.classList.toggle('bi-sun-fill', !isDark);
    }

    // Set initial theme
    function setInitialTheme() {
        // First check chrome.storage for saved theme
        chrome.storage.sync.get(['theme'], function(result) {
            let theme;
            
            if (result.theme) {
                theme = result.theme;
            } else {
                // Fall back to system preference if no saved theme
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                theme = systemPrefersDark ? 'dark' : 'light';
            }

            htmlTag.setAttribute('data-bs-theme', theme);
            themeSwitch.checked = theme === 'dark';
            updateThemeIcon();
        });
    }

    // Initial theme setup
    setInitialTheme();

    // Theme toggle event listener
    themeSwitch.addEventListener('change', () => {
        const newTheme = themeSwitch.checked ? 'dark' : 'light';
        htmlTag.setAttribute('data-bs-theme', newTheme);
        
        // Save to chrome.storage instead of localStorage
        chrome.storage.sync.set({ theme: newTheme }, function() {
            console.log('Theme saved:', newTheme);
        });
        
        updateThemeIcon();
    });

    // Listen for system theme changes (optional)
    window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
        chrome.storage.sync.get(['theme'], function(result) {
            // Only change if no theme is explicitly set
            if (!result.theme) {
                const newTheme = e.matches ? 'dark' : 'light';
                htmlTag.setAttribute('data-bs-theme', newTheme);
                themeSwitch.checked = e.matches;
                updateThemeIcon();
            }
        });
    });
});