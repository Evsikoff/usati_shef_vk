import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputDirectory = path.join(projectDirectory, "dist");
const outputAssetsDirectory = path.join(outputDirectory, "assets");

if (
  path.dirname(outputDirectory) !== projectDirectory ||
  path.basename(outputDirectory) !== "dist"
) {
  throw new Error(`Refusing to clean unexpected output directory: ${outputDirectory}`);
}

const hash = (value) =>
  createHash("sha256").update(value).digest("hex").slice(0, 12);

const normalizeResourcePath = (file) => file.replaceAll("\\", "/");

const resolveProjectFile = (relativeFile) => {
  const normalizedFile = normalizeResourcePath(relativeFile);
  if (
    path.posix.isAbsolute(normalizedFile) ||
    /^(?:data|blob|https?):/i.test(normalizedFile)
  ) {
    throw new Error(`Only local relative resources can be versioned: ${relativeFile}`);
  }

  const resolvedFile = path.resolve(projectDirectory, normalizedFile);
  const relativeToProject = path.relative(projectDirectory, resolvedFile);
  if (
    relativeToProject.startsWith("..") ||
    path.isAbsolute(relativeToProject)
  ) {
    throw new Error(`Resource escapes the project directory: ${relativeFile}`);
  }
  return resolvedFile;
};

const hashedAssetPath = (sourceFile, contentHash) => {
  const parsed = path.posix.parse(normalizeResourcePath(sourceFile));
  const safeStem =
    parsed.name
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "asset";
  return `assets/${safeStem}.${contentHash}${parsed.ext.toLowerCase()}`;
};

