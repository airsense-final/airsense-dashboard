# AirSense Dashboard

AirSense Dashboard is a modern, real-time IoT monitoring application built with React, TypeScript, and Vite. It provides a comprehensive interface for visualizing air quality data from various sensors (DHT11, MQ-Series) and managing the AirSense IoT ecosystem.

## Features

- **Real-time Monitoring:** Visualize live data from air quality sensors including Temperature, Humidity, Alcohol, Methane, CO, and General Air Quality.
- **Interactive Visualizations:**
  - **Dynamic Charts:** Time-series data visualization using Recharts.
  - **Gauges:** Instant visual feedback for current sensor levels.
  - **Status Indicators:** Color-coded alerts for threshold violations.
- **Historical Analysis & Reporting:**
  - **PDF Export:** Generate and download comprehensive PDF reports of historical alerts and anomalies.
  - **Date Range Filtering:** Filter reports and charts by specific time periods.
- **Alert Management:**
  - **Email Notifications:** Configure and manage automated email alerts for threshold violations.
  - **Real-time Alerts:** Instant UI notifications when sensors exceed safe limits.
- **Authentication & Security:**
  - Secure Login and Registration.
  - Role-Based Access Control (RBAC) for managing user permissions.
- **Simulation Mode:** Built-in tools to test sensor data flows and visualize potential scenarios without hardware.
- **Responsive Design:** Fully responsive UI built with Tailwind CSS, suitable for desktop and mobile devices.

## Tech Stack

- **Frontend Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/airsense-final/airsense-dashboard
   cd airsense-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Running the Application

### Development Server
To start the development server with hot-reload:

```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Production Build
To build the application for production:

```bash
npm run build
```
The build artifacts will be stored in the `dist/` directory.

### Preview Production Build
To locally preview the production build:

```bash
npm run preview
```

## Project Structure

```
airsense-dashboard/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── layout/       # Header, Sidebar, etc.
│   │   ├── widgets/      # Charts, Gauges, Stat panels
│   │   └── simulation/   # Simulation tools
│   ├── pages/            # Application pages (Dashboard, Login, etc.)
│   ├── services/         # API integration and authentication services
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main application component & Routing logic
│   └── main.tsx          # Application entry point
├── public/               # Static assets
└── ...config files       # Vite, Tailwind, TypeScript configs
```

## Configuration

The application communicates with the backend API. Ensure your backend service is running and configured correctly. 
(Configuration details for API endpoints can typically be found in `src/constants.ts` or `.env` files if applicable).
