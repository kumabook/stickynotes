/**
 *  @fileoverview overlay.js 
 *
 * @author Hiroki Kumamoto
 * @version 1.0.0
 */
/**
  * Create sticky element and database.
  */
stickynotes.createSticky = function() {
  var doc = window.content.document;
  var title = doc.title;
  if (title == '')
    title = 'タイトルなし';
  var sticky = stickynotes.Sticky.create({
    left: stickynotes.x, top: stickynotes.y,
    width: 150, height: 100,
    url: doc.location.href,
    title: title,
    content: 'ここにメモを挿入.', color: 'yellow',
    tags: ''
  });
  var stickyView = stickynotes.createStickyView(sticky);
  doc.body.appendChild(stickyView.dom);
  stickynotes.Sidebar.addSticky(sticky);
  return sticky;
};
/**
 * Create Sticky element.
 * @param{stickyntoes.Sticky}
 */
stickynotes.createStickyView = function(sticky) {
  var stickyView = new stickynotes.StickyView({
    sticky: sticky,
    onClickDeleteButton: function(e) {
      this.deleteDom();
      this.sticky.remove();
      stickynotes.Sidebar.deleteSticky(sticky);
    },
    onTextareaChange: function(e) {
      this.sticky.content = this.textarea.value;
      this.sticky.save();
      stickynotes.Sidebar.updateSticky(sticky);
    },
    onTagTextareaChange: function(e) {
      stickynotes.Sidebar.deleteSticky(sticky);
      var tags_str = (this.tagBox.value + ',').replace(/^[\s　]+|[\s　]+$/g, '');
      var tags = [];
      var _tags = (tags_str).split(',');
      _tags = _tags.slice(0, _tags.length - 1);
      for (var i = 0; i < _tags.length; i++) {
        _tags[i] = _tags[i].replace(/^[\s　]+|[\s　]+$/g, '');
        if (!_tags[i] == '') {//remove blank str
          var isUnique = true;
          for (var j = 0; j < tags.length; j++) {//remove duplicated str
            if (tags[j] == _tags[i]) {
              isUnique = false;
            }
          }
          if (isUnique)
            tags.push(_tags[i]);
        }
      }
      this.sticky.setTags(tags);
      this.tagBox.value = tags.join(',');
      stickynotes.Sidebar.addSticky(sticky);
    },
    onMoveEnd: function(e) {
      this.sticky.left = parseInt(this.dom.style.left);
      this.sticky.top = parseInt(this.dom.style.top);
      this.sticky.save();
      stickynotes.Sidebar.updateSticky(sticky);
    },
    onResizeEnd: function(e) {
      this.sticky.width = parseInt(this.textarea.style.width);
      this.sticky.height = parseInt(this.textarea.style.height) + 7;
      this.sticky.save();
      stickynotes.Sidebar.updateSticky(sticky);
    }
  });
  return stickyView;
};
/**
 * Delete Sticky.
 * @param{stickynotes.StickyView}
 */
stickynotes.deleteSticky = function(stickyView) {
  //delete from database
  stickyView.sticky.remove();
  //delete from sidebar
  stickynotes.Sidebar.deleteSticky(stickyView.stikcy);
  //delete from content document
  stickyView.deleteDom();
};
/**
 * document onload function.
 */
stickynotes.onload = function() {
  window.content.addEventListener('unload', function() {
    stickynotes.loaded = 0;
  },false);
  var current_page = window.content.document.location.href;
  if (stickynotes.loaded != current_page) stickynotes.loaded = current_page;
  else return;
  var doc = window.content.document;
  var page = stickynotes.Page.fetchByUrl(doc.location.href);
  var stickies = stickynotes.Sticky.fetchByPage(page);
  for (var i = 0; i < stickies.length; i++) {
    var stickyView = new stickynotes.createStickyView(stickies[i]);
    doc.body.appendChild(stickyView.dom);
  }
  /*
   * save click position.
   */
  doc.addEventListener(
    'click',
    function(event) {
      stickynotes.x = event.clientX + window.content.pageXOffset;
      stickynotes.y = event.clientY + window.content.pageYOffset;
    },
    false);
};
/**
 * initialize function.
 */
stickynotes.init = function() {
  window.addEventListener('DOMContentLoaded',
                          stickynotes.onload, false);
  stickynotes.DAO.createTables();
};

window.addEventListener('load', stickynotes.init, false);
Application.console.log('sticky extension loaded');
