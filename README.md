# Sticky Notes [![TravisCI](https://travis-ci.org/kumabook/stickynotes.svg?branch=master)]

<img align="right" height="260" src="stickynotes-icon.png">
Sticky Notes is a firefox addon that enable firefox to put sticky to web page.

Each sticky can have memo, and the size and position are changeable.

And sidebar displays the list of stickies, you can jump a selected sticky.


## How to use

### Main functionality

- Create a sticky
  - context-menu -> "Generate Sticky" or Ctrl + Shift + C
- Delete a sticky
  - Click "x" on sticky or Ctrl + Shift + D (default)
- Toggle Visible/Invisible
  - context-menu -> "Display/Hide this sticky" or Ctrl + q (default)
- Change the position of a sticky
  - Drag the upper part of a sticky
- Change the size of a sticky
  - Drag the lower right a sticky
- Display sticky list on Sidebar
  - icon-menu -> "Sticky List" or Ctrl(Command) + Shift + S (default)
- Focus to Sidebar
  - Ctrl + Shift + F (default)

### Sidebar

- Sidebar displays stickies that are sorted by site name, or tag name, or tag name and site name.
- Jump to a sticky
  - Right click menu "Jump to this sticky" or type "j" on selection state
- Delete a sticky
  - Right click menu "Delete this sticky" or type "Enter" on selection state or double click a sticky

### Tag
You can add tag to sticky with the upper textbox.
you can add multiple tags with "," separated characters.
In sidebar, stickies are gathered by tag.

### Import/Export
you can import/export with json file.

- Export
  - From icon-menu: icon-menu -> Export: Export all stickies as json file (ex: stickynotes_all.json)
  - From sidebar: open sidebar-context-menu -> Export
     - Export single sticky or multiple stickies which in selected item (ex: stickynotes_page_1.json)
- Import
  - icon-menu -> Import -> select json file.

### Preference
you can cutomize shortcut and other settings fron icon-menu.

- Shortcuts
- whether or not confirm before delete

## How to build
```
$ git submodule init
$ git submodule update
$ addon-sdk/bin/cfx run # debug
$ addon-sdk/bin/cfx xpi # package
```
