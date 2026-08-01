import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            colors: {
                // Kept from the old site's --primaryColor (#af9a7d), just given
                // a tonal family instead of one flat swatch.
                cream: '#FAF7F2',
                'cream-deep': '#F0EBE2',
                ink: '#201F1D',
                line: '#E4DDD0',
                gold: {
                    light: '#C9BBA4',
                    DEFAULT: '#AF9A7D',
                    dark: '#8A7860',
                },
            },
            fontFamily: {
                // Display: a warm serif with a little personality for a
                // mountain lodge — used sparingly, headlines only.
                display: ['"Fraunces"', ...defaultTheme.fontFamily.serif],
                // Body/UI: a clean grotesque that does the actual work.
                sans: ['"Work Sans"', ...defaultTheme.fontFamily.sans],
            },
            boxShadow: {
                card: '0 8px 30px -12px rgba(32, 31, 29, 0.18)',
                lift: '0 20px 45px -18px rgba(32, 31, 29, 0.28)',
            },
        },
    },

    plugins: [forms],
};
