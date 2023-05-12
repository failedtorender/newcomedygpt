#!/bin/bash

while true; do
    output=$(heroku logs --tail --app comedygpt)
    date=$(date +"%Y-%m-%d_%H-%M-%S")
    echo "$output" >> "$date.log"
    sleep 3600
done
