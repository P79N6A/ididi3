// Hack for sameNameRequire bug.
var onProcessEnd;

onProcessEnd && fis.removeListener('process:end', onProcessEnd);
fis.on('process:end', (onProcessEnd = function(file) {
  if (file.isJsLike) {
    file.addSameNameRequire('.css');
  } else if (file.isHtmlLike) {
    // file.addSameNameRequire('.js');
    file.addSameNameRequire('.css');
  }
}));