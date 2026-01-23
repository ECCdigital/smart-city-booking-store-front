import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

export default {
    content: [
        './components/**/*.{js,vue,ts}',
        './layouts/**/*.vue',
        './pages/**/*.vue',
        './plugins/**/*.{js,ts}',
        './app.vue',
        './error.vue',
    ],
    theme: {
        extend: {},
    },
    plugins: [
        plugin(({ addUtilities }) => {
            addUtilities({
                '.glass': {
                    '@apply bg-white/60 dark:bg-gray-900/80 backdrop-blur-lg': {},
                },
                '.glass-strong': {
                    '@apply bg-white/80 dark:bg-gray-900/95 backdrop-blur-xl': {},
                },
                '.glass-light': {
                    '@apply bg-white/40 dark:bg-gray-900/60 backdrop-blur-md': {},
                },
            })
        }),
    ],
} satisfies Config