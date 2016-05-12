#!/bin/bash

while true; do
    node-red -v -s settings.js &
    PID=$!
    inotifywait -e modify,create,delete *;
    kill -SIGINT $PID
done
