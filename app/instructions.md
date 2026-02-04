# LocalEventSync - Setup Instructions

## 1. Environment Setup

The project is initialized in the `app` directory.

1.  **Navigate to the directory**:
    ```bash
    cd app
    ```

2.  **Install Dependencies** (if not already done):
    ```bash
    npm install
    # Ensure all packages are installed:
    npm install @supabase/supabase-js leaflet react-leaflet qrcode.react html5-qrcode @types/leaflet lucide-react clsx tailwind-merge --legacy-peer-deps
    ```

3.  **Environment Variables**:
    - Open `.env.local`
    - Update `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your Supabase Project credentials.

## 2. Database Setup (Supabase)

1.  Go to your Supabase Dashboard > SQL Editor.
2.  Copy the content of `supabase_schema.sql` (located in project root `d:/levi/app/supabase_schema.sql`).
3.  Run the SQL script to create Tables, RLS Policies, and Functions.

## 3. Running the App

1.  Start the development server:
    ```bash
    npm run dev
    ```
2.  Open [http://localhost:3000](http://localhost:3000).

## 4. Verification & Testing Features

To test without moving physically:
- **Mock Geolocation**: Add `?lat=40.7128&lng=-74.0060` to the URL.
  - Example: `http://localhost:3000/?lat=40.7128&lng=-74.0060`
  - This effectively places you in NYC.

- **Mock QR Scan**:
  - Go to `/scan` page.
  - Open the "Debug Actions" dropdown.
  - Enter a valid RSVP UUID (you can find one in your properties or database `rsvps` table).
  - Click "Simulate Scan".

## 5. Deployment

Deploy to Vercel or similar:
- Connect your repository.
- Add the Environment Variables.
- No other config needed (Next.js default).
