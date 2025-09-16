# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your Lemon Share admin panel.

## 1. Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)

## 2. Environment Variables

Create a `.env.local` file in the `frontend` directory with the following variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Optional: Restrict admin access to specific email addresses
# Comma-separated list of allowed admin emails
# Leave empty to allow any Google account
ALLOWED_ADMIN_EMAILS=admin@example.com,another@example.com
```

## 3. Generate NextAuth Secret

Generate a random secret for NextAuth:

```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

## 4. Configure Admin Access

### Option A: Allow Any Google Account
Leave `ALLOWED_ADMIN_EMAILS` empty or don't set it.

### Option B: Restrict to Specific Emails
Set `ALLOWED_ADMIN_EMAILS` to a comma-separated list of allowed email addresses:
```env
ALLOWED_ADMIN_EMAILS=admin@yourcompany.com,manager@yourcompany.com
```

## 5. Test the Setup

1. Start your application:
   ```bash
   npm start
   ```

2. Go to http://localhost:3000/admin/login
3. Click "Sign in with Google"
4. Complete the Google OAuth flow
5. You should be redirected to the admin dashboard

## 6. Production Deployment

For production deployment:

1. Update the Google OAuth redirect URI to your production domain
2. Set `NEXTAUTH_URL` to your production URL
3. Ensure all environment variables are set in your production environment

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**: Make sure the redirect URI in Google Console matches exactly
2. **"Client ID not found"**: Check that your environment variables are set correctly
3. **"Access denied"**: Check your `ALLOWED_ADMIN_EMAILS` configuration

### Debug Mode:

Add this to your `.env.local` to enable debug logging:
```env
NEXTAUTH_DEBUG=true
```

## Security Notes

- Never commit your `.env.local` file to version control
- Use strong, unique secrets for production
- Regularly rotate your OAuth credentials
- Consider using environment-specific OAuth apps for development and production
