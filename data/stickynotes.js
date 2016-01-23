var stickynotes = {
  x: 0, y: 0
};
/**
 * Create Sticky element.
 * @param {stickyntoes.Sticky}
 */
stickynotes.createStickyView = function(sticky) {
  var stickyView = new stickynotes.StickyView({
    sticky: sticky,
    onClickDeleteButton: function(e) {
        stickynotes.deleteSticky(sticky);
    },
    onTextareaChange: function(e) {
      sticky.content = this.textarea.value;
      stickynotes.saveSticky(sticky, {
        content: this.textarea.value
      });
    },
    onTagTextareaChange: function(e) {
      var tagStrs = stickynotes.StickyView.str2Tags(stickyView.tagBox.value);
      stickynotes.setTags(sticky, tagStrs);
      stickyView.tagBox.value = tagStrs.join(',');
    },
    onMoveEnd: function(e) {
      sticky.left = parseInt(stickyView.dom.style.left);
      sticky.top = parseInt(stickyView.dom.style.top);
      stickynotes.saveSticky(sticky, {
        left: sticky.left,
        top: sticky.top
      });
    },
    onResizeEnd: function(e) {
      sticky.width = parseInt(stickyView.textarea.style.width);
      sticky.height = parseInt(stickyView.textarea.style.height) + 7;
      stickynotes.saveSticky(sticky, {
        width: sticky.width,
        height: sticky.height
      });
    }
  });
  return stickyView;
};
stickynotes.deleteSticky = function(sticky) {
  self.port.emit('delete', sticky);
};
stickynotes.saveSticky = function(sticky) {
  self.port.emit('save', sticky);
};
stickynotes.setTags = function(sticky, tagStrs) {
  self.port.emit('set_tags', sticky, tagStrs);
};
