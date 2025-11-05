#!/bin/bash
# Cleanup script - removes the incorrectly named manifest file
if [ -f ". manifest.json" ]; then
  rm ". manifest.json"
  echo "Removed '. manifest.json'"
else
  echo "File '. manifest.json' not found"
fi
echo "Extension is ready!"
