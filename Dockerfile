# Use the official Node.js image
FROM node:18

# Create and set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the application runs on
EXPOSE 8080

# Run the application
CMD ["npm", "start"]
