/**
 * Theme Style Switcher
 * Add this code to your app.js file to enable theme style switching
 */

// Initialize theme style on page load
(function() {
    // Load saved theme style preference
    var savedThemeStyle = localStorage.getItem('theme-style') || 'modern';
    document.documentElement.setAttribute('data-theme-style', savedThemeStyle);
    
    // Set the select value if the element exists
    var themeStyleSelect = document.getElementById('theme-style-select');
    if (themeStyleSelect) {
        themeStyleSelect.value = savedThemeStyle;
    }
})();

// Add event listener for theme style changes
document.addEventListener('DOMContentLoaded', function() {
    var themeStyleSelect = document.getElementById('theme-style-select');
    
    if (themeStyleSelect) {
        themeStyleSelect.addEventListener('change', function() {
            var themeStyle = this.value;
            document.documentElement.setAttribute('data-theme-style', themeStyle);
            localStorage.setItem('theme-style', themeStyle);
        });
    }
    
    // Also handle it in the appearance save button if you have one
    var appearanceSaveBtn = document.getElementById('appearance-save');
    if (appearanceSaveBtn) {
        appearanceSaveBtn.addEventListener('click', function() {
            var themeStyleSelect = document.getElementById('theme-style-select');
            if (themeStyleSelect) {
                var themeStyle = themeStyleSelect.value;
                document.documentElement.setAttribute('data-theme-style', themeStyle);
                localStorage.setItem('theme-style', themeStyle);
            }
        });
    }
});
