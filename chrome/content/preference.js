const prefWin = window;
prefWin.preferenceTree =
  document.getElementById('stickynotes-preference-tree');
prefWin.preferenceTreeChildren =
  document.getElementById('stickynotes-preference-treechildren');

stickynotes.reloadShortcuts = function(shortcuts) {
  shortcuts.forEach(function(shortcut) {
    var elem = this.document.getElementById(shortcut.name);
    elem.setAttribute('label', shortcut.combo);
  });
};

stickynotes.createShortcuts = function(shortcuts) {
  shortcuts.forEach(function(shortcut) {
    var treeitem = prefWin.document.createElement('treeitem');
    var treerow = prefWin.document.createElement('treerow');
    var actionTreecell = prefWin.document.createElement('treecell');
    actionTreecell.setAttribute('label', shortcut.label);
    actionTreecell.setAttribute('value', shortcut.name);
    actionTreecell.setAttribute('editable', false);
    var commandTreecell = prefWin.document.createElement('treecell');
    commandTreecell.setAttribute('id', shortcut.name);
    commandTreecell.setAttribute('editable', true);

    treeitem.appendChild(treerow);
    treerow.appendChild(actionTreecell);
    treerow.appendChild(commandTreecell);
    prefWin.preferenceTreeChildren.appendChild(treeitem);
  });
  stickynotes.reloadShortcuts(shortcuts);
};
prefWin.preferenceTree.addEventListener('blur', function(e) {
  stickynotes.reloadShortcuts(prefWin.shortcuts);
});
prefWin.addEventListener('keydown', function(e) {
  var tree = prefWin.preferenceTree;

  if (tree.editingColumn && tree.editingRow >= 0) {
    var name = tree.view.getCellValue(tree.editingRow,
                                      tree.columns.getColumnAt(0));
    prefWin.shortcuts.filter(function(shortcut) {
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
        prefWin.onChangeShortcut(shortcut);
        stickynotes.reloadShortcuts(prefWin.shortcuts);
    }
    });
  }
});

if (prefWin.shortcuts) {
  stickynotes.createShortcuts(prefWin.shortcuts);
}
