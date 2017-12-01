import browser from 'webextension-polyfill';
import logger from 'kiroku';
import StickyView from './content_scripts/StickyView';

if (process.env.NODE_ENV === 'production') {
  logger.setLevel('INFO');
}

const portName = `content-script-${window.location.href}`;
let port;
const mounsePosition = {
  x: 0,
  y: 0,
};

function watchClickPosition(event) {
  try {
    mounsePosition.x = event.clientX + window.top.pageXOffset;
    mounsePosition.y = event.clientY + window.top.pageYOffset;
  } catch (e) {
    logger.log(e);
  }
}
function onHashChange(e) {
  logger.info(`hashchange: ${e.newURL}`);
  port.postMessage({
    portName,
    type: 'reload-stickies',
    url:  e.newURL,
  });
}

function onPopState(e) {
  logger.info(`popstate: ${e.state} , ${document.location.href}`);
  port.postMessage({
    portName,
    type: 'reload-stickies',
    url:  document.location.href,
  });
}

document.addEventListener('mousedown', watchClickPosition, true);
window.addEventListener('hashchange', onHashChange);
window.addEventListener('popstate', onPopState);

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
  /* eslint-disable  no-param-reassign */
  sticky.tagNames = tagNames;
  saveSticky(sticky);
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

function getParentNode() {
  if (document.body.nodeName === 'FRAMESET') {
    return document.body.parentNode;
  }
  return document.body;
}

function addStickyView(sticky) {
  const stickyView = new StickyView({
    sticky,
    onClickDeleteButton:   () => setTimeout(() => deleteSticky(sticky), 0),
    onClickMinimizeButton: () => stickyView.minimize(),
    onClickEditTagButton:  () => stickyView.toggleTagDialog(),
    onClickMenuButton:     () => stickyView.toggleMenuDialog(),
    onTextareaChange:      () => {
      stickyView.sticky.content = stickyView.textarea.value;
      saveSticky(stickyView.sticky);
    },
    onColorChange: (colorItem) => {
      stickyView.sticky.color = colorItem.id;
      saveSticky(stickyView.sticky, { color: colorItem.id });
    },
    onTagsChange: tags => setTags(stickyView.sticky, tags),
    onMoveEnd:    () => {
      stickyView.sticky.left = parseInt(stickyView.dom.style.left, 10);
      stickyView.sticky.top  = parseInt(stickyView.dom.style.top, 10);
      setTimeout(() => saveSticky(stickyView.sticky), 0);
      // Wait for minized button handler
    },
    onResizeEnd: () => {
      if (!stickyView.isMinimized()) {
        stickyView.sticky.width  = parseInt(stickyView.dom.style.width, 10);
        stickyView.sticky.height = parseInt(stickyView.dom.style.height, 10) + 7;
        saveSticky(stickyView.sticky);
      }
    },
  });
  if (!document.getElementById(stickyView.dom.id)) {
    getParentNode().appendChild(stickyView.dom);
  }
  return stickyView;
}

function loadStickies(stickies, url) {
  if ((window.location && url !== window.location.href) || isChildWindow()) {
    return;
  }
  StickyView.deleteAll();
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
}

function importedStickies(createdStickies, updatedStickies) {
  load(createdStickies);
  updatedStickies.forEach((sticky) => {
    if (sticky.state === StickyView.State.Deleted) {
      StickyView.deleteDom(sticky);
    } else {
      StickyView.updateDom(sticky);
    }
  });
}

function messageListener(msg) {
  const { type } = msg;
  switch (type) {
    case 'load-stickies':
      loadStickies(msg.stickies, msg.targetUrl);
      break;
    case 'create-sticky':
      if (msg.targetUrl !== window.location.href) {
        return;
      }
      createSticky();
      break;
    case 'created-sticky':
      addStickyView(msg.payload).focus();
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
    case 'cleared-stickies':
      StickyView.deleteAll();
      break;
    case 'imported-stickies': {
      const { createdStickies, updatedStickies } = msg.payload;
      importedStickies(createdStickies, updatedStickies);
      break;
    }
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
}

setTimeout(() => {
  port = browser.runtime.connect({ name: portName });
  port.onMessage.addListener(messageListener);
  port.postMessage({
    portName,
    type: 'load-stickies',
    url:  window.location.href,
  });
}, 500);
