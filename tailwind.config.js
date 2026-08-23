/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'leaf-accent': '#5B8C6F',
        'leaf-accent-hover': '#4A755C',
      },
      fontFamily: {
        ui: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe WPC"',
          '"Segoe UI"',
          '"Helvetica Neue"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        editor: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe WPC"',
          '"Segoe UI"',
          '"Helvetica Neue"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        mono: ['"SF Mono"', '"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
