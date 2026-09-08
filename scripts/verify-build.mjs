import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputDirectory = path.join(projectDirectory, "dist");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const resolveOutputFile = (relativeFile) => {
  const resolvedFile = path.resolve(
    outputDirectory,
    ...relativeFile.replaceAll("\\", "/").split("/"),
  );
  const relativeToOutput = path.relative(outputDirectory, resolvedFile);
  assert(
    !relativeToOutput.startsWith("..") && !path.isAbsolute(relativeToOutput),
    `Build output path escapes dist: ${relativeFile}`,
  );
  return resolvedFile;
};

const html = await readFile(path.join(outputDirectory, "index.html"), "utf8");
const buildManifest = JSON.parse(
  await readFile(path.join(outputDirectory, "build-manifest.json"), "utf8"),
);
const scriptSources = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(
  (match) => match[1],
);
const localScriptSources = scriptSources.filter(
  (source) => !/^(?:https?:)?\/\//i.test(source),
);

assert(
  localScriptSources.length === 2,
  `Expected 2 local production bundles, found ${localScriptSources.length}.`,
);
assert(
  localScriptSources.every((source) => /^assets\/.+\.[a-f0-9]{12}\.js$/.test(source)),
  "Production bundle URLs must contain content hashes.",
);
assert(
  html.includes('<link rel="icon" href="data:,">'),
  "The generated page must suppress the missing favicon request.",
);
assert(
  !html.includes('<script src="code0.js"'),
  "The generated page still references unbundled game scripts.",
);

const filesToCheck = new Set([
  ...localScriptSources,
  ...Object.values(buildManifest.resources),
  "manifest.webmanifest",
]);

for (const relativeFile of filesToCheck) {
  await access(resolveOutputFile(relativeFile));
}

assert(
  Object.values(buildManifest.resources).every((resourcePath) =>
    /^assets\/.+\.[a-f0-9]{12}\.[^.]+$/.test(resourcePath),
  ),
  "Every generated resource URL must contain a content hash.",
);

console.log(
  JSON.stringify(
    {
      localBundles: localScriptSources.length,
      versionedResources: Object.keys(buildManifest.resources).length,
      verifiedFiles: filesToCheck.size,
    },
    null,
    2,
  ),
);
