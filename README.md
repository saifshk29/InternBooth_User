# BridgeIntern - College Internship Platform

BridgeIntern is a web application that connects college students with internship opportunities sourced by faculty members through their industry connections. This platform streamlines the internship application process, selection, and management.

## Features

- **For Students:**
  - Custom profile creation with education details, skills, and resume upload
  - Browse and apply for internships
  - Internship filtering based on interest domains
  - Multi-stage application process (quiz and shortlisting)
  - Application status tracking
  - Personalized course recommendations

- **For Faculty:**
  - Post internship opportunities with detailed information
  - Track and manage student applications
  - Evaluate and shortlist candidates based on quiz results
  - Select or reject candidates for final selection

## Tech Stack

- **Frontend:** React.js with Tailwind CSS
- **Backend:** Firebase (Authentication, Firestore, Storage)
- **Deployment:** Firebase Hosting

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/bridgeintern.git
   cd bridgeintern
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure Firebase:
   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password), Firestore Database, and Storage
   - Obtain your Firebase configuration from Project Settings
   - Update the configuration in `src/firebase/config.js` with your Firebase credentials

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Deployment

1. Build the project:
   ```
   npm run build
   ```

2. Deploy to Firebase Hosting:
   ```
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

## Project Structure

```
src/
├── components/         # Reusable UI components
├── context/            # Application context (auth)
├── firebase/           # Firebase configuration and utilities
├── pages/              # Application pages
│   ├── auth/           # Authentication pages (Login, Register)
│   ├── faculty/        # Faculty-specific pages
│   ├── internships/    # Internship related pages
│   └── student/        # Student-specific pages
└── main.jsx            # Application entry point
```

## License

MIT

## Contributors

- [Your Name](https://github.com/yourusername)

## Acknowledgements

- React.js
- Tailwind CSS
- Firebase
