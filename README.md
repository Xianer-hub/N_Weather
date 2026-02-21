# Notion Weather Widget

A minimal, elegant weather widget designed specifically for embedding in [Notion](https://www.notion.so/). Built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- **Notion-Optimized Layout**: Compact, responsive design that fits perfectly in Notion columns without wasted space.
- **Auto-Fetch**: Automatically loads weather for the last searched city when the widget loads.
- **Real-time Weather**: Current temperature, humidity, wind speed, and feels-like temperature.
- **5-Day Forecast**: Concise daily forecast with icons and temperatures.
- **City Search**: Search for cities worldwide (English input recommended).
- **Unit Conversion**: Toggle between Celsius and Fahrenheit (preference saved).
- **Offline Mode**: Gracefully handles network disconnection.

## How to Embed in Notion

1.  **Deploy the App**: Deploy this application to a hosting provider (e.g., Google Cloud Run, Vercel, Render).
2.  **Copy the URL**: Get the public URL of your deployed app (e.g., `https://your-weather-app.run.app`).
3.  **Paste in Notion**:
    - Open your Notion page.
    - Paste the URL.
    - Select **"Create embed"** from the menu.
4.  **Resize**: Adjust the width and height of the embed block to fit your page layout. The widget will automatically adapt.

## Configuration

To run this application, you need an API key from [OpenWeatherMap](https://openweathermap.org/).

1.  **Sign up** for a free account at OpenWeatherMap.
2.  **Generate an API Key** from your account dashboard.
3.  **Set Environment Variable**:
    - Add `VITE_OPENWEATHER_API_KEY` to your environment variables.
    - In `.env` file (for local dev):
      ```env
      VITE_OPENWEATHER_API_KEY=your_actual_api_key_here
      ```

## Development

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start development server**:
    ```bash
    npm run dev
    ```
    Access at `http://localhost:3000`.

3.  **Build for production**:
    ```bash
    npm run build
    ```

4.  **Start production server**:
    ```bash
    npm start
    ```

## Tech Stack

-   **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons
-   **Build Tool**: Vite
-   **Backend Proxy**: Express (handles API requests to hide keys and solve CORS)
-   **API**: OpenWeatherMap

## License

MIT
