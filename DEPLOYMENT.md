# SECL Employee Directory - Deployment Guide

## Overview

This guide covers deploying the SECL Employee Directory PWA using a cost-effective stack:

- **Frontend & API**: Vercel (Serverless)
- **Database**: Supabase (Managed PostgreSQL)
- **Total Monthly Cost**: ~$45/month for production

## Cost Breakdown

### Vercel Pro Plan (~$20/month)

- Unlimited deployments
- Custom domains
- Analytics
- Advanced build features
- 1000 GB bandwidth
- 6000 function GB-hours

### Supabase Pro Plan (~$25/month)

- 8GB database storage
- 100GB bandwidth
- 500MB file storage
- Daily backups
- 24/7 support
- 10 million monthly active users

## Prerequisites

1. **GitHub Account** (for code repository)
2. **Vercel Account** (connected to GitHub)
3. **Supabase Account**
4. **Domain Name** (optional but recommended)

## Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Choose your organization
4. Set project name: `secl-employee-directory`
5. Set database password (save this securely)
6. Choose region closest to your users
7. Click "Create new project"

### 1.2 Configure Database

1. In Supabase Dashboard, go to **Settings** → **Database**
2. Note your connection details:
   - Host: `db.xxx.supabase.co`
   - Database: `postgres`
   - Port: `5432`
   - User: `postgres`
   - Password: `[your-password]`

3. Construct your DATABASE_URL:
   ```
   postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
   ```

### 1.3 Run Database Migrations

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase DATABASE_URL

# Generate and run migrations
npm run db:generate
npm run db:migrate
```

### 1.4 Import Employee Data

```bash
# Run the employee data import script
npm run import:employees
```

## Step 2: Frontend Deployment (Vercel)

### 2.1 GitHub Repository

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial deployment setup"
   git push origin main
   ```

### 2.2 Connect Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "New Project"
3. Import your repository
4. Configure build settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2.3 Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

```bash
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
NEXTAUTH_SECRET=your-32-character-random-string
NEXTAUTH_URL=https://your-domain.vercel.app
ENCRYPTION_KEY=your-32-character-encryption-key
```

**Security Note**: Generate secure random keys:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -hex 32
```

### 2.4 Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Your app will be available at `https://your-project.vercel.app`

## Step 3: Custom Domain (Optional)

### 3.1 Add Domain in Vercel

1. Go to Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 3.2 Update Environment Variables

Update `NEXTAUTH_URL` to your custom domain:

```bash
NEXTAUTH_URL=https://your-domain.com
```

## Step 4: Security Configuration

### 4.1 Row Level Security (RLS) in Supabase

Run these SQL commands in Supabase SQL Editor:

```sql
-- Enable RLS on employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read employee data
CREATE POLICY "Employees are viewable by authenticated users" ON employees
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for admin users to manage employee data
CREATE POLICY "Admins can manage employees" ON employees
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'email' IN (
            SELECT email_id FROM employees WHERE emp_code = auth.jwt() ->> 'emp_code'
        )
    );
```

### 4.2 API Rate Limiting

The application includes built-in rate limiting:

- 100 requests per 15-minute window per IP
- Configurable via environment variables

## Step 5: Monitoring & Analytics

### 5.1 Vercel Analytics

1. In Vercel Dashboard → Project → Analytics
2. Enable Web Analytics
3. Add to your app by installing: `npm install @vercel/analytics`

### 5.2 Error Monitoring (Optional)

For production error tracking:

1. Sign up for [Sentry](https://sentry.io)
2. Add `SENTRY_DSN` to environment variables
3. Install: `npm install @sentry/nextjs`

## Step 6: Performance Optimization

### 6.1 Database Indexing

Ensure proper indexes are created:

```sql
-- Already included in schema, but verify:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_search
ON employees USING gin(to_tsvector('english', name || ' ' || emp_code || ' ' || designation));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_department
ON employees(department) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_area
ON employees(area_name) WHERE is_active = true;
```

### 6.2 Caching Strategy

The app uses:

- **Static Generation**: For public pages
- **ISR**: For employee data (revalidated every hour)
- **Client-side caching**: React Query with 5-minute stale time

## Step 7: Backup & Recovery

### 7.1 Automated Backups

Supabase Pro includes:

- Daily automated backups
- 7-day retention period
- Point-in-time recovery

### 7.2 Manual Backup

```bash
# Export all data
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Import backup
psql $DATABASE_URL < backup-20240101.sql
```

## Step 8: SSL & Security Headers

### 8.1 SSL Certificate

- Vercel provides automatic SSL certificates
- Custom domains get Let's Encrypt certificates

### 8.2 Security Headers

Security headers are configured in `vercel.json`:

- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Referrer-Policy

## Maintenance

### Regular Tasks

1. **Monitor Usage**: Check Vercel and Supabase usage monthly
2. **Update Dependencies**: Run `npm audit` and update packages
3. **Database Maintenance**: Monitor query performance in Supabase
4. **Backup Verification**: Test backup restoration quarterly

### Scaling Considerations

If you exceed the Pro tier limits:

**Vercel Enterprise** ($400+/month):

- Higher bandwidth limits
- Advanced security features
- Priority support

**Supabase Team/Enterprise** ($599+/month):

- Higher resource limits
- Advanced security
- SLA guarantees

## Cost Optimization Tips

1. **Enable compression** (already configured)
2. **Optimize images** using Next.js Image component
3. **Monitor bandwidth** usage in both platforms
4. **Use ISR** instead of SSR where possible
5. **Implement proper caching** strategies

## Support & Troubleshooting

### Common Issues

1. **Build Failures**: Check environment variables
2. **Database Connection**: Verify DATABASE_URL format
3. **Authentication Issues**: Check NEXTAUTH_SECRET and URL
4. **Performance Issues**: Review database queries and indexes

### Getting Help

- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Supabase**: [supabase.com/support](https://supabase.com/support)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)

## Production Checklist

- [ ] Database schema deployed
- [ ] Employee data imported
- [ ] Environment variables configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] RLS policies enabled
- [ ] Rate limiting configured
- [ ] Monitoring enabled
- [ ] Backup strategy verified
- [ ] Performance testing completed
- [ ] Security testing completed
- [ ] User acceptance testing passed

---

**Total Setup Time**: 2-3 hours
**Monthly Cost**: ~$45
**Supports**: 10,000+ concurrent users
**Uptime**: 99.9% guaranteed
