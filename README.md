# Quizy — Online Quiz Platform

Quizy is a full-stack online quiz platform designed to make creating, attempting, and evaluating quizzes simple and accessible.

The platform provides a quiz-taking experience with question navigation, answer selection, progress tracking, submission, and performance summaries.

## Features

- **Quiz Creation:** Create quizzes with questions and answer options.
- **Quiz Attempts:** Attempt quizzes through an interactive examination interface.
- **Question Navigation:** Navigate between questions and track answered and unanswered questions.
- **Answer Saving:** Save selected answers during an attempt.
- **Submission:** Submit completed attempts.
- **Result Evaluation:** View scores, percentages, and performance summaries.
- **Responsive Interface:** Clean interface designed for different screen sizes.

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Tailwind CSS
- Axios
- Lucide React

### Backend
- Backend framework: Add your actual backend technology.
- Database: Add your actual database.
- Authentication: Bearer-token-based API authentication.

## Project Structure

```text
Quizy/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── ...
│   │   └── ...
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── ...
│   └── package.json
│
└── README.md
```

Adjust this structure to match the actual folders in your repository.

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm
- Git
- A configured backend and database

### 1. Clone the repository

```bash
git clone https://github.com/prabhatgautam7171/Quizy.git
cd Quizy
```

### 2. Set up the frontend

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Replace the URL with your actual backend API address and port.

Start the frontend:

```bash
npm run dev
```

### 3. Set up the backend

Open another terminal:

```bash
cd backend
npm install
```

Configure the backend environment variables using the backend's `.env.example` file.

Start the backend using the appropriate script defined in its `package.json`.

> Note: Backend commands and environment variables should be updated to match the actual backend implementation.

## Data Model and Design Decisions

The application follows a resource-oriented approach, separating quiz creation, quiz attempts, submitted answers, and result evaluation.

The main conceptual entities are:

### Quiz
Represents a quiz created by a user.

Typical information:
- Quiz title and description
- Questions
- Answer options
- Correct answers
- Marks or scoring configuration

### Question
Represents an individual question belonging to a quiz.

Typical information:
- Question text
- Available options
- Correct answer
- Marks

### Attempt
Represents a user's attempt at a quiz.

Typical information:
- User reference
- Quiz reference
- Selected answers
- Attempt status
- Submission information
- Score and total marks

### Answer
Represents an answer selected for a question during an attempt.

Typical information:
- Question reference
- Selected option
- Associated attempt

These are conceptual entities. Their exact fields, relationships, and storage format depend on the backend implementation.

### Main Design Decisions

- Separate quiz definitions from individual quiz attempts.
- Keep answer selection associated with a specific attempt.
- Save answers through the API rather than relying exclusively on frontend state.
- Keep result evaluation separate from the question-taking interface.
- Use reusable React components to maintain consistency.
- Use Axios for communication between frontend and backend.

## API Integration

The attempt workflow currently uses these API operations:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/attempts/:attemptId` | Retrieve an attempt |
| PUT | `/attempts/:attemptId/answers` | Save selected answers |
| POST | `/attempts/:attemptId/submit` | Submit an attempt |
| GET | `/attempts/:attemptId/result` | Retrieve the attempt result |

Authenticated requests use a Bearer token.

## Project Status

### Implemented

- Quiz creation interface
- Quiz-taking interface
- Question navigation and answer selection
- Answer-saving integration
- Quiz submission flow
- Result and score presentation
- Responsive UI improvements

### To Improve

- Expand automated frontend and backend testing.
- Improve validation and error handling.
- Add more detailed performance analytics.
- Improve accessibility.
- Strengthen edge-case handling for interrupted attempts.
- Add additional quiz-management capabilities.

## What I Would Do With More Time

I would focus on improving reliability and scalability before adding unnecessary complexity.

My priorities would be:

1. Add comprehensive unit and integration tests.
2. Improve quiz analytics and reporting.
3. Add stronger validation and security checks.
4. Improve the user experience on mobile devices.
5. Add more flexible question types and quiz configurations.
6. Improve deployment, monitoring, and documentation.

## AI Tools Used

**ChatGPT**
- Assisted with UI/UX refinement and component redesign.
- Helped review React component structure and improve code readability.
- Assisted with debugging and implementation discussions.
- Helped prepare project documentation.

AI-generated suggestions were reviewed and adapted during development. AI was used as a development assistant, not as a replacement for understanding or validating the implementation.

## Live Demo

Not deployed yet.

## Repository

[GitHub — Quizy](https://github.com/prabhatgautam7171/Quizy)

## Author

**Prabhat Gautam**

GitHub: [@prabhatgautam7171](https://github.com/prabhatgautam7171)
