# Video Conference Manager

A modern, comprehensive video conference management platform built with Next.js 15.3.4, Prisma ORM, Stream.io video integration, and Bunny CDN for file storage. Features role-based authentication, multi-tenant architecture, and server-side rendering for optimal performance.

## 🚀 Features

- **Video Conferencing**: Integrated with Stream.io for high-quality video calls
- **Role-Based Access Control**: Admin, Manager, and User roles with granular permissions
- **Multi-Tenant Architecture**: Company-based isolation with department management
- **File Management**: Bunny CDN integration for secure file uploads and recordings
- **Meeting Management**: Schedule, join, and manage video conferences
- **Recording & Transcription**: Automatic recording with Bunny CDN storage
- **Email Notifications**: Meeting invitations and recording availability alerts
- **Statistics & Analytics**: Comprehensive reporting and usage metrics
- **Modern UI**: Built with ShadCN UI components and Tailwind CSS
- **Server-Side Rendering**: Optimized performance with Next.js App Router

## 🛠 Tech Stack

- **Framework**: Next.js 15.3.4 with App Router
- **Language**: TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **Video**: Stream.io React SDK
- **File Storage**: Bunny CDN
- **Styling**: Tailwind CSS with ShadCN UI
- **Forms**: React Hook Form with Zod validation
- **Email**: Nodemailer
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- Stream.io account
- Bunny CDN account
- SMTP email service

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd video-prisma
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment example file and configure your variables:

```bash
cp env.example .env.local
```

Update `.env.local` with your configuration:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/video_prisma"

# NextAuth.js
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Stream.io Video API
STREAM_API_KEY="your-stream-api-key"
STREAM_SECRET="your-stream-secret-key"

# Bunny CDN
BUNNY_ACCESS_KEY="your-bunny-access-key"
BUNNY_STORAGE_ZONE="your-storage-zone"
BUNNY_CDN_URL="https://cdn.bunny.net"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@yourdomain.com"
```

### 4. Database Setup

Push the Prisma schema to your database:

```bash
npm run db:push
```

### 5. Seed the database

```bash
npm run db:seed
```

This creates default users:
- **Admin**: admin@acme.com / admin123
- **Manager**: manager@acme.com / manager123  
- **User**: user@acme.com / user123

### 6. Start development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗 Project Structure

```
video-prisma/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── login/             # Authentication pages
│   │   ├── meetings/          # Meeting management
│   │   ├── companies/         # Company management
│   │   ├── users/             # User management
│   │   └── statistics/        # Analytics dashboard
│   ├── components/            # React components
│   │   ├── ui/               # ShadCN UI components
│   │   ├── forms/            # Form components
│   │   ├── video/            # Video conference components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utility libraries
│   │   ├── actions/          # Server actions
│   │   ├── data/             # Data fetching functions
│   │   └── validations/      # Zod schemas
│   ├── hooks/                # Custom React hooks
│   ├── providers/            # Context providers
│   └── types/                # TypeScript type definitions
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
└── docs/                     # Documentation
```

## 🔧 Configuration

### Stream.io Setup

1. Create a Stream.io account at [getstream.io](https://getstream.io)
2. Create a new app and get your API keys
3. Configure webhooks for recording events
4. Update environment variables with your Stream.io credentials

### Bunny CDN Setup

1. Create a Bunny CDN account at [bunny.net](https://bunny.net)
2. Create a storage zone for file uploads
3. Configure CORS settings for your domain
4. Update environment variables with your Bunny CDN credentials

### Email Configuration

The application supports multiple email providers:

**Gmail (Recommended for development):**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

**SendGrid:**
```env
SENDGRID_API_KEY="your-sendgrid-api-key"
```

**Resend:**
```env
RESEND_API_KEY="your-resend-api-key"
```

## 🎯 Features Overview

### Authentication & Authorization

- **Multi-role system**: Admin, Manager, User roles
- **Company isolation**: Users can only access their company's data
- **Session management**: JWT-based authentication with NextAuth.js
- **Route protection**: Middleware-based access control

### Video Conferencing

- **Stream.io integration**: High-quality video calls
- **Meeting rooms**: Dedicated spaces for video conferences
- **Participant management**: Host controls and participant roles
- **Screen sharing**: Built-in screen sharing capabilities
- **Recording**: Automatic meeting recording with Bunny CDN storage

### Meeting Management

- **Scheduling**: Create and schedule meetings
- **Invitations**: Email-based meeting invitations
- **Password protection**: Optional meeting passwords
- **Participant management**: Add/remove participants
- **Meeting types**: Meeting, Webinar, Training categories

### File Management

- **Drag & drop uploads**: Modern file upload interface
- **Bunny CDN storage**: Fast and reliable file storage
- **File validation**: Type and size validation
- **Image processing**: Automatic image optimization
- **Recording storage**: Automatic recording uploads

### Analytics & Reporting

- **Usage statistics**: Meeting and user analytics
- **Company metrics**: Performance insights
- **Role-based reporting**: Filtered data based on user role
- **Export capabilities**: Data export functionality

## 🚀 Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Ensure all environment variables are configured in your production environment:

```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
STREAM_API_KEY="your-stream-api-key"
STREAM_SECRET="your-stream-secret"
BUNNY_ACCESS_KEY="your-bunny-access-key"
BUNNY_STORAGE_ZONE="your-storage-zone"
BUNNY_CDN_URL="https://cdn.bunny.net"
SMTP_HOST="your-smtp-host"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
SMTP_FROM="noreply@yourdomain.com"
```

### Database Migration

For production deployments, use Prisma migrations:

```bash
npm run db:generate
npx prisma migrate deploy
```

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
```

### Code Quality

- **ESLint**: Configured with Next.js and TypeScript rules
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Pre-commit hooks**: Automated code quality checks

### Testing

```bash
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run test:coverage # Run tests with coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the [documentation](docs/)
- Review the [FAQ](docs/FAQ.md)

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://prisma.io/) - Database toolkit
- [Stream.io](https://getstream.io/) - Video API
- [Bunny CDN](https://bunny.net/) - CDN and storage
- [ShadCN UI](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework 