// Convert original FLAC mixes to Ogg Vorbis for the web

import path from 'node:path';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

import mixes from '../mixes.json' with { type: 'json' };

const wd = process.argv[2];
if (!wd || !existsSync(wd)) {
  console.error('Usage: node convert-to-oga.mjs <working-directory>');
  process.exit(1);
}

mixes.forEach(mix => {
  const { date, slug, title } = mix;
  const baseFile = path.join(wd, `deephouse-uk-${date}-${slug}`);
  console.log(`Processing: ${slug}`);
  const inputFile = `${baseFile}.flac`;
  const outputFile = `${baseFile}.oga`;
  if (existsSync(inputFile)) {
    if (!existsSync(outputFile)) {
      console.log(`Converting: ${inputFile} -> ${outputFile}`);
      execSync(`ffmpeg -hide_banner -loglevel error \
                -i "${inputFile}" \
                -codec:a libvorbis -q:a 4 \
                -map_metadata -1 \
                -metadata:s TITLE="${title}" \
                -metadata:s ALBUM="deephouse.uk" \
                -metadata:s PERFORMER="Lovell Fuller" \
                -metadata:s GENRE="Deep House" \
                -metadata:s DATE="${date}" \
                -metadata:s LOCATION="London, UK" \
                "${outputFile}"`, { stdio: 'inherit' });
    } else {
      console.log(`Found existing: ${outputFile}`);
    }
  } else {
    console.log(`Skipping: ${inputFile} not found`);
  }
});
