#!/bin/bash
cd /home/kavia/workspace/code-generation/simple-notes-application-302478-302488/simple_notes_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

