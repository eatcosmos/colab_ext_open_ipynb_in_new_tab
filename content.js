function addDoubleClickListener() {
  document.removeEventListener('dblclick', handleDoubleClick);
  document.addEventListener('dblclick', handleDoubleClick, true);
}

function handleDoubleClick(event) {
  const target = event.target.closest('.file-title-row');
  if (target) {
    const fileNameElement = target.querySelector('.file-tree-name');
    if (fileNameElement && fileNameElement.textContent.trim().endsWith('.ipynb')) {
      event.preventDefault();
      event.stopPropagation();
      const fileName = fileNameElement.textContent.trim();
      chrome.runtime.sendMessage({ action: 'searchAndOpenNotebook', fileName: fileName }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
        } else if (response && response.success) {
          console.log('Notebook opened in new tab');
        } else {
          console.error('Failed to open notebook:', response ? response.error : 'Unknown error');
        }
      });
      return false;
    }
  }
}

addDoubleClickListener();

// Re-add listener if extension is updated or reloaded
chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === "contentScript") {
    port.onDisconnect.addListener(function() {
      console.log("Extension reloaded or updated. Re-adding listener.");
      addDoubleClickListener();
    });
  }
});

// Establish a connection to detect extension updates/reloads
chrome.runtime.connect({ name: "contentScript" });