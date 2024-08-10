#!/bin/bash

for video in videos/*.mp4; do
	filename=$(basename "$video" .mp4)
	ffmpeg -i "$video" \
		-vf "subtitles=videos/${filename}.srt:force_style='FontName=Times New Roman,PrimaryColour=&H0000FFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=1',fps=2" \
		-vsync vfr -q:v 2 "export/${filename}_frame_%04d.jpg"
done
