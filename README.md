# Belecure 2.0

A modern interior design and floor plan editor application built with Next.js, featuring authentication, project management, and interactive design tools.

## Features

- 🏠 **Floor Plan Editor**: Interactive floor plan creation and editing
- 💡 **Lighting Design**: Advanced lighting configuration and visualization
- 🎨 **Enhancement Tools**: Interior design enhancement features
- 👤 **User Authentication**: Secure login and user management
- 💾 **Project Management**: Save, load, and manage design projects
- 📱 **Responsive Design**: Mobile-friendly interface
- 🔗 **Project Sharing**: Share and preview projects with unique URLs

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Database**: MongoDB
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library with shadcn/ui
- **Authentication**: Custom JWT-based auth system
- **State Management**: React hooks and context

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rohitmenonhart-xhunter/belecure2.0.git
cd belecure2.0
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── api/            # API routes
│   ├── floor-plan-editor/
│   ├── lighting/
│   └── enhancement/
├── components/         # Reusable React components
│   ├── floor-plan/
│   ├── layout/
│   └── ui/            # UI component library
├── hooks/             # Custom React hooks
└── lib/               # Utilities and models
    └── models/        # Database models
```

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/projects/*` - Project management
- `/api/projects/preview/[projectId]` - Project preview

## Deployment

This project is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically with each push

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub. 