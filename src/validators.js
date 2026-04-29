const ALLOWED_ITEM_TYPES = new Set(['agents', 'skills', 'commands']);

function isSafeName(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length < 256 &&
    !value.includes('/') &&
    !value.includes('\\') &&
    !value.includes('\0') &&
    value !== '..' &&
    value !== '.'
  );
}

function isSafeArray(arr) {
  return Array.isArray(arr) && arr.every(isSafeName);
}

function isAllowedExternalUrl(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch { return false; }
}

module.exports = { ALLOWED_ITEM_TYPES, isSafeName, isSafeArray, isAllowedExternalUrl };
