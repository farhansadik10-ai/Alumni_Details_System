#!/bin/bash

set -e

cd "$(dirname "$0")/.."

echo "Starting Alumni Details System..."
echo

echo "Starting backend..."
npm run dev:api &

echo "Starting Apache..."
/c/xampp/apache/bin/httpd.exe &

echo
echo "================================="
echo "Application started!"
echo "Website: https://localhost"
echo "Backend: http://localhost:3000"
echo "================================="

