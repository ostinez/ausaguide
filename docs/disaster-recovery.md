# Disaster Recovery Plan

This document outlines the backup, restore, recovery objectives, incident response, and rollback procedures for the Ausaguide application.

---

## 1. Objectives

- **Recovery Time Objective (RTO)**: 1 hour (the target time to restore full service after an outage).
- **Recovery Point Objective (RPO)**: 24 hours (the maximum targeted age of data that can be lost in the event of an outage).

---

## 2. Backup Strategy

Ausaguide relies on a hybrid backup model combining managed daily backups with manual on-demand snapshots.

### A. Automatic Database Backups (Supabase)
- **Frequency**: Daily.
- **Retention**: 7 days (Free tier) / 30 days (Pro tier).
- **Scope**: Entire Postgres schema, tables, functions, triggers, and Row Level Security (RLS) configurations.

### B. Storage Backups (Supabase Storage)
- **Scope**: User avatars, host verification documents, tour images, and chat attachments.
- **Strategy**: Files are stored in Supabase Storage buckets backed by AWS S3 with replication.

### C. Manual Database Snapshots
- **When**: Prior to running major database migrations, schema modifications, or manual seed scripts.
- **Execution**: Run a manual backup dump from the CLI:
  ```bash
  supabase db dump --local > ./supabase/backups/snapshot_$(date +%F_%T).sql
  ```
  Or using `pg_dump`:
  ```bash
  pg_dump -h db.your-supabase-project.supabase.co -U postgres -d postgres -F p -f ./supabase/backups/snapshot_manual.sql
  ```

---

## 3. Restore Process (Database Recovery)

In the event of database corruption or data loss, follow these recovery procedures:

### A. Automated Point-in-Time Recovery (PITR) via Supabase Dashboard
1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to your project -> **Settings** -> **Database**.
3. Under the **Backups** section, locate the daily backup history.
4. Select the desired restore point (or a specific time-stamp if PITR is enabled).
5. Click **Restore Backup**. 
6. Wait for the database instance to restart (typically 10 to 15 minutes depending on size).

### B. Manual SQL Restore (For Local Development or Clean DB Restores)
If restoring a manual SQL dump:
1. Connect to the Postgres database using `psql` or pgAdmin.
2. Clear the existing public schema (Warning: deletes current database content):
   ```sql
   drop schema public cascade;
   create schema public;
   ```
3. Run the restore dump:
   ```bash
   psql -h db.your-supabase-project.supabase.co -U postgres -d postgres -f ./supabase/backups/snapshot_manual.sql
   ```

---

## 4. Rollback Plan (Vercel Frontend)

If a new frontend deployment introduces critical bugs or breaks compatibility:

1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Select the **Ausaguide** project.
3. Click on the **Deployments** tab.
4. Locate the last known working deployment (usually marked as "Production" prior to the current release).
5. Click the three dots (`...`) button next to the stable deployment.
6. Select **Promote to Production** (or simply **Promote**).
7. Confirm the rollback. Vercel will instantly point the production domain to the chosen build without rebuilding, achieving near-zero downtime recovery (approx. 5 seconds).

---

## 5. Incident Response (Data Corruption or Outages)

In the event that data is corrupted or lost:
1. **Assess and Contain**: Determine the scope of the corruption or outage. If necessary, place the application in a temporary "Maintenance Mode" by turning off active endpoints or displaying a friendly maintenance placeholder page.
2. **Contact Support**: Contact Supabase Support immediately for assistance on managed infrastructure outages.
3. **Execute Restore**: Locate the most recent daily automatic backup or manual SQL snapshot (respecting the 24-hour RPO target) and execute the restore process.
4. **Notify Affected Users**: If personal data was affected, notify users in compliance with regulatory requirements (GDPR/CCPA/local data protection acts), informing them of the incident, steps taken to resolve it, and status of their accounts.

---

## 6. Emergency Contacts

If the site goes down, contact the founder immediately:

- **Founder**: Lead Developer & Founder
- **Email**: founder@ausaguide.com
- **Phone**: +254 700 000 000
- **Incident Channel**: Discord / Slack #ops-alerts
