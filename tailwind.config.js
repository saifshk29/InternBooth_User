/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F1F5F9", // Light background from image
        surface: "#FFFFFF",    // For cards and elevated elements
        primary: "#4F46E5",    // Primary button color
        "primary-dark": "#4338CA", // Darker shade for hover
        success: "#10B981",    // Success color for buttons
        "success-dark": "#059669", // Darker success shade for hover
        text: "#0F172A",       // Primary text color
        subtext: "#64748B",    // Secondary text color
        // Domain tag colors
        'tag-blue': '#EBF5FF',
        'tag-blue-text': '#1E40AF',
        'tag-red': '#FEE2E2',
        'tag-red-text': '#991B1B',
        'tag-green': '#DCFCE7',
        'tag-green-text': '#166534',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 