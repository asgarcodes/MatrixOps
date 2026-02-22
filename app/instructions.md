# LocalEventSync - Setup Instructions

## 1. Environment Setup

The project is initialized in the `app` directory.

1.  **Navigate to the directory**:
    ```bash
    cd app
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    - Open `.env.local`
    - Ensure your Firebase configuration variables are set (API Key, Project ID, etc.).

## 2. Database Setup (Firebase Firestore)

1.  The project uses **Firebase Firestore**.
2.  Data structures for `events`, `rsvps`, and `profiles` are managed through the application logic.
3.  Ensure Firestore is initialized in your Firebase Console and has appropriate Security Rules.

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
  - Enter a valid RSVP document ID from your Firestore `rsvps` collection.
  - Click "Simulate Scan".

## 5. Deployment

Deploy to Vercel or similar:
- Connect your repository.
- Add your Firebase Environment Variables to the deployment settings.
- Ensure the production environment can access your Firestore instance.

