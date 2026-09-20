#!/bin/bash

set -e

echo "Starting Alumni Details System..."

./scripts/build.sh

echo "Starting backend..."
npm run dev:api &

echo "Starting Apache..."
/c/xampp/apache/bin/httpd.exe &

echo
echo "All services started!"
echo "Website: https://localhost"

wait
