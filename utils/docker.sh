#!/bin/bash

echo "Updating package index..."
sudo apt update

# Logging: Install dependencies
echo "Installing dependencies..."
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Logging: Add Docker's official GPG key
echo "Adding Docker's official GPG key..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Logging: Add Docker repository
echo "Adding Docker repository..."
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Logging: Update package index again
echo "Updating package index again..."
sudo apt update

# Logging: Install Docker
echo "Installing Docker..."
sudo apt install -y docker-ce

# Logging: Add current user to the docker group to run Docker commands without sudo
echo "Adding current user to the docker group..."
sudo usermod -aG docker $USER

# Logging: Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Logging: Apply executable permissions to Docker Compose
echo "Applying executable permissions to Docker Compose..."
sudo chmod +x /usr/local/bin/docker-compose

# Logging: Verify Docker and Docker Compose installation
echo "Verifying Docker installation..."
docker --version
echo "Verifying Docker Compose installation..."
docker-compose --version

echo "Installation complete."
