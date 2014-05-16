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
        stickynotes.deleteSticky(this.sticky);
    },
    onTextareaChange: function(e) {
      this.sticky.content = this.textarea.value;
      stickynotes.saveSticky(this.sticky);
    },
    onTagTextareaChange: function(e) {
      var tagStrs = stickynotes.StickyView.str2Tags(this.tagBox.value);
      stickynotes.setTags(sticky, tagStrs);
      this.tagBox.value = tagStrs.join(',');
      sticky.tagStrs = tagStrs;
    },
    onMoveEnd: function(e) {
      this.sticky.left = parseInt(this.dom.style.left);
      this.sticky.top = parseInt(this.dom.style.top);
      stickynotes.saveSticky(this.sticky);
    },
    onResizeEnd: function(e) {
      this.sticky.width = parseInt(this.textarea.style.width);
      this.sticky.height = parseInt(this.textarea.style.height) + 7;
      stickynotes.saveSticky(this.sticky);
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
