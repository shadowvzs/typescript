#!/bin/bash
# just set few variable
HOST_BASE_DIR=$PWD
HOST_PROJECT_DIR="project"
DOCKER_PROJECT_DIR="/var/www/html"
DS="/"
HOST_FULL_PATH="$HOST_BASE_DIR$DS$HOST_PROJECT_DIR"
EXPOSED_PORTS="80:80"
NETWORK_NAME="mynetwork"
IMAGE_NAME="typescript:latest"
CONTAINER_ALIAS="typescript"
ENTRY_POINT="/bin/bash"


# give permission for project
sudo chmod -R 777 $HOST_FULL_PATH

# Show the command :)
sudo docker run -v $HOST_FULL_PATH:$DOCKER_PROJECT_DIR -it --rm -p $EXPOSED_PORTS -p 5000:5000 -p 5001:5001 -p 3333:3333 --network $NETWORK_NAME --privileged --name $CONTAINER_ALIAS $IMAGE_NAME $ENTRY_POINT