const stripSourceMapDirectives = (source) =>
  source
    .replace(/^\s*\/\/[#@]\s*sourceMappingURL=.*(?:\r?\n|$)/gm, "")
    .replace(/\/\*[#@]\s*sourceMappingURL=.*?\*\//gs, "");

const createBundle = async (scriptFiles, replacements = new Map()) => {
  const sections = [];
  for (const scriptFile of scriptFiles) {
    const source = replacements.has(scriptFile)
      ? replacements.get(scriptFile)
      : await readFile(resolveProjectFile(scriptFile), "utf8");
    sections.push(
      `/* Source: ${scriptFile} */\n${stripSourceMapDirectives(source).trim()}\n;`,
    );
  }
  return `${sections.join("\n\n")}\n`;
};

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputAssetsDirectory, { recursive: true });

const sourceHtml = await readFile(
  path.join(projectDirectory, "index.html"),
  "utf8",
);
const sourceManifest = await readFile(
  path.join(projectDirectory, "manifest.webmanifest"),
  "utf8",
);

const scriptTagPattern = /<script\s+src="([^"]+)"[^>]*><\/script>/g;
const allScriptSources = [...sourceHtml.matchAll(scriptTagPattern)].map(
  (match) => match[1],
);
const localScriptSources = allScriptSources.filter(
  (source) => !/^(?:https?:)?\/\//i.test(source),
);
const firstGameScriptIndex = localScriptSources.indexOf("code0.js");

if (firstGameScriptIndex <= 0) {
  throw new Error("Could not find the runtime/game bundle boundary at code0.js.");
}
if (!localScriptSources.includes("data.js")) {
  throw new Error("Could not find data.js in index.html.");
}

const dataSource = await readFile(path.join(projectDirectory, "data.js"), "utf8");
const sandbox = { gdjs: {} };
vm.createContext(sandbox);
new vm.Script(dataSource, { filename: "data.js" }).runInContext(sandbox, {
  timeout: 10_000,
});

const projectData = sandbox.gdjs.projectData;
if (!projectData?.resources?.resources) {
  throw new Error("data.js did not expose gdjs.projectData resources.");
}

const resourceMappings = {};
const copiedAssetPaths = new Set();

for (const resource of projectData.resources.resources) {
  if (!resource.file) continue;

  const sourceRelativePath = normalizeResourcePath(resource.file);
  const sourcePath = resolveProjectFile(sourceRelativePath);
  const sourceBytes = await readFile(sourcePath);
  const versionedPath = hashedAssetPath(sourceRelativePath, hash(sourceBytes));
  const destinationPath = path.join(
    outputDirectory,
    ...versionedPath.split("/"),
  );

  if (!copiedAssetPaths.has(versionedPath)) {
    await mkdir(path.dirname(destinationPath), { recursive: true });
    await copyFile(sourcePath, destinationPath);
    copiedAssetPaths.add(versionedPath);
  }

  resourceMappings[sourceRelativePath] = versionedPath;
  resource.file = versionedPath;
}

const serializedProjectData = JSON.stringify(projectData)
  .replaceAll("\u2028", "\\u2028")
  .replaceAll("\u2029", "\\u2029");
const rewrittenDataSource = `gdjs.projectData = ${serializedProjectData};\n`;

const runtimeScripts = localScriptSources.slice(0, firstGameScriptIndex);
const gameScripts = localScriptSources.slice(firstGameScriptIndex);
const replacements = new Map([["data.js", rewrittenDataSource]]);
const runtimeBundle = await createBundle(runtimeScripts, replacements);
const gameBundle = await createBundle(gameScripts, replacements);
const runtimeBundlePath = `assets/runtime.${hash(runtimeBundle)}.js`;
const gameBundlePath = `assets/game.${hash(gameBundle)}.js`;

await writeFile(
  path.join(outputDirectory, ...runtimeBundlePath.split("/")),
  runtimeBundle,
);
await writeFile(
  path.join(outputDirectory, ...gameBundlePath.split("/")),
  gameBundle,
);

let bundlesInserted = false;
let outputHtml = sourceHtml.replace(
  /([ \t]*)<script\s+src="([^"]+)"[^>]*><\/script>\r?\n?/g,
  (fullMatch, indentation, scriptSource) => {
    if (/^(?:https?:)?\/\//i.test(scriptSource)) return fullMatch;
    if (bundlesInserted) return "";

    bundlesInserted = true;
    return [
      `${indentation}<!-- Content-hashed production bundles. -->`,
      `${indentation}<script src="${runtimeBundlePath}" crossorigin="anonymous"></script>`,
      `${indentation}<script src="${gameBundlePath}" crossorigin="anonymous"></script>`,
      "",
    ].join("\n");
  },
);

if (!bundlesInserted) {
  throw new Error("No local script tags were replaced in index.html.");
}

if (!/rel="icon"/i.test(outputHtml)) {
  outputHtml = outputHtml.replace(
    /(<link\s+rel="manifest"[^>]*>)/i,
    '$1\n    <link rel="icon" href="data:,">',
  );
}

await writeFile(path.join(outputDirectory, "index.html"), outputHtml);
await writeFile(
  path.join(outputDirectory, "manifest.webmanifest"),
  sourceManifest,
);

const buildManifest = {
  version: 1,
  bundles: {
    runtime: {
      file: runtimeBundlePath,
      sources: runtimeScripts,
    },
    game: {
      file: gameBundlePath,
      sources: gameScripts,
    },
  },
  resources: resourceMappings,
};

await writeFile(
  path.join(outputDirectory, "build-manifest.json"),
  `${JSON.stringify(buildManifest, null, 2)}\n`,
);

const outputStats = await Promise.all(
  [runtimeBundlePath, gameBundlePath].map(async (bundlePath) => ({
    file: bundlePath,
    bytes: (await stat(path.join(outputDirectory, ...bundlePath.split("/")))).size,
  })),
);

console.log(
  JSON.stringify(
    {
      sourceScripts: localScriptSources.length,
      outputBundles: outputStats,
      versionedResources: Object.keys(resourceMappings).length,
      uniqueAssetFiles: copiedAssetPaths.size,
      outputDirectory,
    },
    null,
    2,
  ),
);
