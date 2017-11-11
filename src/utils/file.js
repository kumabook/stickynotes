function getExtention(fileName) {
  if (!fileName) {
    return null;
  }
  const fileTypes = fileName.split('.');
  const len = fileTypes.length;
  if (len === 0) {
    return null;
  }
  return fileTypes[len - 1];
}

function isJSON(file) {
  return file.type === 'application/json' || getExtention(file.name) === 'json';
}

module.exports = {
  getExtention,
  isJSON,
};
