/* global browser, StickyView, Logger */
const portName = `content-script-${window.location.href}`;
const port     = browser.runtime.connect({ name: portName });
const mounsePosition = {
  x: 0,
  y: 0,
};

function watchClickPosition(event) {
  try {
    mounsePosition.x = event.clientX + window.content.pageXOffset;
    mounsePosition.y = event.clientY + window.content.pageYOffset;
  } catch (e) {
    Logger.log(e);
  }
}
document.addEventListener('mousedown', watchClickPosition, true);
port.postMessage({
  portName,
  type: 'load-stickies',
  url:  window.location.href,
});

function isChildWindow() {
  return window !== window.parent;
}

function saveSticky(sticky) {
  port.postMessage({
    type: 'save-sticky',
    portName,
    sticky,
  });
}

function setTags(sticky, tagNames) {
  sticky.tagNames = tagNames;
  port.postMessage({
    type: 'save-sticky',
    portName,
    sticky,
  });
}

function deleteSticky(sticky) {
  if (isChildWindow()) {
    return;
  }
  port.postMessage({
    type: 'delete-sticky',
    portName,
    sticky,
  });
}

function addStickyView(sticky) {
  const stickyView = new StickyView({
    sticky,
    onClickDeleteButton:   () => setTimeout(() => deleteSticky(sticky), 0),
    onClickMinimizeButton: () => stickyView.minimize(),
    onClickEditTagButton:  () => stickyView.toggleTagDialog(),
    onClickMenuButton:     () => stickyView.toggleMenuDialog(),
    onTextareaChange:      () => {
      sticky.content = stickyView.textarea.value;
      saveSticky(sticky, { content: stickyView.textarea.value });
    },
    onColorChange: (colorItem) => {
      sticky.color = colorItem.id;
      saveSticky(sticky, { color: colorItem.id });
    },
    onTagsChange: (tags) => setTags(sticky, tags),
    onMoveEnd: () => {
      sticky.left = parseInt(stickyView.dom.style.left, 10);
      sticky.top  = parseInt(stickyView.dom.style.top, 10);
      setTimeout(() => {
        saveSticky(sticky, {
          left: sticky.left,
          top:  sticky.top,
        });
      }, 0); // Wait for minized button handler
    },
    onResizeEnd: () => {
      if (!stickyView.isMinimized()) {
        sticky.width  = parseInt(stickyView.dom.style.width, 10);
        sticky.height = parseInt(stickyView.dom.style.height, 10) + 7;
        saveSticky(sticky, {
          width:  sticky.width,
          height: sticky.height,
        });
      }
    },
  });
  document.body.appendChild(stickyView.dom);
  return stickyView;
}

function loadStickies(stickies) {
  stickies.forEach(addStickyView);
}

function createSticky() {
  if (isChildWindow()) {
    return;
  }
  port.postMessage({
    portName,
    type:   'create-sticky',
    sticky: {
      left:     mounsePosition.x,
      top:      mounsePosition.y,
      width:    150,
      height:   100,
      url:      window.location.href,
      title:    window.document.title,
      content:  '',
      color:    'yellow',
      tags:     [],
      tagNames: [],
      state:    StickyView.State.Normal,
    },
  });
  mounsePosition.x += 10;
  mounsePosition.y += 10;
}

function deleteStickyView(sticky) {
  StickyView.deleteDom(sticky);
}

function load(stickies) {
  stickies.forEach((s) => {
    if (s.state !== StickyView.State.Deleted) {
      addStickyView(s);
    }
  });
  stickynotes.stickies = stickies;
}

function importedStickies(createdStickies, updatedStickies) {
  load(createdStickies);
  updatedStickies.forEach(function(sticky) {
    if (sticky.state === StickyView.State.Deleted) {
      StickyView.deleteDom(sticky);
    } else {
      StickyView.updateDom(sticky);
    }
  });
}

port.onMessage.addListener((msg) => {
  const { type } = msg;
  switch (type) {
    case 'load-stickies':
      loadStickies(msg.stickies);
      break;
    case 'create-sticky':
      if (msg.targetUrl !== window.location.href) {
        return;
      }
      createSticky();
      break;
    case 'created-sticky':
      addStickyView(msg.payload);
      break;
    case 'saved-sticky': {
      const sticky = msg.payload;
      if (sticky.state === StickyView.State.Deleted) {
        StickyView.deleteDom(sticky);
      } else {
        StickyView.updateDom(sticky, { force: true });
      }
      break;
    }
    case 'delete-sticky':
      deleteSticky(msg.payload);
      break;
    case 'deleted-sticky':
      deleteStickyView(msg.payload);
      break;
    case 'imported-stickies':
      break;
    case 'toggle-visibility':
      if (msg.targetUrl !== window.location.href) {
        return;
      }
      StickyView.toggleVisibilityAllStickies();
      break;
    case 'jump-sticky':
      break;
    case 'focus-sticky': {
      if (msg.targetUrl !== window.location.href) {
        return;
      }
      const sticky = msg.payload;
      const id = `sticky_id_${sticky.id}`;
      const e = document.getElementById(id);
      if (e) {
        e.scrollIntoView();
        e.focus();
      }
      break;
    }
    case 'import':
      break;
    case 'reload':
      break;
    default:
      break;
  }
});
