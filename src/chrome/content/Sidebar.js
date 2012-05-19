/**
 * My namespace's Sidebar
 * @const
 * @type {Object}
 */
stickynotes.Sidebar = {
  getSidebarDoc: function() {
    return window.parent.document
      .getElementById('sidebar').contentWindow.document;
  },
  getStickyElements: function(sticky) {
    var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
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
    var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
    var tree = sidebarDoc.getElementById('sticky_tree');
    for (var i = 0; i < tree.childNodes.length; i++) {
      if (tree.childNodes[i].id == 'treeitem_tag_' + tag)
        return true;
    }
    return false;
  },
  createSidebarStickyItem: function(sticky, parent) {
    var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
    if (!parent) {
      parent = sidebarDoc.getElementById('tree_page_' + sticky.page_id);
      if (!parent)
        parent = stickynotes.Sidebar
        .createSidebarPageItem(stickynotes.Page.fetchById(sticky.page_id));
    }
    var treeitem_sticky = document.createElement('treeitem');
    var t = treeitem_sticky;
    t.treerow_sticky = document.createElement('treerow');
    t.treecell_id = document.createElement('treecell');
    t.treecell_text = document.createElement('treecell');
    t.treecell_x = document.createElement('treecell');
    t.treecell_y = document.createElement('treecell');
    t.treecell_width = document.createElement('treecell');
    t.treecell_height = document.createElement('treecell');
    t.treecell_url = document.createElement('treecell');
    t.treecell_title = document.createElement('treecell');
    t.treecell_color = document.createElement('treecell');
    // set id
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
    treeitem_sticky.id = id;
    t.treerow_sticky.id = 'treerow_' + id;
    t.treecell_id.id = 'treecell_id_' + id;
    t.treecell_text.id = 'treecell_text_' + id;
    t.treecell_x.id = 'treecell_x_' + id;
    t.treecell_y.id = 'treecell_y_' + id;
    t.treecell_width.id = 'treecell_width_' + id;
    t.treecell_height.id = 'treecell_height_' + id;
    t.treecell_url.id = 'treecell_url_' + id;
    t.treecell_title .id = 'treecell_title_' + id;
    t.treecell_color.id = 'treecell_color_' + id;
    // setAttribute
    t.treecell_id.setAttribute('label', sticky.id);
    t.treecell_title.setAttribute('label', sticky.title);
    t.treecell_text.setAttribute('label', sticky.content);
    t.treecell_x.setAttribute('label', sticky.left);
    t.treecell_y.setAttribute('label', sticky.top);
    t.treecell_width.setAttribute('label', sticky.width);
    t.treecell_height.setAttribute('label', sticky.height);
    t.treecell_url.setAttribute('label', sticky.url);
    t.treecell_color.setAttribute('label', sticky.color);
    // appendChild
    t.treerow_sticky.appendChild(t.treecell_text);
    t.treerow_sticky.appendChild(t.treecell_id);
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
    var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
    if (parent == null)
      parent = sidebarDoc.getElementById('sticky_tree');
    var treeitem = sidebarDoc.createElement('treeitem');
    treeitem.setAttribute('id', id ? id : 'treeitem_page_' + page.id);
    treeitem.setAttribute('container', 'true');
    if (page.url == window.content.document.location.href) {
      treeitem.setAttribute('open', 'true');
    }
    else {
      treeitem.setAttribute('open', 'false');
    }
    var treerow = document.createElement('treerow');
    var treecell = document.createElement('treecell');
    treecell.setAttribute('label', page.title);
    treerow.appendChild(treecell);
    var treechildren = document.createElement('treechildren');
    treechildren.setAttribute('id', 'tree_page_' + page.id);
    treeitem.appendChild(treerow);
    treeitem.appendChild(treechildren);
    parent.appendChild(treeitem);
    treeitem.treechildren = treechildren;
    return treeitem;
  },
  createSidebarTagItem: function(tag, parent) {
    var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
    if (parent == null)
      parent = sidebarDoc.getElementById('sticky_tree');
    var treeitem = sidebarDoc.createElement('treeitem');
    treeitem.setAttribute('id', 'treeitem_tag_' + tag.name);
    treeitem.setAttribute('container', 'true');
    var treerow = document.createElement('treerow');
    var treecell = document.createElement('treecell');
    treecell.setAttribute('label', tag.name);
    treerow.appendChild(treecell);
    var treechildren = document.createElement('treechildren');
    treechildren.setAttribute('id', 'tree_tag_' + tag.id);
    treeitem.appendChild(treerow);
    treeitem.appendChild(treechildren);
    parent.appendChild(treeitem);
    treeitem.treechildren = treechildren;
    return treeitem;
  },
  init: function() {
    var root = document.getElementById('sticky');
    if (root == null) return;
    document.addEventListener('click', this, true);
    root.addEventListener('dblclick', function(e) {
      stickynotes.Sidebar.jump();
    }, true);
    root.addEventListener('keydown', function(e) {
      if (e.keyCode == 13 || e.keyCode == 74)//Enter or j  --> Jump
        stickynotes.Sidebar.jump();
    }, true);
    root.addEventListener('keydown', function(e) {
      if (e.keyCode == 68) {// d  --> Delete
        stickynotes.Sidebar.remove();
        stickynotes.Sidebar.focusSidebar();
      }
    },true);
    var mainWindow = window.
      QueryInterface(Components.interfaces.nsIInterfaceRequestor)
      .getInterface(Components.interfaces.nsIWebNavigation)
      .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
      .rootTreeItem
      .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
      .getInterface(Components.interfaces.nsIDOMWindow);
    mainWindow
      .addEventListener('click',
                        stickynotes.Sidebar.resizeSidebarHeight, false);
  },
  destroy: function() {
    var mainWindow =
      window
      .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
      .getInterface(Components.interfaces.nsIWebNavigation)
      .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
      .rootTreeItem
      .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
      .getInterface(Components.interfaces.nsIDOMWindow);
    document.removeEventListener('popupshowing', this, false);
    mainWindow
      .removeEventListener('click',
                           stickynotes.Sidebar.resizeSidebarHeight, false);
  },
  getSelectStickyId: function() {
    var id;
    var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
    var tree = sidebarDoc.getElementById('sticky');
    id = tree.view.getCellText(tree.currentIndex,
                               tree.columns.getNamedColumn('id'));
    return id;
  },
  handleEvent: function(event) {//function on mouse right clicked.
    if (document.getElementById('sticky_tree').childNodes.length == 0) {
      document.getElementById('clipmenu').hidden = true;
      return;
    }
    var sticky = stickynotes.Sidebar.getSelectStickyId();
    if (sticky == '') {
      document.getElementById('clipmenu').hidden = true;
        }
    else {
      document.getElementById('clipmenu').hidden = false;
    }
  },
  remove: function() {
    var sticky = stickynotes.Sticky.fetchById(stickynotes.Sidebar.getSelectStickyId());
    sticky.remove();
    stickynotes.Sidebar.deleteSticky(sticky);
    var doc = window.content.document;
    var stickyDom = doc.getElementById('sticky' + sticky.id);
    doc.body.removeChild(stickyDom);
    if (document.getElementById('sticky_tree').childNodes.length == 0) {
      document.getElementById('clipmenu').hidden = true;
      return;
    }
  },
  jump: function() {
    var sticky = stickynotes.Sticky.fetchById(stickynotes.Sidebar.getSelectStickyId());
    sticky.jump();
  },
  focusSidebar: function() {
    var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
    var tree = sidebarDoc.getElementById('sticky');
    tree.focus();
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
    var mainWindow = window.
      QueryInterface(Components.interfaces.nsIInterfaceRequestor)
      .getInterface(Components.interfaces.nsIWebNavigation)
      .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
      .rootTreeItem
      .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
      .getInterface(Components.interfaces.nsIDOMWindow);
    var doc = window.content.document;
    stickynotes.Sidebar.getSidebarDoc().
      getElementById('sticky').height = window.innerHeight;
  },
  createSidebarTree: function() {
    var old_tree = document.getElementById('sticky_tree');
    var new_tree = document.createElement('treechildren');
    if (old_tree == null) return;
    new_tree.setAttribute('id', 'sticky_tree');
    document.getElementById('sticky').replaceChild(new_tree, old_tree);
  },
  getSelectedSort: function() {
    var selectedsort;
    var doc = stickynotes.Sidebar.getSidebarDoc();
    selectedsort =
      doc.getElementById('viewButton').getAttribute('selectedsort');
    if (!selectedsort)
      selectedsort = 'tag+site';
    return selectedsort;
  },
  addSticky: function(sticky) {
    var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
    var selectedsort = stickynotes.Sidebar.getSelectedSort();
    sidebarDoc.getElementById('by' + selectedsort)
      .setAttribute('checked', true);
    var parent;
    switch (selectedsort) {
     case 'tag+site':
      var tags = sticky.getTags();
      if (tags.length == 0)
        tags.push(new stickynotes.Tag({id: 0, name: 'No Tag'}));

      for (var i = 0; i < tags.length; i++) {
        var tag = tags[i];
        parent = sidebarDoc.getElementById('tree_page_' + sticky.page_id +
                                           '_tag_' + tag.id);
        if (!parent) {
          var tagItem = sidebarDoc.getElementById('tree_tag_' + tag.id);
          if (!tagItem) {
            tagItem = stickynotes.Sidebar.createSidebarTagItem(tag).treechildren;
          }
          parent = stickynotes.Sidebar.createSidebarPageItem(
            sticky.getPage(),
            tagItem).treechildren;
        }
        stickynotes.Sidebar.createSidebarStickyItem(sticky, parent);
      }
      break;
     case 'site':
      var url_item = sidebarDoc.getElementById('tree_page_' + sticky.page_id);
      parent = url_item;
      if (!url_item) {
        parent = stickynotes.Sidebar.createSidebarPageItem(sticky.getPage()).treechildren;
      }
      stickynotes.Sidebar.createSidebarStickyItem(sticky, parent);
      break;
     case 'tag':
      tags = sticky.getTags();
      if (tags.length == 0)
        tags.push(new stickynotes.Tag({id: 0, name: 'No Tag'}));
      for (i = 0; i < tags.length; i++) {
        var tag = tags[i];
        parent = sidebarDoc.getElementById('tree_tag_' + tag.id);
        if (!parent) {
          parent = stickynotes.Sidebar.createSidebarTagItem(tag).treechildren;
        }
        stickynotes.Sidebar.createSidebarStickyItem(sticky, parent);
      }
      break;
     case 'time':
      break;
    }
  },
  deleteSticky: function(sticky) {
    var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
    var sticky_tree = sidebarDoc.getElementById('sticky_tree');
    var items = stickynotes.Sidebar.getStickyElements(sticky);
    for (var i = 0; i < items.length; i++) {
      var parent = items[i].parentNode;
      parent.removeChild(items[i]);
      while (parent.childNodes.length == 0 &&
            parent.id != 'sticky_tree') {
        var _parent = parent.parentNode;
        var __parent = _parent.parentNode;
        _parent.removeChild(parent);
        __parent.removeChild(_parent);
        parent = __parent;
      }
    }
  },
  updateSticky: function(sticky) {
    var items = stickynotes.Sidebar.getStickyElements(sticky);
    for (var i = 0; i < items.length; i++) {
      var id = items[i].id;
      var t = items[i];
      t.treecell_id.setAttribute('label', sticky.id);
      t.treecell_title.setAttribute('label', sticky.title);
      t.treecell_text.setAttribute('label', sticky.content);
      t.treecell_x.setAttribute('label', sticky.left);
      t.treecell_y.setAttribute('label', sticky.top);
      t.treecell_width.setAttribute('label', sticky.width);
      t.treecell_height.setAttribute('label', sticky.height);
      t.treecell_url.setAttribute('label', sticky.url);
      t.treecell_color.setAttribute('label', sticky.color);
    }
  },
  addTag: function(tag) {
    var doc = stickynotes.Sidebar.getSidebarDoc();
    var tagItem = doc.getElementById('tree_tag_' + tag.id);
    if (!tagItem) {
      tagItem =
        stickynotes.Sidebar.createSidebarTagItem(
          {id: tag.id, name: tag.name});
    }
  },
  groupBy: function(selectedsort, key) {
      var doc = stickynotes.Sidebar.getSidebarDoc();
      if (!selectedsort) {
        selectedsort = stickynotes.Sidebar.getSelectedSort();
      }
      doc.getElementById('by' + selectedsort)
        .setAttribute('checked', true);
      switch (selectedsort) {
       case 'tag+site':
        stickynotes.Sidebar.groupByTagAndSite(key);
        break;
       case 'site':
        stickynotes.Sidebar.groupBySite(key);
        break;
       case 'tag':
        stickynotes.Sidebar.groupByTag(key);
        break;
       case 'time':
        stickynotes.Sidebar.groupByTime(key);
        break;
      }
    },
  groupByTagAndSite: function(key) {
    var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
    stickynotes.Sidebar.createSidebarTree();
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
        tagItem = stickynotes.Sidebar.createSidebarTagItem(
          {id: tags[i].id, name: tags[i].name});
        for (j = 0; j < stickies.length; j++) {
          pageItem = sidebarDoc
            .getElementById('tree_page_' + stickies[j].page_id +
                            '_tag_' + tags[i].id);
          if (!pageItem) {
            var page = stickynotes.Page.fetchById(stickies[j].page_id);
            pageItem = stickynotes.Sidebar.createSidebarPageItem(
              page,
              tagItem.treechildren,
              'tree_page_' + stickies[j].page_id + '_tag_' + tags[i].id);
          }
          var item = stickynotes.Sidebar.createSidebarStickyItem(
            stickies[j],
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
      var noTagItem =
        stickynotes.Sidebar.createSidebarTagItem(
          {id: 0, name: 'No tag'});
      noTagItem.setAttribute('open', 'true');
      for (k = 0; k < allStickies.length; k++) {
        pageItem = sidebarDoc
          .getElementById('tree_page_' + allStickies[k].page_id +
                          '_tag_' + '0');
        if (!pageItem) {
          pageItem = stickynotes.Sidebar.createSidebarPageItem(
            stickynotes.Page.fetchById(allStickies[k].page_id),
            noTagItem.treechildren,
            'tree_page_' + allStickies[k].page_id + '_tag_' + '0'
          );
        }
        stickynotes.Sidebar.createSidebarStickyItem(allStickies[k],
                                                    pageItem.treechildren);
      }
    }
    if (document.getElementById('sticky_tree').childNodes.length == 0) {
      document.getElementById('clipmenu').hidden = true;
      return;
    }
  },
  groupBySite: function(key) {
    stickynotes.Sidebar.createSidebarTree();
    var pages = stickynotes.Page.fetchAll();
    var urlItem, stickies, i;
    for (i = 0; i < pages.length; i++) {
      stickies = stickynotes.Sticky.fetchByPage(pages[i], key);
      if (stickies.length > 0) {
        urlItem = stickynotes.Sidebar
          .createSidebarPageItem(pages[i]);
        for (var j = 0; j < stickies.length; j++) {
          stickynotes.Sidebar.createSidebarStickyItem(stickies[j],
                                                      urlItem.treechildren);
        }
      }
    }
    if (document.getElementById('sticky_tree').childNodes.length == 0) {
      document.getElementById('clipmenu').hidden = true;
      return;
    }
  },
  groupByTag: function(key) {
    stickynotes.Sidebar.createSidebarTree();
    var tags = stickynotes.Tag.fetchAll();
    var pages = stickynotes.Page.fetchAll();
    var allStickies = stickynotes.Sticky.fetchAll(key);
    var stickies;
    var tagItem;
    var i, j, k;
    for (i = 0; i < tags.length; i++) {
      stickies = stickynotes.Sticky.fetchByTag(tags[i], key);
      if (stickies.length > 0) {
        tagItem = stickynotes.Sidebar.createSidebarTagItem(tags[i]);
        for (j = 0; j < stickies.length; j++) {
          var item = stickynotes.Sidebar.createSidebarStickyItem(stickies[j],
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
      var noTagItem = stickynotes.Sidebar
        .createSidebarTagItem({id: 0, name: 'No Tag'});
      noTagItem.setAttribute('open', 'true');
      for (k = 0; k < allStickies.length; k++) {
        stickynotes.Sidebar.createSidebarStickyItem(allStickies[k],
                                                    noTagItem.treechildren);
      }
    }
    if (document.getElementById('sticky_tree').childNodes.length == 0) {
      document.getElementById('clipmenu').hidden = true;
      return;
    }
  },
  groupByTime: function(key) {
    stickynotes.Sidebar.createSidebarTree();
  },
  searchSticky: function(key) {
    stickynotes.Sidebar.groupBy(null, key);
  }
};
