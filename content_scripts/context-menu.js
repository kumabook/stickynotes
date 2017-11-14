self.on('click', function () {
  self.postMessage({
    url: document.location.href,
    title: document.title
  });
});
