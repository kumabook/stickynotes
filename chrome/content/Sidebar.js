/**
 * My namespace's Sidebar
 * @const
 * @type {Object}
 */
stickynotes.Sidebar = {
  close: function() {
    window.close();
  },
  getDateString: function(sticky) {
    return sticky.updated_at.substring(0, 10);
  },
  getCurrentPageUrl: function() {
    if (window.content) {
      return window.content.document.location.href;
    } else {
      return null;
    }
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
      var _id = 'sticky_' + sticky.uuid + '_' + i;
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
        parent = this.createSidebarPageItem(sticky.page);
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
      var _id = 'sticky_' + sticky.uuid + '_' + i;
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
    t.treecell_id.setAttribute('label', sticky.uuid);
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
  createSidebarDateItem: function(date) {
    var sidebarDoc = this.getSidebarDoc();
    var parent = sidebarDoc.getElementById('sticky_tree');
    var treeitem = sidebarDoc.createElement('treeitem');
    treeitem.setAttribute('id', 'treeitem_date_' + date);
    treeitem.setAttribute('container', 'true');

    treeitem.setAttribute('open', 'true');
    var treerow       = document.createElement('treerow');
    var treecell_text = document.createElement('treecell');
    var treecell_id   = document.createElement('treecell');
    var treecell_type = document.createElement('treecell');
    treecell_text.setAttribute('label', date);
    treecell_id.setAttribute('label', date);
    treecell_type.setAttribute('label', 'date');
    treerow.appendChild(treecell_text);
    treerow.appendChild(treecell_id);
    treerow.appendChild(treecell_type);
    var treechildren = document.createElement('treechildren');
    treechildren.setAttribute('id', 'tree_date_' + date);
    treeitem.appendChild(treerow);
    treeitem.appendChild(treechildren);
    parent.appendChild(treeitem);
    treeitem.treechildren = treechildren;
    return treeitem;
  },
  createSidebarPageItem: function(page, parent, id) {
    var sidebarDoc = this.getSidebarDoc();
    if (parent == null)
      parent = sidebarDoc.getElementById('sticky_tree');
    var treeitem = sidebarDoc.createElement('treeitem');
    treeitem.setAttribute('id', id ? id : 'treeitem_page_' + page.id);
    treeitem.setAttribute('container', 'true');

    if (page.url == this.getCurrentPageUrl()) {
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
    let promise;
    switch (type)  {
    case 'page':
      promise = stickynotes.Sticky.fetchByPage({ id: parseInt(id)})
        .then((ss) => ss.filter((s) => !s.isDeleted()));
      break;
    case 'tag':
      promise = stickynotes.Sticky.fetchByTag( { id: parseInt(id)})
        .then((ss) => ss.filter((s) => !s.isDeleted()));
      break;
    case 'sticky':
      promise = stickynotes.Sticky.fetchByUUID(id).then((s) => s ? [s] : []);
      break;
    default:
      promise = Promise.resolve([]);
      break;
    }
    promise.then((stickies) => {
      addon.port.emit('export', stickies, type + '_' + id);
    });
  },
  remove: function() {
    if (!addon) {
      this.close();
      return;
    }
    stickynotes.Sticky.fetchByUUID(this.getSelectedItemId()).then((sticky) => {
      if (sticky == null) {
        return;
      }
      addon.port.emit('delete', sticky);
    });
  },
  jump: function() {
    if (!addon) {
      this.close();
      return;
    }
    var sidebarDoc = this.getSidebarDoc();
    stickynotes.Sticky.fetchByUUID(this.getSelectedItemId()).then((sticky) => {
      if (sticky == null) {
        return Promise.resolve(true);
      }
      return sticky.fetchPage().then(() => {
        const page = sticky.getPage();
        sidebarDoc.activeElement.blur();
        addon.port.emit('jump', sticky, page.url);
      });
    });
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
  resizeSidebarHeight: function() {
    var Ci = stickynotes.Ci;
    var doc = this.getSidebarDoc();
    doc.getElementById('sticky').height = window.innerHeight - 32;
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
    const doc          = this.getSidebarDoc();
    const selectedsort = this.getSelectedSort();
    doc.getElementById('by_' + selectedsort).setAttribute('checked', true);
    const tags = sticky.tags.concat();
    if (tags.length === 0) {
      tags.push(new stickynotes.Tag({id: 0, name: 'No tag'}));
    }
    let parent;
    switch (selectedsort) {
     case 'updated_at':
      var dateStr = this.getDateString(sticky);
      var dateItem = doc.getElementById('tree_date_' + dateStr);
      parent = dateItem;
      if (!dateItem) {
        parent = this.createSidebarDateItem(dateStr).treechildren;
      }
      this.createSidebarStickyItem(sticky, parent);
      break;
     case 'tag+site':
      tags.forEach((tag) => {
        const id = 'tree_page_' + sticky.page_id + '_tag_' + tag.id;
        parent = doc.getElementById(id);
        if (!parent) {
          let tagItem = doc.getElementById('tree_tag_' + tag.id);
          if (!tagItem) {
            tagItem = this.createSidebarTagItem(tag).treechildren;
          }
          let page = sticky.getPage();
          parent = this.createSidebarPageItem(page, tagItem).treechildren;
        }
        this.createSidebarStickyItem(sticky, parent);
      });
      break;
     case 'site':
      var url_item = doc.getElementById('tree_page_' + sticky.page_id);
      parent = url_item;
      if (!url_item) {
        parent = this.createSidebarPageItem(sticky.getPage()).treechildren;
      }
      this.createSidebarStickyItem(sticky, parent);
      break;
    case 'tag':
      tags.forEach((tag) => {
        parent = doc.getElementById('tree_tag_' + tag.id);
        if (!parent) {
          parent = this.createSidebarTagItem(tag).treechildren;
        }
        this.createSidebarStickyItem(sticky, parent);
      });
      break;
     case 'time':
      break;
    }
    this.updateContextMenuVisibility();
  },
  deleteSticky: function(sticky) {
    const sidebarDoc = this.getSidebarDoc();
    const sticky_tree = sidebarDoc.getElementById('sticky_tree');
    const items = this.getStickyElements(sticky);
    items.forEach((item) => {
      var parent = item.parentNode;
      parent.removeChild(item);
      while (parent.childNodes.length == 0 && parent.id != 'sticky_tree') {
        var _parent = parent.parentNode;
        var __parent = _parent.parentNode;
        _parent.removeChild(parent);
        __parent.removeChild(_parent);
        parent = __parent;
      }
    });
    this.updateContextMenuVisibility();
  },
  updateSticky: function(sticky) {
    const items = this.getStickyElements(sticky);
    items.forEach((item) => {
      const id = item.id;
      const t  = item;
      t.treecell_text.setAttribute(  'label', sticky.content);
      t.treecell_id.setAttribute(    'label', sticky.uuid);
      t.treecell_title.setAttribute( 'label', sticky.title);
      t.treecell_x.setAttribute(     'label', sticky.left);
      t.treecell_y.setAttribute(     'label', sticky.top);
      t.treecell_width.setAttribute( 'label', sticky.width);
      t.treecell_height.setAttribute('label', sticky.height);
      t.treecell_url.setAttribute(   'label', sticky.url);
      t.treecell_color.setAttribute( 'label', sticky.color);
    });
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
    doc.getElementById('by_' + selectedsort)
      .setAttribute('checked', true);
    switch (selectedsort) {
    case 'created_at':
      this.groupByCreatedAt(key);
      break;
    case 'updated_at':
      this.groupByUpdatedAt(key);
      break;
    case 'tag+site':
      this.groupByTagAndSite(key);
      break;
    case 'site':
      this.groupBySite(key);
      break;
    case 'tag':
      this.groupByTag(key);
      break;
    }
  },
  fetchAllItems: function(key, orderBy=stickynotes.Sticky.OrderBy.Alphabetical) {
    return Promise.all([
      stickynotes.Tag.fetchAll(),
      stickynotes.Page.fetchAll(),
      stickynotes.Sticky.fetchAll(orderBy).then((stickies) => {
        return stickies.filter((s) => {
          return !s.isDeleted() && s.filter(key);
        });
      })
    ]);
  },
  groupByTagAndSite: function(key) {
    const doc = this.getSidebarDoc();
    this.fetchAllItems(key).then((items) => {
      let [tags, pages, allStickies] = items;
      this.createSidebarTree();
      tags.forEach((t) => {
        const stickies = allStickies.filter((sticky) => {
          return !sticky.isDeleted() && sticky.tags.some((tag) => t.id === tag.id);
        });
        if (stickies.length === 0) return;
        let tagItem = this.createSidebarTagItem({id: t.id, name: t.name});
        stickies.forEach((s) => {
          const id = 'tree_page_' + s.page_id + '_tag_' + t.id;
          let pageItem = doc.getElementById(id);
          if (!pageItem) {
            const page = pages.find((p) => p.id == s.page_id);
            pageItem = this.createSidebarPageItem(page, tagItem.treechildren, id);
          }
          const item = this.createSidebarStickyItem(s, pageItem.treechildren);
          item.tag = t.name;
        });
      });
      const noTagStickies = allStickies.filter((sticky) => {
        return sticky.tags.length === 0;
      });
      if (noTagStickies.length === 0) return;
      const noTagItem = this.createSidebarTagItem({ id: 0, name: 'No tag'});
      noTagItem.setAttribute('open', 'true');
      allStickies.forEach((s) => {
        const page = pages.find((page) => page.id === s.page_id);
        const pageItem = doc.getElementById('tree_page_' + s.page_id + '_tag_' + '0');
        if (!pageItem) {
          pageItem = this.createSidebarPageItem(
            page,
            noTagItem.treechildren,
            'tree_page_' + s.page_id + '_tag_' + '0'
          );
        }
        this.createSidebarStickyItem(s, pageItem.treechildren);
      });
    });
    this.updateContextMenuVisibility();
  },
  groupBySite: function(key) {
    this.fetchAllItems(key).then((items) => {
      let [tags, pages, allStickies] = items;
      this.createSidebarTree();
      pages.forEach((page) => {
        const stickies = allStickies
                .filter((s) => s.page_id === page.id)
                .filter((s) => !s.isDeleted());
        if (stickies.length == 0) return;
        const urlItem = this.createSidebarPageItem(page);
        stickies.forEach((sticky) => {
          this.createSidebarStickyItem(sticky, urlItem.treechildren);
        });
      });
    });
    this.updateContextMenuVisibility();
  },
  groupByTag: function(key) {
    this.fetchAllItems(key).then((items) => {
      let [tags, pages, allStickies] = items;
      this.createSidebarTree();
      var stickies;
      var tagItem;

      tags.forEach((t) => {
        stickies = allStickies
          .filter((s) => s.tags.some((tag) => tag.id === t.id))
          .filter((s) => !s.isDeleted());
        if (stickies.length === 0) return;
        tagItem = this.createSidebarTagItem(t);
        stickies.forEach((s) => {
          const item = this.createSidebarStickyItem(s, tagItem.treechildren);
          item.tag = t.name;
        });
      });
      const noTagStickies = allStickies.filter((s) => s.tags.length === 0);
      if (noTagStickies.length === 0) return;
      const noTagItem = this.createSidebarTagItem({id: 0, name: 'No tag'});
      noTagItem.setAttribute('open', 'true');
      noTagStickies.forEach((sticky) => {
        this.createSidebarStickyItem(sticky, noTagItem.treechildren);
      });
    });
    this.updateContextMenuVisibility();
  },
  groupByCreatedAt: function(key) {
    this.groupByDate(key, stickynotes.Sticky.OrderBy.CreatedAt);
  },
  groupByUpdatedAt: function(key) {
    this.groupByDate(key, stickynotes.Sticky.OrderBy.UpdatedAt);
  },
  groupByDate: function(key, orderBy) {
    var sidebarDoc = this.getSidebarDoc();
    this.fetchAllItems(key, orderBy).then((items) => {
      let [tags, pages, allStickies] = items;
      this.createSidebarTree();
      var _items = [];
      allStickies.forEach((s) => {
        var dateStr = this.getDateString(s);
        var dateItem = null;
        var item = _items.find((i) => i.id === dateStr);
        if (item) {
          dateItem = item.elem;
        } else {
          dateItem = this.createSidebarDateItem(dateStr);
          _items.push({ id: dateStr, elem: dateItem });
        }
        const id = 'tree_page_' + s.page_id + '_date_' + dateStr;
        let pageItem = sidebarDoc.getElementById(id);
        if (!pageItem) {
          const page = pages.find((p) => p.id == s.page_id);
          pageItem = this.createSidebarPageItem(page,
                                                dateItem.treechildren,
                                                id);
        }
        this.createSidebarStickyItem(s, pageItem.treechildren);
      });
    });
    this.updateContextMenuVisibility();
  },
  searchSticky: function(key) {
    this.groupBy(null, key);
  },
  filterContextMenu: function(e) {
    var sidebarDoc = this.getSidebarDoc();
    var tree = sidebarDoc.getElementById('sticky');
    if (tree.currentIndex === -1) {
      return;
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
    return;
  }
};
