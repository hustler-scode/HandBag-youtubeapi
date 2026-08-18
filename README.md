# Fashion eCommerce Shop

A modern, fully responsive fashion eCommerce storefront designed with a premium user experience in mind. This project provides a complete template for an online clothing store, featuring product browsing, individual product details, cart management, and user authentication flows.

## System Architecture & Stack

This application is built with a modern frontend stack focused on performance, type safety, and developer experience.

### Core Technologies

* **[React 18](https://reactjs.org/)**: The core UI library, utilizing modern React hooks and functional components.
* **[Vite](https://vitejs.dev/)**: Next-generation frontend tooling providing lightning-fast Hot Module Replacement (HMR) and optimized production builds.
* **[TypeScript](https://www.typescriptlang.org/)**: Ensures robust, type-safe code, reducing runtime errors and improving developer productivity.

### State Management & Data Fetching

* **[Redux Toolkit](https://redux-toolkit.js.org/)**: Manages complex global application state (like the shopping cart and user session) with a simplified, opinionated approach.
* **[React-Redux](https://react-redux.js.org/)**: Official React bindings for Redux.
* **[Axios](https://axios-http.com/)**: Promise-based HTTP client for making API requests to the backend.

### Routing & Navigation

* **[React Router DOM v6](https://reactrouter.com/)**: Handles declarative, client-side routing, enabling seamless navigation between pages without full page reloads.

### Styling & UI Components

* **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapid UI development and consistent design tokens.
* **[Headless UI](https://headlessui.com/)**: Completely unstyled, fully accessible UI components (used for complex interactive elements like dropdowns and modals).
* **[React Icons](https://react-icons.github.io/react-icons/)**: Scalable vector icons for clean visual indicators.
* **[React Hot Toast](https://react-hot-toast.com/)**: Provides lightweight, customizable notifications for user actions (e.g., "Added to cart").

### Backend & API Simulation

* **[JSON Server](https://github.com/typicode/json-server)**: Simulates a full REST API utilizing a simple JSON file, allowing for frontend development independent of a production backend.
* **[Concurrently](https://github.com/open-cli-tools/concurrently)**: A development utility to run both the Vite frontend server and the JSON backend server simultaneously with a single command.

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/hustler-scode/HandBag-youtubeapi.git
   cd HandBag-youtubeapi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development servers (runs both the React frontend and JSON server backend):
   ```bash
   npm start
   ```

The application will typically be available at `http://localhost:5173/`, and the mock API at `http://localhost:3000/`.

## Key Features

* **Responsive Design**: Flawless experience across mobile, tablet, and desktop viewports.
* **Product Catalog**: Browse and filter fashion items.
* **Shopping Cart**: Add, remove, and update item quantities in a global cart.
* **Authentication UI**: Pre-built mock flows for Login and Registration.
* **User Profiles & Order History**: Dedicated views for user account management.
