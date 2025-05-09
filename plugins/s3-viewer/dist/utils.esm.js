import { S3_VIEWER_BUCKET } from './constant.esm.js';

function humanFileSize(bytes, si = true, dp = 1) {
  if (!bytes) {
    return "0 B";
  }
  const thresh = si ? 1e3 : 1024;
  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }
  const units = si ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"] : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;
  let newBytes = bytes;
  do {
    newBytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(newBytes) * r) / r >= thresh && u < units.length - 1);
  return `${newBytes.toFixed(dp)} ${units[u]}`;
}
function getPathFromUrlDir(dir) {
  if (!dir || dir.endsWith("/")) {
    return "";
  }
  return dir;
}
function getFolderFromUrlDir(dir) {
  if (!dir || dir === "/") {
    return "";
  }
  if (dir.endsWith("/")) {
    return dir;
  }
  const folder = dir.split("/").slice(0, -1).join("/");
  return folder ? `${folder}/` : folder;
}
const isS3ViewerBucketAvailable = (entity) => Boolean(entity.metadata.annotations?.[S3_VIEWER_BUCKET]);
function extractBucketAndPath(input) {
  const [bucket, path = ""] = input.split(":");
  return { bucket, path };
}

export { extractBucketAndPath, getFolderFromUrlDir, getPathFromUrlDir, humanFileSize, isS3ViewerBucketAvailable };
//# sourceMappingURL=utils.esm.js.map
