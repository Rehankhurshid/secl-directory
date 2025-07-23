#!/bin/bash

# List of environment variables to remove
vars=(
    "VAPID_PRIVATE_KEY"
    "VAPID_EMAIL"
    "NEXT_PUBLIC_APP_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
    "JWT_SECRET"
    "ENCRYPTION_KEY"
    "NEXT_PUBLIC_APP_NAME"
    "NEXT_PUBLIC_APP_VERSION"
    "NEXT_PUBLIC_MAX_FILE_SIZE"
    "NEXT_PUBLIC_ENABLE_MESSAGING"
    "NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH"
    "NEXT_PUBLIC_ENABLE_EXPORT"
    "NODE_ENV"
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY"
    "DATABASE_URL"
    "DIRECT_URL"
)

environments=("development" "preview" "production")

# Remove each variable from each environment
for var in "${vars[@]}"; do
    echo "Removing $var..."
    for env in "${environments[@]}"; do
        echo "  From $env..."
        vercel env rm "$var" "$env" --yes 2>/dev/null || echo "    (not found in $env)"
    done
done

echo "Done removing environment variables!"