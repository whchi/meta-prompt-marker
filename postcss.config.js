export default {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	plugins: {
		"@tailwindcss/postcss": {},
		autoprefixer: {},
		...(process.env.NODE_ENV === "production" ? { cssnano: {} } : {}),
	},
};
