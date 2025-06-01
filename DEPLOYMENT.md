# Netlify Deployment Guide

This UPI Payment Platform is now configured for easy deployment on Netlify with MongoDB.

## Prerequisites

1. **MongoDB Database**: You need a MongoDB connection string (already configured)
2. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)

## Deployment Steps

### 1. Connect to Netlify
- Push your code to GitHub, GitLab, or Bitbucket
- Connect your repository to Netlify

### 2. Build Settings
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 20

### 3. Environment Variables
Add these environment variables in your Netlify dashboard:
- `MONGODB_URI`: Your MongoDB connection string

### 4. Deploy
- Click "Deploy Site" in Netlify
- Your site will be available at a `.netlify.app` domain

## Features Included

✓ MongoDB database integration
✓ Serverless API functions
✓ Real-time WebSocket notifications  
✓ User authentication and role management
✓ UPI payment processing
✓ Transaction tracking and management
✓ Admin panel with approval workflow
✓ Responsive design for all devices

## Post-Deployment

- Test all functionality including payments
- Set up custom domain if needed
- Configure any additional security settings
- Monitor database performance

The application is production-ready and optimized for Netlify's serverless architecture.