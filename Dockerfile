FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --production

# Copy all source files
COPY . .

# Create required directories
RUN mkdir -p content/briefs content/drafts content/review content/approved content/published \
    output/html output/thumbnails output/reports \
    calendar data

# Start the cron scheduler
CMD ["node", "scripts/cron.mjs"]
