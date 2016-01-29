/**
 * My namespace's Sidebar
 * @const
 * @type {Object}
 */
stickynotes.Sidebar = {
  close: function() {
    window.close();
  },
  updateContextMenuVisibility: function() {
    if (document.getElementById('sticky_tree').childNodes.length === 0) {
      document.getElementById('context-menu').hidden = true;
    } else {
      document.getElementById('context-menu').hidden = false;
    }
  },
  isVisible: function() {
      var sidebar = window.parent.document.getElementById('sidebar');
      return sidebar && sidebar.document;
  },
  getSidebarDoc: function() {
    return document;
  },
  getStickyElements: function(sticky) {
    var sidebarDoc = this.getSidebarDoc();
    var elem;
    var elements = [];
    var i = 0;
    while (true) {
      var _id = 'sticky_' + sticky.id + '_' + i;
      elem = sidebarDoc.getElementById(_id);
      i++;
      if (!elem) {
        break;
      }
      else
        elements.push(elem);
    }
    return elements;
  },
  isContain: function(tag) {
    var sidebarDoc = this.getSidebarDoc();
    var tree = sidebarDoc.getElementById('sticky_tree');
    for (var i = 0; i < tree.childNodes.length; i++) {
      if (tree.childNodes[i].id == 'treeitem_tag_' + tag)
        return true;
    }
    return false;
  },
  createSidebarStickyItem: function(sticky, parent) {
    var sidebarDoc = this.getSidebarDoc();
    if (!parent) {
      parent = sidebarDoc.getElementById('tree_page_' + sticky.page_id);
      if (!parent)
        parent = this.createSidebarPageItem(stickynotes.Page.fetchById(sticky.page_id));
    }
    var treeitem_sticky = document.createElement('treeitem');
    var t = treeitem_sticky;
    t.treerow_sticky  = document.createElement('treerow');
    t.treecell_text   = document.createElement('treecell');
    t.treecell_id     = document.createElement('treecell');
    t.treecell_type   = document.createElement('treecell');
    t.treecell_x      = document.createElement('treecell');
    t.treecell_y      = document.createElement('treecell');
    t.treecell_width  = document.createElement('treecell');
    t.treecell_height = document.createElement('treecell');
    t.treecell_url    = document.createElement('treecell');
    t.treecell_title  = document.createElement('treecell');
    t.treecell_color  = document.createElement('treecell');

    var elem, id;
    var i = 0;
    while (true) {
      var _id = 'sticky_' + sticky.id + '_' + i;
      i++;
      elem = sidebarDoc.getElementById(_id);
      if (!elem) {
        id = _id;
        break;
      }
    }
    treeitem_sticky.id   = id;
    t.treerow_sticky.id  = 'treerow_' + id;

    t.treecell_text.id   = 'treecell_text_' + id;
    t.treecell_id.id     = 'treecell_id_' + id;
    t.treecell_type.id   = 'treecell_type_' + id;
    t.treecell_x.id      = 'treecell_x_' + id;
    t.treecell_y.id      = 'treecell_y_' + id;
    t.treecell_width.id  = 'treecell_width_' + id;
    t.treecell_height.id = 'treecell_height_' + id;
    t.treecell_url.id    = 'treecell_url_' + id;
    t.treecell_title .id = 'treecell_title_' + id;
    t.treecell_color.id  = 'treecell_color_' + id;

    t.treecell_text.setAttribute('label', sticky.content);
    t.treecell_id.setAttribute('label', sticky.id);
    t.treecell_type.setAttribute('label', 'sticky');
    t.treecell_title.setAttribute('label', sticky.title);
    t.treecell_x.setAttribute('label', sticky.left);
    t.treecell_y.setAttribute('label', sticky.top);
    t.treecell_width.setAttribute('label', sticky.width);
    t.treecell_height.setAttribute('label', sticky.height);
    t.treecell_url.setAttribute('label', sticky.url ? sticky.url : '');
    t.treecell_color.setAttribute('label', sticky.color);

    t.treerow_sticky.appendChild(t.treecell_text);
    t.treerow_sticky.appendChild(t.treecell_id);
    t.treerow_sticky.appendChild(t.treecell_type);
    t.treerow_sticky.appendChild(t.treecell_x);
    t.treerow_sticky.appendChild(t.treecell_y);
    t.treerow_sticky.appendChild(t.treecell_url);
    t.treerow_sticky.appendChild(t.treecell_title);
    t.treerow_sticky.appendChild(t.treecell_width);
    t.treerow_sticky.appendChild(t.treecell_height);
    t.treerow_sticky.appendChild(t.treecell_color);
    treeitem_sticky.appendChild(t.treerow_sticky);
    parent.appendChild(treeitem_sticky);
    return treeitem_sticky;
  },
  createSidebarPageItem: function(page, parent, id) {
    var sidebarDoc = this.getSidebarDoc();
    if (parent == null)
      parent = sidebarDoc.getElementById('sticky_tree');
    var treeitem = sidebarDoc.createElement('treeitem');
    treeitem.setAttribute('id', id ? id : 'treeitem_page_' + page.id);
    treeitem.setAttribute('container', 'true');
    if (page.url == window.content.document.location.href) {
      treeitem.setAttribute('open', 'true');
    } else {
      treeitem.setAttribute('open', 'false');
    }
    var treerow       = document.createElement('treerow');
    var treecell_text = document.createElement('treecell');
    var treecell_id   = document.createElement('treecell');
    var treecell_type = document.createElement('treecell');
    treecell_text.setAttribute('label', page.title);
    treecell_id.setAttribute('label', page.id);
    treecell_type.setAttribute('label', 'page');
    treerow.appendChild(treecell_text);
    treerow.appendChild(treecell_id);
    treerow.appendChild(treecell_type);
    var treechildren = document.createElement('treechildren');
    treechildren.setAttribute('id', 'tree_page_' + page.id);
    treeitem.appendChild(treerow);
    treeitem.appendChild(treechildren);
    parent.appendChild(treeitem);
    treeitem.treechildren = treechildren;
    return treeitem;
  },
  createSidebarTagItem: function(tag, parent) {
    var sidebarDoc = this.getSidebarDoc();
    if (parent == null)
      parent = sidebarDoc.getElementById('sticky_tree');
    var treeitem = sidebarDoc.createElement('treeitem');
    treeitem.setAttribute('id', 'treeitem_tag_' + tag.name);
    treeitem.setAttribute('container', 'true');
    var treerow       = document.createElement('treerow');
    var treecell_text = document.createElement('treecell');
    var treecell_id   = document.createElement('treecell');
    var treecell_type = document.createElement('treecell');
    treecell_text.setAttribute('label', tag.name);
    treecell_id.setAttribute('label', tag.id);
    treecell_type.setAttribute('label', 'tag');
    treerow.appendChild(treecell_text);
    treerow.appendChild(treecell_id);
    treerow.appendChild(treecell_type);
    var treechildren = document.createElement('treechildren');
    treechildren.setAttribute('id', 'tree_tag_' + tag.id);
    treeitem.appendChild(treerow);
    treeitem.appendChild(treechildren);
    parent.appendChild(treeitem);
    treeitem.treechildren = treechildren;
    return treeitem;
  },
  getSelectedItemId: function() {
    var sidebarDoc = this.getSidebarDoc();
    var tree = sidebarDoc.getElementById('sticky');
    return tree.view.getCellText(tree.currentIndex,
                                 tree.columns.getNamedColumn('id'));
  },
  getSelectedItemType: function() {
    var sidebarDoc = this.getSidebarDoc();
    var tree = sidebarDoc.getElementById('sticky');
    return tree.view.getCellText(tree.currentIndex,
                               tree.columns.getNamedColumn('type'));
  },
  exportStickies: function() {
    if (!addon) {
      this.close();
      return;
    }
    var id   = this.getSelectedItemId();
    var type = this.getSelectedItemType();
    var stickies = [];
    switch (type)  {
      case 'page':
        stickies = stickynotes.Sticky.fetchByPage({ id: id});
        break;
      case 'tag':
        stickies = stickynotes.Sticky.fetchByTag( { id: id});
        break;
      case 'sticky':
        stickies = [stickynotes.Sticky.fetchById(id)];
        break;
      default:
        break;
    }
    addon.port.emit('export', stickies, type + '_' + id);
  },
  remove: function() {
    if (!addon) {
      this.close();
      return;
    }
    var sticky = stickynotes.Sticky.fetchById(this.getSelectedItemId());
    if (sticky == null) {
      return;
    }
    addon.port.emit('delete', sticky);
  },
  jump: function() {
    if (!addon) {
      this.close();
      return;
    }
    var sticky = stickynotes.Sticky.fetchById(this.getSelectedItemId());
    if (sticky == null) {
      return;
    }
    var page = sticky.getPage();
    addon.port.emit('jump', sticky, page.url);
    document.getElementById('sticky').blur();
    if (window.content.document.location.href != page.url) {
      let Cc = stickynotes.Cc;
      let Ci = stickynotes.Ci;
      Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer).initWithCallback(
        function() { window.content.document.location.href = page.url;  },
        200,
        Ci.nsITimer.TYPE_ONE_SHOT);
    }
  },
  focusSidebar: function() {
    var sidebarDoc = this.getSidebarDoc();
    var tree = sidebarDoc.getElementById('sticky');
    tree.focus();
  },
  focusSearchBox: function() {
    var sidebarDoc = this.getSidebarDoc();
    var searchBox = sidebarDoc.getElementById('search-sticky-box');
    searchBox.focus();
  },
  openDisplayOptionMenu: function() {
    var sidebarDoc = this.getSidebarDoc();
    var displayOptionButton = sidebarDoc.getElementById('display-option-button');
    displayOptionButton.open = true;
    displayOptionButton.focus();
  },
  toggleVisibilityAllStickies: function() {
    var doc = window.content.document;
    var URL = doc.location.href;
    var page = DOA.getPageByUrl(URL);
    var stickies = DOA.getStickiesByPageId(page.id);
    for (var i = 0; i < stickies.length; i++) {
      var stickyDom = doc.getElementById('sticky' + stickies[i].id);
      if (sticky.style.visibility == 'hidden')
        stickyDom.style.visibility = 'visible';
      else
        stickyDom.style.visibility = 'hidden';
    }
  },
  resizeSidebarHeight: function() {
    var Ci = stickynotes.Ci;
    var mainWindow = window.
      QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIWebNavigation)
      .QueryInterface(Ci.nsIDocShellTreeItem)
      .rootTreeItem
      .QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIDOMWindow);
    var doc = this.getSidebarDoc();
    doc.getElementById('sticky').height = window.innerHeight;
  },
  createSidebarTree: function() {
    var old_tree = document.getElementById('sticky_tree');
    var new_tree = document.createElement('treechildren');
    if (old_tree == null) {
       return;
    }
    new_tree.setAttribute('id', 'sticky_tree');
    document.getElementById('sticky').replaceChild(new_tree, old_tree);
  },
  getSelectedSort: function() {
    var selectedsort;
    var doc = this.getSidebarDoc();
    selectedsort =
      doc.getElementById('display-option-button').getAttribute('selectedsort');
    if (!selectedsort)
      selectedsort = 'tag+site';
    return selectedsort;
  },
  addSticky: function(sticky) {
    var sidebarDoc = this.getSidebarDoc();
    var selectedsort = this.getSelectedSort();
    sidebarDoc.getElementById('by' + selectedsort)
      .setAttribute('checked', true);
    var parent;
    switch (selectedsort) {
     case 'tag+site':
      var tags = sticky.getTags();
      if (tags.length == 0) {
        tags.push(new stickynotes.Tag({id: 0, name: 'No Tag'}));
      }

      for (var i = 0; i < tags.length; i++) {
        var tag = tags[i];
        parent = sidebarDoc.getElementById('tree_page_' + sticky.page_id +
                                           '_tag_' + tag.id);
        if (!parent) {
          var tagItem = sidebarDoc.getElementById('tree_tag_' + tag.id);
          if (!tagItem) {
            tagItem = this.createSidebarTagItem(tag).treechildren;
          }
          parent = this.createSidebarPageItem(sticky.getPage(),
                                              tagItem).treechildren;
        }
        this.createSidebarStickyItem(sticky, parent);
      }
      break;
     case 'site':
      var url_item = sidebarDoc.getElementById('tree_page_' + sticky.page_id);
      parent = url_item;
      if (!url_item) {
        parent = this.createSidebarPageItem(sticky.getPage()).treechildren;
      }
      this.createSidebarStickyItem(sticky, parent);
      break;
     case 'tag':
      tags = sticky.getTags();
      if (tags.length == 0)
        tags.push(new stickynotes.Tag({id: 0, name: 'No Tag'}));
      for (i = 0; i < tags.length; i++) {
        var tag = tags[i];
        parent = sidebarDoc.getElementById('tree_tag_' + tag.id);
        if (!parent) {
          parent = this.createSidebarTagItem(tag).treechildren;
        }
        this.createSidebarStickyItem(sticky, parent);
      }
      break;
     case 'time':
      break;
    }
    this.updateContextMenuVisibility();
  },
  deleteSticky: function(sticky) {
    var sidebarDoc = this.getSidebarDoc();
    var sticky_tree = sidebarDoc.getElementById('sticky_tree');
    var items = this.getStickyElements(sticky);
    for (var i = 0; i < items.length; i++) {
      var parent = items[i].parentNode;
      parent.removeChild(items[i]);
      while (parent.childNodes.length == 0 && parent.id != 'sticky_tree') {
        var _parent = parent.parentNode;
        var __parent = _parent.parentNode;
        _parent.removeChild(parent);
        __parent.removeChild(_parent);
        parent = __parent;
      }
    }
    this.updateContextMenuVisibility();
  },
  updateSticky: function(sticky) {
    var items = this.getStickyElements(sticky);
    for (var i = 0; i < items.length; i++) {
      var id = items[i].id;
      var t = items[i];
      t.treecell_text.setAttribute('label', sticky.content);
      t.treecell_id.setAttribute('label', sticky.id);
      t.treecell_title.setAttribute('label', sticky.title);
      t.treecell_x.setAttribute('label', sticky.left);
      t.treecell_y.setAttribute('label', sticky.top);
      t.treecell_width.setAttribute('label', sticky.width);
      t.treecell_height.setAttribute('label', sticky.height);
      t.treecell_url.setAttribute('label', sticky.url);
      t.treecell_color.setAttribute('label', sticky.color);
    }
  },
  addTag: function(tag) {
    var doc = this.getSidebarDoc();
    var tagItem = doc.getElementById('tree_tag_' + tag.id);
    if (!tagItem) {
      tagItem = this.createSidebarTagItem({ id: tag.id, name: tag.name});
    }
  },
  groupBy: function(selectedsort, key) {
      var doc = this.getSidebarDoc();
      if (!selectedsort) {
        selectedsort = this.getSelectedSort();
      }
      doc.getElementById('by' + selectedsort)
        .setAttribute('checked', true);
      switch (selectedsort) {
       case 'tag+site':
        this.groupByTagAndSite(key);
        break;
       case 'site':
        this.groupBySite(key);
        break;
       case 'tag':
        this.groupByTag(key);
        break;
       case 'time':
        this.groupByTime(key);
        break;
      }
    },
  groupByTagAndSite: function(key) {
    var sidebarDoc = this.getSidebarDoc();
    this.createSidebarTree();
    var tags = stickynotes.Tag.fetchAll();
    var pages = stickynotes.Page.fetchAll();
    var allStickies = stickynotes.Sticky.fetchAll(key);
    var stickies;
    var pageItem;
    var i, j, k;
    var tagItem;
    for (i = 0; i < tags.length; i++) {
      stickies = stickynotes.Sticky.fetchByTag(tags[i], key);
      if (stickies.length > 0) {
        tagItem = this.createSidebarTagItem(
          {id: tags[i].id, name: tags[i].name});
        for (j = 0; j < stickies.length; j++) {
          pageItem = sidebarDoc
            .getElementById('tree_page_' + stickies[j].page_id +
                            '_tag_' + tags[i].id);
          if (!pageItem) {
            var page = stickynotes.Page.fetchById(stickies[j].page_id);
            pageItem = this.createSidebarPageItem(
              page,
              tagItem.treechildren,
              'tree_page_' + stickies[j].page_id + '_tag_' + tags[i].id);
          }
          var item = this.createSidebarStickyItem(stickies[j],
                                                  pageItem.treechildren);
          item.tag = tags[i].name;
          for (k = 0; k < allStickies.length; k++) {
            if (allStickies[k].id == stickies[j].id)
              allStickies.splice(k, 1);
          }
        }
      }
    }
    if (allStickies.length > 0) {
      var noTagItem = this.createSidebarTagItem({ id: 0, name: 'No tag'});
      noTagItem.setAttribute('open', 'true');
      for (k = 0; k < allStickies.length; k++) {
        pageItem = sidebarDoc
          .getElementById('tree_page_' + allStickies[k].page_id +
                          '_tag_' + '0');
        if (!pageItem) {
          pageItem = this.createSidebarPageItem(
            stickynotes.Page.fetchById(allStickies[k].page_id),
            noTagItem.treechildren,
            'tree_page_' + allStickies[k].page_id + '_tag_' + '0'
          );
        }
        this.createSidebarStickyItem(allStickies[k],
                                     pageItem.treechildren);
      }
    }
    this.updateContextMenuVisibility();
  },
  groupBySite: function(key) {
    this.createSidebarTree();
    var pages = stickynotes.Page.fetchAll();
    var urlItem, stickies, i;
    for (i = 0; i < pages.length; i++) {
      stickies = stickynotes.Sticky.fetchByPage(pages[i], key);
      if (stickies.length > 0) {
        urlItem = this.createSidebarPageItem(pages[i]);
        for (var j = 0; j < stickies.length; j++) {
          this.createSidebarStickyItem(stickies[j],
                                       urlItem.treechildren);
        }
      }
    }
    this.updateContextMenuVisibility();
  },
  groupByTag: function(key) {
    this.createSidebarTree();
    var tags = stickynotes.Tag.fetchAll();
    var pages = stickynotes.Page.fetchAll();
    var allStickies = stickynotes.Sticky.fetchAll(key);
    var stickies;
    var tagItem;
    var i, j, k;
    for (i = 0; i < tags.length; i++) {
      stickies = stickynotes.Sticky.fetchByTag(tags[i], key);
      if (stickies.length > 0) {
        tagItem = this.createSidebarTagItem(tags[i]);
        for (j = 0; j < stickies.length; j++) {
          var item = this.createSidebarStickyItem(stickies[j],
                                                  tagItem.treechildren);
          item.tag = tags[i].name;
          for (k = 0; k < allStickies.length; k++) {
            if (allStickies[k].id == stickies[j].id)
              allStickies.splice(k, 1);
          }
        }
      }
    }
    if (allStickies.length > 0) {
      var noTagItem = this.createSidebarTagItem({id: 0, name: 'No Tag'});
      noTagItem.setAttribute('open', 'true');
      for (k = 0; k < allStickies.length; k++) {
        this.createSidebarStickyItem(allStickies[k],
                                     noTagItem.treechildren);
      }
    }
    this.updateContextMenuVisibility();
  },
  groupByTime: function(key) {
    this.createSidebarTree();
  },
  searchSticky: function(key) {
    this.groupBy(null, key);
  },
  filterContextMenu: function(e) {
    var sidebarDoc = this.getSidebarDoc();
    var tree = sidebarDoc.getElementById('sticky');
    if (tree.currentIndex === -1) {
      return null;
    }
    var type = tree.view.getCellText(tree.currentIndex,
                               tree.columns.getNamedColumn('type'));
    var jumpMenu = sidebarDoc.getElementById("popup_jump");
    var deleteMenu = sidebarDoc.getElementById("popup_delete");
    var exportMenu = sidebarDoc.getElementById("popup_export");
    jumpMenu.hidden = (document.popupNode.localName != "IMG");
    if (type === 'sticky') {
      jumpMenu.hidden = false;
      deleteMenu.hidden = false;
      exportMenu.hidden = false;
    }
    if (type === 'page' || type == 'tag') {
      jumpMenu.hidden = true;
      deleteMenu.hidden = true;
      exportMenu.hidden = false;
    }
  }
};
