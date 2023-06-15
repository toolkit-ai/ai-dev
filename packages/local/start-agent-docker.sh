#!/bin/bash

# A name for the Docker container
CONTAINER_NAME=myapp

# Build the Docker image
# HACK! This is a workaround for using local packages in development.
# I'll update this shortly to have separate development and production Dockerfiles.
cd ..; docker build -t ${CONTAINER_NAME} -f local/Dockerfile .

# Function to stop Docker container
function stop_docker {
    echo "Stopping Docker container..."
    docker stop ${CONTAINER_NAME}
    exit
}

# Start Docker container
docker run --name ${CONTAINER_NAME} --rm -p 8080:8080 ${CONTAINER_NAME} &

# Call stop_docker function when this script receives SIGINT
trap stop_docker SIGINT

# Wait indefinitely until this script receives SIGINT
while true; do :; done
