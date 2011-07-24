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
    getStickyElements: function(sticky){
        var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
        var elem;
        var elements = [];
        var i = 0;
        while(true){
            var _id ='sticky_' + sticky.id + '_' + i;
            elem = sidebarDoc.getElementById(_id);
            i++;
            if(!elem){
                break;
            }
            else
                elements.push(elem);
        }
        return elements;
    },
    createSidebarStickyItem: function(sticky, parent) {
        var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
        if (!parent) {
            parent = sidebarDoc.getElementById('tree_page_' + sticky.page_id);
            if (!parent)
                parent = stickynotes.Sidebar
                .createSidebarPageItem(stickynotes.DAO.getPageByUrl(sticky.url));
        }
        var treeitem_sticky = document.createElement('treeitem');
        var treerow_sticky = document.createElement('treerow');
        var treecell_id = document.createElement('treecell');
        var treecell_text = document.createElement('treecell');
        var treecell_x = document.createElement('treecell');
        var treecell_y = document.createElement('treecell');
        var treecell_width = document.createElement('treecell');
        var treecell_height = document.createElement('treecell');
        var treecell_url = document.createElement('treecell');
        var treecell_title = document.createElement('treecell');
        var treecell_color = document.createElement('treecell');
// set id
        var elem, id;
        var i = 0;
        while(true){
            var _id ='sticky_' + sticky.id + '_' + i;
            i++;
            elem = sidebarDoc.getElementById(_id);
            if(!elem){
                id = _id;
                break;
            }
        }
        treeitem_sticky.id = id;
        treerow_sticky.id = 'treerow_' + id;
        treecell_id.id = 'treecell_id_' + id;
        treecell_text.id = 'treecell_text_' + id;
        treecell_x.id = 'treecell_x_' + id;
        treecell_y.id = 'treecell_y_' + id;
        treecell_width.id = 'treecell_width_' + id;
        treecell_height.id = 'treecell_height_' + id;
        treecell_url.id = 'treecell_url_' + id;
        treecell_title .id = 'treecell_title_' + id;
        treecell_color.id = 'treecell_color_' + id;
// setAttribute
        treecell_id.setAttribute('label', sticky.id);
        treecell_title.setAttribute('label', sticky.title);
        treecell_text.setAttribute('label', sticky.content);
        treecell_x.setAttribute('label', sticky.left);
        treecell_y.setAttribute('label', sticky.top);
        treecell_width.setAttribute('label', sticky.width);
        treecell_height.setAttribute('label', sticky.height);
        treecell_url.setAttribute('label', sticky.url);
        treecell_color.setAttribute('label', sticky.color);
// appendChild
        treerow_sticky.appendChild(treecell_text);
        treerow_sticky.appendChild(treecell_id);
        treerow_sticky.appendChild(treecell_x);
        treerow_sticky.appendChild(treecell_y);
        treerow_sticky.appendChild(treecell_url);
        treerow_sticky.appendChild(treecell_title);
        treerow_sticky.appendChild(treecell_width);
        treerow_sticky.appendChild(treecell_height);
        treerow_sticky.appendChild(treecell_color);
        treeitem_sticky.appendChild(treerow_sticky);
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
        treeitem.setAttribute('id', 'treeitem_tag_' + tag.id);
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
    getSelectStickyId: function() {//サイドバーで選択されている付箋の情報を取得
        var id;
        var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
        var tree = sidebarDoc.getElementById('sticky');
        id = tree.view.getCellText(tree.currentIndex,
                                   tree.columns.getNamedColumn('id'));
        return id;
    },
    handleEvent: function(event) {//サイドバー上で右クリックしたときの動作
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
        var sticky = stickynotes.DAO.getStickyById(stickynotes.Sidebar.getSelectStickyId());
        sticky.remove();
        if (document.getElementById('sticky_tree').childNodes.length == 0) {
            document.getElementById('clipmenu').hidden = true;
            return;
        }
    },
    jump: function() {
        var sticky = stickynotes.DAO.getStickyById(stickynotes.Sidebar.getSelectStickyId());
        sticky.jump();
    },
    focusSidebar: function() {
        var sidebarDoc = stickynotes.Sidebarl.getSidebarDoc();
        var tree = sidebarDoc.getElementById('sticky');
        tree.focus();
    },
    toggleVisibilityAllStickies: function() {
        var doc = window.content.document;//
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
            parent = sidebarDoc.getElementById('tree_page_' + sticky.page_id +
                                               '_tag_0').treechildren;
            if(!parent) {
                var noTagItem = sidebarDoc.getElementById('tree_tag_0');
                if(noTagItem){
                    parent = stickynotes.Sidebar.createSidebarTagItem(
                    {id: 0, name: 'No tag'}).treechildren;
                }
                parent = stickynotes.Sidebar.createSidebarPageItem(
                    stickynotes.DAO.getPageByUrl(sticky.url),
                    sidebarDoc.getElementById('tree_tag_0'),
                    'tree_page_' + sticky.page_id + '_tag_0');
            }
            break;
          case 'site':
            var url_item = sidebarDoc.getElementById('tree_page_' + sticky.page_id);
            if (!url_item) {
                parent = stickynotes.Sidebar.createSidebarPageItem(
                    { id: sticky.id, url: sticky.url, title: sticky.title }).treechildren;
            }
            parent = url_item;
            break;
          case 'tag':
            parent = sidebarDoc.getElementById('tree_tag_0');//no tag item
            if(!parent) {
                parent = stickynotes.Sidebar.createSidebarTagItem(
                    {id: 0, name: 'No tag'}).treechildren;
            }
            break;
          case 'time':
            break;
        }
        if(parent)
            stickynotes.Sidebar.createSidebarStickyItem(sticky, parent);
    },
    deleteSticky: function(sticky) {
        var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
        var sticky_tree = sidebarDoc.getElementById('sticky_tree');
        var items = stickynotes.Sidebar.getStickyElements(sticky);
        for(var i = 0; i < items.length; i++){
            var parent = items[i].parentNode;
            parent.removeChild(items[i]);
            while(parent.childNodes.length == 0){
                var _parent = parent.parentNode;
                var __parent = _parent.parentNode;
                _parent.removeChild(parent);
                __parent.removeChild(_parent);
                parent = __parent;
            }            
        }
    },
    /**
       サイドバー上のstickyを更新.
    */
    updateSticky: function(sticky) {
        var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
        var items = stickynotes.Sidebar.getStickyElements(sticky);
        for(var i = 0; i < items.length; i++){
            var id = items[i].id;
            var treecell_id = sidebarDoc.getElementById('treecell_id' + id);
            var treecell_text = sidebarDoc.getElementById('treecell_text' + id);
            var treecell_x = sidebarDoc.getElementById('treecell_x' + id);
            var treecell_y = sidebarDoc.getElementById('treecell_y' + id);
            var treecell_width = sidebarDoc.getElementById('treecell_width' + id);
            var treecell_height = sidebarDoc.getElementById('treecell_height' + id);
            var treecell_url = sidebarDoc.getElementById('treecell_url' + id);
            var treecell_title = sidebarDoc.getElementById('treecell_title' + id);
            var treecell_color = sidebarDoc.getElementById('treecell_color' + id);
            treecell_id.setAttribute('label', sticky.id);
            treecell_title.setAttribute('label', sticky.title);
            treecell_text.setAttribute('label', sticky.content);
            treecell_x.setAttribute('label', sticky.left);
            treecell_y.setAttribute('label', sticky.top);
            treecell_width.setAttribute('label', sticky.width);
            treecell_height.setAttribute('label', sticky.height);
            treecell_url.setAttribute('label', sticky.url);
            treecell_color.setAttribute('label', sticky.color);
        }            
    },
    addTag: function(tag){
        var doc = stickynotes.Sidebar.getSidebarDoc();
        var tagItem = doc.getElementById('tree_tag_' + tag.id);
        if(!tagItem){
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
        var tags = stickynotes.DAO.getTags();
        var pages = stickynotes.DAO.getPages();
        var allStickies = stickynotes.DAO.getStickies(key);
        var stickies;
        var pageItem;
        var i, j, k;
        var tagItem;
        for (i = 0; i < tags.length; i++) {
            stickies = stickynotes.DAO.getStickiesByTag(tags[i]);
            if (stickies.length > 0) {
                tagItem =
                    stickynotes.Sidebar.createSidebarTagItem(
                        {id: tags[i].id, name: tags[i].name});
                for (j = 0; j < stickies.length; j++) {
                    pageItem = sidebarDoc
                        .getElementById('tree_page_' + stickies[j].page_id +
                                        '_tag_' + tags[i].id);
                    if (!pageItem) {
                        pageItem = stickynotes.Sidebar.createSidebarPageItem(
                            stickynotes.DAO.getPageByUrl(stickies[j].url),
                            tagItem.treechildren,
                            'tree_page_' + stickies[j].page_id +
                                '_tag_' + tags[i].id);
                    }
                    stickynotes.Sidebar.createSidebarStickyItem(stickies[j],
                                                    pageItem.treechildren);
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
                        stickynotes.DAO.getPageByUrl(allStickies[k].url),
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
        var pages = stickynotes.DAO.getPages();
        var urlItem;
        var stickies;
        var i;
        for (i = 0; i < pages.length; i++) {
            stickies = stickynotes.DAO.getStickiesByPageId(pages[i].id, key);
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
        var tags = stickynotes.DAO.getTags();
        var pages = stickynotes.DAO.getPages();
        var allStickies = stickynotes.DAO.getStickies(key);
        var stickies;
        var tagItem;
        var i, j, k;

        for (i = 0; i < tags.length; i++) {
            stickies = stickynotes.DAO.getStickiesByTag(tags[i]);
            if (stickies.length > 0) {
                tagItem =
                    stickynotes.Sidebar.createSidebarTagItem({id: tags[i].id, name: tags[i].name});
                for (j = 0; j < stickies.length; j++) {
                    stickynotes.Sidebar.createSidebarStickyItem(stickies[j],
                                                    tagItem.treechildren);
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
