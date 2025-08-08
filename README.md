# iTwin Demo Portal

A simple demo application integrating iTwin Platform APIs including Reality Modeling and Access Control.

## Setup

1. **Register App**: Create a Single Page Application at [iTwin Developer Portal](https://developer.bentley.com/)
   - Redirect URI: `http://localhost:5173/`
   - Post-logout URI: `http://localhost:5173/`

2. **Environment**: Create `.env` file:
   ```
   VITE_CLIENT_ID="your-client-id-here"
   ```

3. **Run**:
   ```bash
   npm install
   npm run dev
   ```

Open `http://localhost:5173` in your browser.