chrome.runtime.onInstalled.addListener(() => {
  chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    console.log('Download detected:', item);
    if (item.filename.endsWith('.ipynb')) {
      console.log('IPYNB file detected, attempting to open in Colab');
      chrome.downloads.cancel(item.id, () => {
        if (chrome.runtime.lastError) {
          console.error('Error cancelling download:', chrome.runtime.lastError);
        }
      });
      getPublicUrl(item.filename)
        .then(url => openInColab(url))
        .catch(error => console.error('Error getting public URL:', error));
      return true;
    }
  });
});

async function getPublicUrl(filename) {
  const token = await getAuthToken();
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${filename}'`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  throw new Error('File not found');
}

async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}

function openInColab(url) {
  const colabUrl = `https://colab.research.google.com/drive/${url}`;
  chrome.tabs.create({ url: colabUrl });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'searchAndOpenNotebook') {
    getPublicUrl(request.fileName)
      .then(fileId => {
        if (fileId) {
          openInColab(fileId);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'File not found' });
        }
      })
      .catch(error => {
        console.error('Error searching for notebook:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates that the response is sent asynchronously
  }
});

function extractFileId(filePath) {
  const match = filePath.match(/\/content\/drive\/MyDrive\/(.+\.ipynb)/);
  return match ? match[1] : null;
}

function openInColab(fileId) {
  const colabUrl = `https://colab.research.google.com/drive/${fileId}`;
  chrome.tabs.create({ url: colabUrl });
}