EchoZa Songs Guide

Where to add files
- Add mp3 songs in this folder:
  songs/
- Add cover images in:
  songs/covers/
- Add custom artist/category info in:
  songs/song-metadata.json

How to add a new song
1. Copy your mp3 file into songs/
2. Rename it in lowercase with dashes
   Example:
   Tum Hi Ho.mp3 -> tum-hi-ho.mp3

How to add a cover image
1. Copy the image into songs/covers/
2. Use the exact same filename as the mp3
   Example:
   songs/tum-hi-ho.mp3
   songs/covers/tum-hi-ho.jpg

Supported cover formats
- .jpg
- .jpeg
- .png
- .webp

How to add artist and category info
1. Open songs/song-metadata.json
2. Add a new entry using the mp3 filename without .mp3
   Example:
   "senorita": {
     "artist": "Shawn Mendes, Camila Cabello",
     "album": "Global Hits",
     "mood": "Pop",
     "language": "English",
     "section": "Top picks"
   }

Final step after adding songs/covers/details
Run this command from the project folder:

powershell -ExecutionPolicy Bypass -File .\generate-library.ps1

Then refresh the website.
