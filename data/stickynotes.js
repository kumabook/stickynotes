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
    onClickMinimizeButton: function(e) {
      stickyView.minimize();
    },
    onClickEditTagButton: function(e) {
      stickyView.toggleTagDialog();
    },
    onClickMenuButton: function(e) {
      stickyView.toggleMenuDialog();
    },
    onTextareaChange: function(e) {
      sticky.content = this.textarea.value;
      stickynotes.saveSticky(sticky, {
        content: this.textarea.value
      });
    },
    onTagsChange: function(tags) {
      stickynotes.setTags(sticky, tags);
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
      if (stickyView.status !== 'minimized') {
        sticky.width = parseInt(stickyView.dom.style.width);
        sticky.height = parseInt(stickyView.dom.style.height) + 7;
        stickynotes.saveSticky(sticky, {
          width: sticky.width,
          height: sticky.height
        });
      }
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
stickynotes.setTags = function(sticky, names) {
  self.port.emit('set_tags', sticky, names);
  sticky.tags = names.map((tag) => { return { id: null, name: tag}; });
};
