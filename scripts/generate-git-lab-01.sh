#!/bin/bash

LAB_DIR="git-labs/01-redis-bug"

echo "🧪 Generating Git Workflow Lab in $LAB_DIR..."

# Clean up old lab if it exists and make a new directory
rm -rf ../$LAB_DIR
mkdir -p ../$LAB_DIR
cd ../$LAB_DIR

# Initialize a fresh Git repository
git init -b main > /dev/null 2>&1

# Commit 1 (Good)
cat <<EOF > application.properties
spring.data.redis.port=6379
spring.datasource.url=jdbc:postgresql://localhost:5433/backendlab
EOF
git add application.properties
git commit -m "feat: Initial connection properties" > /dev/null 2>&1

# Commit 2 (Good)
echo "management.endpoints.web.exposure.include=health,prometheus" >> application.properties
git commit -am "feat: Expose health endpoints" > /dev/null 2>&1

# Commit 3 (Good)
echo "spring.jpa.show-sql=true" >> application.properties
git commit -am "chore: Enable SQL logging for dev" > /dev/null 2>&1

# Commit 4 (BAD - Intentionally breaks the Redis port)
cat <<EOF > application.properties
spring.data.redis.port=6380
spring.datasource.url=jdbc:postgresql://localhost:5433/backendlab
management.endpoints.web.exposure.include=health,prometheus
spring.jpa.show-sql=true
EOF
git commit -am "refactor: Update caching connection pool settings" > /dev/null 2>&1

# Commit 5 (Good)
echo "server.port=8080" >> application.properties
git commit -am "chore: Pin web server port" > /dev/null 2>&1

# Commit 6 (Good)
echo "spring.application.name=Git Lab Microservice" >> application.properties
git commit -am "feat: Set application name" > /dev/null 2>&1

echo "✅ Lab generated successfully!"
echo "--------------------------------------------------------"
echo "🔥 THE INCIDENT:"
echo "The CI/CD pipeline just failed! The application cannot connect to Redis on port 6379."
echo "It was working fine a few commits ago, but someone broke it."
echo ""
echo "🛠️ YOUR MISSION:"
echo "1. cd git-labs/01-redis-bug"
echo "2. Use 'git log' and 'git bisect' to find exactly WHICH commit changed the Redis port to 6380!"