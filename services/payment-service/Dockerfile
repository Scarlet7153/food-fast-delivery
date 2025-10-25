<<<<<<< Updated upstream
=======
# Payment Service Dockerfile
>>>>>>> Stashed changes
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
<<<<<<< Updated upstream
EXPOSE 3005
=======
EXPOSE 3000
>>>>>>> Stashed changes

# Start application
CMD ["npm", "start"]
