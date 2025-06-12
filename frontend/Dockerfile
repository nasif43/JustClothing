FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Remove existing node_modules and package-lock.json
RUN rm -rf node_modules package-lock.json

# Install dependencies with the --platform flag
RUN npm install --platform=linux --arch=x64

# Copy project files
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"] 