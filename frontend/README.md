# Just Clothing E-commerce Frontend

A modern e-commerce marketplace built with React and Vite.

## Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── assets/         # Images, fonts, and other static assets
│   ├── components/     # Reusable UI components
│   │   ├── common/     # Shared components (buttons, inputs, etc.)
│   │   ├── layout/     # Layout components (header, footer, etc.)
│   │   └── product/    # Product-related components
│   ├── features/       # Feature-based components and logic
│   │   ├── auth/       # Authentication related
│   │   ├── cart/       # Shopping cart functionality
│   │   ├── products/   # Product listing and details
│   │   └── checkout/   # Checkout process
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API services and utilities
│   ├── store/          # Redux store configuration
│   ├── styles/         # Global styles and theme
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Root component
│   └── main.jsx        # Entry point
├── .eslintrc.js        # ESLint configuration
├── .gitignore          # Git ignore file
├── index.html          # HTML template
├── package.json        # Project dependencies
└── vite.config.js      # Vite configuration
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Features

- Modern React with Vite
- Redux Toolkit for state management
- React Router for navigation
- Styled Components for styling
- Form handling with Formik and Yup
- Axios for API requests
- ESLint for code quality
