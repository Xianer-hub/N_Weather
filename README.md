# Weather App

A simple and elegant weather application built with React, TypeScript, Vite, and Tailwind CSS. It provides current weather conditions and a 5-day forecast for cities worldwide.

## Features

- **Real-time Weather**: Get current temperature, humidity, wind speed, and feels-like temperature.
- **5-Day Forecast**: View weather predictions for the upcoming days.
- **City Search**: Search for cities with auto-suggestions.
- **Unit Conversion**: Toggle between Celsius and Fahrenheit.
- **Responsive Design**: Works seamlessly on desktop and mobile devices.
- **Offline Mode**: Detects when you are offline.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js**: v18 or higher recommended.
- **npm** or **yarn**: Package manager to install dependencies.

## Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/yourusername/weather-app.git
    cd weather-app
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    # or
    yarn install
    ```

## Configuration (API Key)

To use this application, you need an API key from [OpenWeatherMap](https://openweathermap.org/).

1.  **Sign up** for a free account at OpenWeatherMap.
2.  **Generate an API Key** from your account dashboard.
3.  **Create a `.env` file** in the root directory of the project.
4.  **Add your API Key** to the `.env` file using the following variable name:

    ```env
    VITE_OPENWEATHER_API_KEY=your_actual_api_key_here
    ```

    > **Note**: The variable name must start with `VITE_` to be exposed to the frontend application (if using client-side only) or accessible via `process.env` in the backend proxy.

## Running the Application

This project uses a hybrid approach with an Express backend proxy to handle API requests and avoid CORS issues, while serving the React frontend via Vite.

1.  **Start the development server**:

    ```bash
    npm run dev
    ```

    This command starts the backend server (which also proxies the frontend).

2.  **Open your browser** and navigate to:

    ```
    http://localhost:3000
    ```

## Important Notes

-   **API Rate Limits**: The free tier of OpenWeatherMap has rate limits (e.g., 60 calls/minute). The application includes a basic rate limiter on the backend to help manage this.
-   **Backend Proxy**: The application uses a local Express server (`server/index.ts`) to proxy requests to OpenWeatherMap. This hides your API key from the browser network tab and solves CORS issues. Ensure you run the app using `npm run dev` (which runs `tsx server/index.ts`) rather than just `vite`.
-   **Environment Variables**: Never commit your `.env` file to version control (e.g., GitHub). The `.gitignore` file should already exclude it.

## Build for Production

To build the application for production:

```bash
npm run build
```

This will generate static files in the `dist` directory. You can then serve these files using any static file server or deploy the backend `server/index.ts` to a Node.js environment (like Heroku, Vercel, or Render) ensuring the `VITE_OPENWEATHER_API_KEY` environment variable is set in your deployment platform.
