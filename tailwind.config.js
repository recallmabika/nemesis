module.exports = {
    darkMode: 'media',
    content: ['./templates/**/*.html'],
    theme: {
        extend: {
            colors: {
                void: '#FAF8F3',
                surface: '#FFFFFF',
                surface2: '#F5F5F5',
                line: 'rgba(0,0,0,0.08)',
                linesoft: 'rgba(0,0,0,0.06)',
                ink: '#1C1C1C',
                steel: '#6B7280',
                steeldim: '#9CA3AF',
                molten: '#C9A84C',
                molten2: '#F0D080',
                moltendark: '#8B6914',
                black: '#000000',
            },
            fontFamily: {
                display: ['Philosopher', 'Georgia', 'serif'],
                body: ['"PT Sans"', 'sans-serif'],
                mono: ['"PT Mono"', 'monospace'],
                script: ['Arizonia', 'cursive'],
            },
        },
    },
};