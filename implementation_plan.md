# implementation_plan.md

## LocalEventSync - Implementation Plan

### 1. Technology Stack
- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL, Auth, Realtime)
- **Maps**: Leaflet (via React Leaflet) or Mapbox (decided: Leaflet for ease of setup without keys in demo)
- **QR Codes**: `qrcode.react` for generation, `html5-qrcode` or similar for scanning.

### 2. Database Schema (Supabase)

#### Tables
1.  **profiles**
    - `id`: uuid (primary key, references auth.users)
    - `email`: text
    - `live_location`: geography(Point) (nullable)
    - `is_organizer`: boolean (default false)
    - `updated_at`: timestamp

2.  **events**
    - `id`: uuid (primary key)
    - `title`: text
    - `description`: text
    - `location`: geography(Point)
    - `start_time`: timestamp
    - `end_time`: timestamp
    - `organizer_id`: uuid (references profiles.id)

3.  **rsvps**
    - `id`: uuid (primary key)
    - `user_id`: uuid (references profiles.id)
    - `event_id`: uuid (references events.id)
    - `status`: text (default 'going')
    - `checked_in_at`: timestamp (nullable)
    - `qr_code_token`: uuid (default gen_random_uuid())

#### Row Level Security (RLS)
- **profiles**:
    - Select: Users can see their own. Organizers can see users who RSVP'd to their events.
    - Update: Users can update their own `live_location`.
- **events**:
    - Select: Public.
    - Insert/Update: Organizers only.
- **rsvps**:
    - Select: User sees own. Organizer sees RSVPs for their events.
    - Insert: Authenticated users.
    - Update: User can cancel (status). Organizer can update `checked_in_at`.

### 3. Core Modules

#### A. Authentication
- Supabase Auth UI or Custom Form.
- Providers: Email/Password, Google.

#### B. Event Discovery (Map)
- **Component**: `EventMap`
- **Logic**:
    - Get user coordinates via browser API.
    - Fetch events within radius (using PostGIS `st_dwithin` if possible, or client-side filter for MVP).
    - Display markers.

#### C. RSVP & QR Generation
- **Component**: `EventCard` -> `RSVPButton`.
- **Action**: Insert row into `rsvps`.
- **Display**: On successful RSVP, show "My Ticket" with QR code encoding the `rsvps.id` (or a specific secure token).

#### D. Live Location Tracking
- **Hook**: `useLocationTracker`
- **Logic**:
    - `useEffect` checks if user has active RSVP (today).
    - If yes, `setInterval` (60s).
    - `navigator.geolocation.getCurrentPosition` -> specific Supabase RPC or update `profiles` table.

#### E. Organizer Scanner
- **Route**: `/scan` (Protected, organizer only).
- **Library**: `react-qr-reader` or `html5-qrcode`.
- **Logic**:
    - Scan QR (contains RSVP ID).
    - Query `rsvps` table.
    - Check logic:
        - If `checked_in_at` is NULL -> Set timestamp -> "Success".
        - If `checked_in_at` is SET -> "Already checked in at X".

### 4. Verification Plan
- **Infrastructure**: Verify Supabase connection and table creation.
- **Auth**: Test login/logout.
- **Map**: Mock location, ensure markers appear.
- **Scanner**: Use 2 browser sessions (User & Mobile/Organizer) to test scan flow.
