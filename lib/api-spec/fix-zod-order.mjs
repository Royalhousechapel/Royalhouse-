// Orval's split Zod output can emit numeric/pattern bounds after their first use.
// Keep this fix in the generation pipeline, never hand-edit generated validators.
import { readFile, writeFile } from "node:fs/promises";

const file = new URL("../api-zod/src/generated/api.ts", import.meta.url);
let source = await readFile(file, "utf8");
const bounds = [];
source = source.replace(/^export const \w+(?:Min|Max|Pattern|MultipleOf) = [^\n]+;\r?\n/gm, (declaration) => {
  bounds.push(declaration.trim());
  return "";
});
if (bounds.length) {
  source = source.replace(/(import[^\n]*from ["']zod["'];?\r?\n)/, `$1\n${bounds.join("\n")}\n`);
}
await writeFile(file, source.trimEnd() + "\n");
for (const name of ["api.ts", "api.schemas.ts"]) {
  const clientFile = new URL(`../api-client-react/src/generated/${name}`, import.meta.url);
  const clientSource = await readFile(clientFile, "utf8");
  await writeFile(clientFile, clientSource.trimEnd() + "\n");
}
