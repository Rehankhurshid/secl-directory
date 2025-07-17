# 🚀 Deployment Guide - Railway

This guide will help you deploy your Employee Directory PWA to Railway.

## Prerequisites

1. [Railway Account](https://railway.app) (free signup)
2. GitHub account (for connecting your repository)

## Step 1: Prepare Your Repository

Your repository is already configured with:

- ✅ `railway.toml` - Railway configuration
- ✅ `Procfile` - Process file for deployment
- ✅ `.env.production` - Production environment template
- ✅ Build scripts in `package.json`

## Step 2: Push to GitHub

1. **Commit your changes:**

   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

2. **Create a GitHub repository** (if not already done):
   - Go to [GitHub](https://github.com/new)
   - Create a new repository
   - Push your local code:
     ```bash
     git remote add origin https://github.com/yourusername/employee-directory.git
     git push -u origin main
     ```

## Step 3: Deploy to Railway

1. **Sign up/Login to Railway:**

   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project:**

   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add PostgreSQL Database:**

   - In your Railway project dashboard
   - Click "New Service"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically create the database

4. **Configure Environment Variables:**

   - Click on your web service
   - Go to "Variables" tab
   - Add these variables:
     ```
     NODE_ENV=production
     PORT=3000
     ```
   - The `DATABASE_URL` will be automatically set by Railway when you connect the PostgreSQL service

5. **Connect Database to App:**

   - In your web service, go to "Settings"
   - Under "Service Connections", connect to your PostgreSQL database
   - This automatically sets the `DATABASE_URL` environment variable

6. **Deploy:**
   - Railway will automatically build and deploy your app
   - Wait for the build to complete
   - Your app will be available at the provided Railway URL

## Step 4: Initialize Database

After deployment, you'll need to set up the database schema:

1. **Access Railway CLI (Optional method):**

   ```bash
   npm install -g @railway/cli
   railway login
   railway link [your-project-id]
   railway run npm run db:push
   ```

2. **Or use Railway Dashboard:**
   - Go to your PostgreSQL service in Railway
   - Click "Connect"
   - Use the provided connection details to run:
     ```sql
     -- You can run this through the Railway database interface
     -- or use a tool like pgAdmin with the connection details
     ```

## Step 5: Optional Configurations

### Firebase (Push Notifications)

If you want push notifications, add these to Railway environment variables:

```
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_SENDER_ID=your_sender_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_VAPID_KEY=your_vapid_key
```

### Twilio (SMS OTP)

For SMS authentication, add:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
```

## Step 6: Custom Domain (Optional)

1. In Railway dashboard, go to your web service
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Configure DNS as instructed

## Troubleshooting

### Build Fails

- Check Railway build logs
- Ensure all dependencies are in `package.json`
- Check Node.js version compatibility

### Database Connection Issues

- Verify PostgreSQL service is connected
- Check `DATABASE_URL` environment variable is set
- Ensure database schema is pushed (`npm run db:push`)

### App Won't Start

- Check if `PORT` environment variable is set to `3000`
- Verify the start command: `node dist/index.js`
- Check Railway logs for error details

## Expected Results

✅ **Your app will be live at:** `https://your-app-name.up.railway.app`
✅ **Features working:**

- Employee directory with 900+ employees
- Real-time messaging
- PWA installation
- Admin panel
- Authentication system

## Cost Estimate

- **Free Tier:** $5/month credit (should cover small usage)
- **PostgreSQL:** ~$5-10/month
- **Web Service:** Based on usage

## Support

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- Check Railway logs for debugging
