// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    'border-l-chart-1',
    'border-l-chart-2',
    'border-l-chart-3',
    'border-l-chart-4',
    'border-l-chart-5',
  ],
  theme: {
    extend: {
      colors: {
        chart: {
          1: 'oklch(var(--chart-1))',
          2: 'oklch(var(--chart-2))',
          3: 'oklch(var(--chart-3))',
          4: 'oklch(var(--chart-4))',
          5: 'oklch(var(--chart-5))',
        },
      },
    },
  },
}
