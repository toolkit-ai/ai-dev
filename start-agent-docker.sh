#!/bin/bash

# A name for the Docker container
CONTAINER_NAME=myapp

# Read the API key from the .env file
OPENAI_API_KEY=$(grep OPENAI_API_KEY .env | cut -d '=' -f2)

# Build the Docker image
docker build -t ${CONTAINER_NAME} .

# Function to stop Docker container
function stop_docker {
    echo "Stopping Docker container..."
    docker stop ${CONTAINER_NAME}
    exit
}

# Start Docker container
docker run --name ${CONTAINER_NAME} --rm -p 8080:8080 -e OPENAI_API_KEY=${OPENAI_API_KEY} ${CONTAINER_NAME} &

# Call stop_docker function when this script receives SIGINT
trap stop_docker SIGINT

# Wait indefinitely until this script receives SIGINT
while true; do :; done
