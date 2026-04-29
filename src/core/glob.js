export function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => matchesGlob(filePath, pattern));
}

export function matchesGlob(filePath, pattern) {
  const normalizedFile = normalize(filePath);
  const normalizedPattern = normalize(pattern);

  if (normalizedPattern === normalizedFile) return true;

  const regex = new RegExp(`^${escapeGlob(normalizedPattern)}$`);
  return regex.test(normalizedFile);
}

function normalize(value) {
  return value.replace(/\\/g, "/").replace(/^\.\//, "");
}

function escapeGlob(pattern) {
  let output = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    const next = pattern[index + 1];

    if (char === "*" && next === "*") {
      output += ".*";
      index += 1;
      continue;
    }

    if (char === "*") {
      output += "[^/]*";
      continue;
    }

    output += char.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
  }
  return output;
}
