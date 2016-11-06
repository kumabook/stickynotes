const win = window;
win.shortcutsTree =
  document.getElementById('stickynotes-shortcuts-tree');
win.shortcutsTreeChildren =
  document.getElementById('stickynotes-shortcuts-treechildren');

stickynotes.reloadShortcuts = function(shortcuts) {
  shortcuts.forEach(function(shortcut) {
    var elem = this.document.getElementById(shortcut.name);
    elem.setAttribute('label', shortcut.combo);
  });
};

stickynotes.createShortcuts = function(shortcuts) {
  shortcuts.forEach(function(shortcut) {
    var treeitem = win.document.createElement('treeitem');
    var treerow = win.document.createElement('treerow');
    var actionTreecell = win.document.createElement('treecell');
    actionTreecell.setAttribute('label', shortcut.label);
    actionTreecell.setAttribute('value', shortcut.name);
    actionTreecell.setAttribute('editable', false);
    var commandTreecell = win.document.createElement('treecell');
    commandTreecell.setAttribute('id', shortcut.name);
    commandTreecell.setAttribute('editable', true);

    treeitem.appendChild(treerow);
    treerow.appendChild(actionTreecell);
    treerow.appendChild(commandTreecell);
    win.shortcutsTreeChildren.appendChild(treeitem);
  });
  stickynotes.reloadShortcuts(shortcuts);
};
win.shortcutsTree.addEventListener('blur', function(e) {
  stickynotes.reloadShortcuts(win.shortcuts);
});
win.addEventListener('keydown', function(e) {
  var tree = win.shortcutsTree;

  if (tree.editingColumn && tree.editingRow >= 0) {
    var name = tree.view.getCellValue(tree.editingRow,
                                      tree.columns.getColumnAt(0));
    win.shortcuts.filter(function(shortcut) {
      return shortcut.name == name;
    }).forEach(function(shortcut) {
      tree.inputField.value = shortcut.modifiers.join('-');
      if (e.keyCode !== e.DOM_VK_CONTROL &&
          e.keyCode !== e.DOM_VK_SHIFT &&
          e.keyCode !== e.DOM_VK_META &&
          e.keyCode !== e.DOM_VK_ALT) {
        tree.inputField.value = shortcut.combo;
        tree.stopEditing(true);
        shortcut.update(e);
        win.onChangeShortcut(shortcut);
        stickynotes.reloadShortcuts(win.shortcuts);
    }
    });
  }
});

if (win.shortcuts) {
  stickynotes.createShortcuts(win.shortcuts);
}
