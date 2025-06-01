#!/bin/bash
# Netlify build script

echo "Building React frontend..."
npm run build

echo "Creating netlify functions directory in dist..."
mkdir -p dist/_netlify/functions

echo "Building serverless function..."
cp -r netlify/functions/* dist/_netlify/functions/

echo "Build complete!"