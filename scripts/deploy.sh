#!/bin/bash

set -e

cd "$(dirname "$0")/.."

echo "Deploying Alumni Details System..."
echo

echo "1. Building frontend..."
./scripts/build.sh

echo
echo "2. Checking Apache configuration..."
/c/xampp/apache/bin/httpd.exe -t

echo
echo "3. Starting application..."
./scripts/start.sh

echo
echo "================================="
echo "Deployment completed!"
echo "Website: https://localhost"
echo "================================="