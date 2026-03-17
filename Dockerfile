# Use a lightweight Nginx image
FROM nginx:alpine

# Copy the static files to the Nginx html directory
COPY . /usr/share/nginx/html

# Default Cloud Run port is 8080. Nginx default is 80.
# We'll use a custom configuration or just tell Nginx to listen on 8080.
# A quick way is to replace the default config's port.
RUN sed -i 's/listen\(.*\)80;/listen 8080;/' /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
