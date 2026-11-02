import { copyFile, readdir } from 'node:fs/promises';
for (const name of ['inter','plus-jakarta-sans','jetbrains-mono']) {
 const path = `node_modules/@fontsource-variable/${name}/files`;
 for (const file of await readdir(path)) if (file.includes('latin-wght-normal')) await copyFile(`${path}/${file}`,`public/assets/fonts/${file}`);
 await copyFile(`node_modules/@fontsource-variable/${name}/LICENSE`, `public/assets/fonts/${name}-LICENSE.txt`);
}
