# ReadMe Pro

A modern, highly responsive web application built for creating, managing, and securely sharing notes and collections. Designed with a premium aesthetic and real-time synchronization, ReadMe Pro provides a seamless experience for both personal knowledge management and collaborative sharing.

## Key Features

- **Real-Time Synchronization**: Instantly syncs notes and collections across all devices using Firebase Firestore.
- **Secure Sharing**: Comprehensive access control allowing users to share notes publicly or restrict access with private links.
- **Markdown Support**: Built-in Markdown preview and raw code editing views for a robust writing experience.
- **Export Options**: Download individual notes or entire collections in multiple formats, including Markdown (.md), Plain Text (.txt), and PDF (.pdf).
- **Responsive Design**: Fully responsive interface that adapts seamlessly to desktop, tablet, and mobile devices.
- **Modern UI/UX**: Premium design aesthetics featuring custom dropdowns, professional typography, and system-generated notifications.

## Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: Vanilla CSS, Custom CSS Variables
- **Backend & Database**: Firebase (Firestore, Authentication, Hosting)
- **Utilities**: React Router, React Markdown, html2canvas, jsPDF, JSZip

## Prerequisites

Ensure you have the following installed before setting up the project locally:

- Node.js (v18 or higher recommended)
- npm (Node Package Manager)
- A Firebase project with Firestore and Authentication enabled

## Local Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ChaniruWeerasinghe/ReadMe-Pro.git
   cd ReadMe-Pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your Firebase configuration details:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Deployment

This application is configured for deployment via Firebase Hosting. 

1. Build the production application:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   npm run deploy
   ```

## Architecture & Design Guidelines

- **Validation**: Centralized strict validation for forms, enforcing robust email and phone number formatting without relying on default browser alerts.
- **Components**: Built with reusable, highly modular React components. Custom UI elements are used strictly instead of default HTML elements.
- **Error Handling**: Graceful error handling using customized toast notifications to provide immediate, clear feedback to the user.
