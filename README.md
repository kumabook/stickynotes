# Sticky Notes 

Sticky Notes is a firefox addon that enable firefox to put sticky to web page.

## How to use
Each sticky can have memo, and the size and position are changeable.
This displays the list of stickies, you can jump a selected sticky.

### Main functionality and shortcut (in parentheses for mac)

- Create a sticky: Right click menu -> "Generate Sticky" or Ctrl + Shift + C
- Delete a sticky: Ctrl + Shift + D or click "x" on sticky
- Toggle Visible/Invisible: Right click menu -> "Display/Hide this sticky" or Ctrl + q
- Change the position of a sticky: Drag the upper part of a sticky
- Change the size of a sticky: Drag the lower right a sticky
- Display sticky list on Sidebar: tool menu -> "Sticky List" or Ctrl(Command) + Shift + S
- Focus to Sidebar: Ctrl + Shift + F

### Sidebar
- Sidebar displays stickies that are sorted by site name, or tag name, or tag name and site name.

Jump to a sticky: Right click menu "Jump to this sticky" or type "j" on selection state
Delete a sticky: Right click menu "Delete this sticky" or type "Enter" on selection state or double click a sticky

### Tag
You can add tag to sticky with the upper textbox.
you can add multiple tags with "," separated characters.
In sidebar, stickies are gathered by tag.


## How to build
```
$ git submodule init
$ git submodule update
$ addon-sdk/bin/cfx run # debug
$ addon-sdk/bin/cfx xpi # package
``` 
