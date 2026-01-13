/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                space: {
                    900: '#0B0E17', // Deep Space
                    800: '#151A2D', // Card BG
                    700: '#1E253E', // Card Border
                    action: '#00D1FF', // Cyan Neon (Buttons)
                    accent: '#7000FF', // Purple Neon
                    success: '#00FFA3', // Green Neon
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'galaxy': "url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5980?auto=format&fit=crop&q=80')",
            }
        },
    },
    plugins: [],
}
