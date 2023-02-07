chrome.action.onClicked.addListener(function (tab) {
  chrome.storage.local.get("enabled", function (results) {
    chrome.storage.local.set({ enabled: !results.enabled });
  });
});

chrome.runtime.onStartup.addListener(function () {
  chrome.storage.local.get("enabled", function (results) {
    setIcon(results.enabled);
  });
});

let tabListener = function (tabId, changeInfo, tab) {
  // read changeInfo data and do something with it (like read the url)
  if (changeInfo.url) {
    // do something here
    let newURL = changeInfo.url;
    let newTabId = tabId;

    const newUrlExtracted = extractHash(newURL);

    chrome.tabs.query({}, function (tabs) {
      tabs.forEach((tabi) => {
        const tabUrlExtracted = extractHash(tabi.url);

        if (
          newTabId != tabi.id &&
          tabUrlExtracted.baseURL === newUrlExtracted.baseURL
        ) {
          // Switch to tab
          // https://developer.chrome.com/docs/extensions/reference/tabs/
          if (newUrlExtracted.hash != tabUrlExtracted.hash) {
            // since there is no #, add an empty one to load faster
            if (newUrlExtracted.hash == "") {
              newURL += "#";
            }

            chrome.tabs.update(tabi.id, { selected: true, url: newURL });
          } else {
            chrome.tabs.update(tabi.id, { selected: true });
          }

          chrome.tabs.remove(newTabId);
        }
      });
    });
  }
};

function extractHash(url) {
  let sliptHash = url.split("#");
  let baseURL = sliptHash[0];
  let hash = "";
  if (sliptHash.length == 2) {
    hash = sliptHash[1];
  }
  return { baseURL, hash };
}

/*
Object
active
: 
false
audible
: 
false
autoDiscardable
: 
true
discarded
: 
false
favIconUrl
: 
"https://wladimir-tm4pda.github.io/assets/favicon.ico"
groupId
: 
-1
height
: 
913
highlighted
: 
false
id
: 
46019400
incognito
: 
false
index
: 
12
mutedInfo
: 
{muted: false}
pinned
: 
false
selected
: 
false
status
: 
"unloaded"
title
: 
"Using Repo and Git | Android Open Source"
url
: 
"https://wladimir-tm4pda.github.io/source/git-repo.html"
width
: 
1181
windowId
: 
46019387
*/

function updateExtensionStatus() {
  chrome.storage.local.get("enabled", function (results) {
    setIcon(results.enabled);
    if (results.enabled) {
      chrome.tabs.onUpdated.addListener(tabListener);
    } else {
      chrome.tabs.onUpdated.removeListener(tabListener);
    }
  });
}

chrome.storage.onChanged.addListener(function (changes, namespace) {
  if ("enabled" in changes) {
    setIcon(changes.enabled.newValue);
    updateExtensionStatus();
  }
});

function setIcon(active) {
  if (active == true) {
    chrome.action.setIcon({
      path: {
        19: "/assets/images/tab-recycle-19.png",
        38: "/assets/images/tab-recycle-38.png",
      },
    });

    chrome.action.setTitle({ title: "NoDoubleURL (Enabled)" });
  } else {
    chrome.action.setIcon({
      path: {
        19: "/assets/images/tab-recycle-disabled-19.png",
        38: "/assets/images/tab-recycle-disabled-38.png",
      },
    });

    chrome.action.setTitle({ title: "TabRecycle (Disabled)" });
  }
}

updateExtensionStatus();
