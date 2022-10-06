import createReader from './dist/esm/index.js';

const q = createReader('/workspaces/buffered-file-reader/testfile.txt');

while (true) {
  const r = await q.next();
  console.log(r);

  if (r.done) break;
  if (r == null) break;
}

q.return();
