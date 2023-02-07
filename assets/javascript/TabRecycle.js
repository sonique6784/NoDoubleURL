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
    let newURL = changeInfo.url;
    let newTabId = tabId;

    const newUrlExtracted = extractHash(newURL);

    // First find the active tab for the current window
    chrome.tabs.query(
      { active: true, windowId: tab.windowId },
      function (activetabs) {
        let activeUrl = "";
        if (activetabs.length > 0) {
          activeUrl = activetabs[0].url;
          console.log("activeUrl: " + activeUrl);
        }

        const activeUrlExtracted = extractHash(activeUrl);

        chrome.tabs.query({}, function (tabs) {
          let found = false;
          let tabIndex = 0;

          while (!found && tabIndex < tabs.length) {
            let tabi = tabs[tabIndex];

            const tabUrlExtracted = extractHash(tabi.url);

            // if the URL is the same
            // and if active is true, we are coming from this tab
            // it means the users open it on purpose -> skip
            if (
              newTabId != tabi.id &&
              tabUrlExtracted.baseURL === newUrlExtracted.baseURL &&
              tabUrlExtracted.baseURL != activeUrlExtracted.baseURL &&
              tabi.active == false
            ) {
              // Switch to tab
              // https://developer.chrome.com/docs/extensions/reference/tabs/
              chrome.tabs.remove(newTabId, () => {
                console.log("tab removed");

                if (newUrlExtracted.hash != tabUrlExtracted.hash) {
                  // since there is no #, add an empty one to load faster
                  let finalUrl = newURL;
                  if (newUrlExtracted.hash == "") {
                    finalUrl += "#";
                  }
                  //console.log("update: " + tabi.id + " with final URL" + finalUrl);
                  chrome.tabs.update(tabi.id, {
                    selected: true,
                    url: finalUrl,
                  });
                } else {
                  //console.log("update: " + tabi.id);
                  chrome.tabs.update(tabi.id, { selected: true });
                }
              });

              found = true;
            }
            tabIndex++;
          }
        });
      }
    );
  }
};

function extractHash(url) {
  if (url != undefined) {
    let sliptHash = url.split("#");
    let baseURL = sliptHash[0];
    let hash = "";
    if (sliptHash.length == 2) {
      hash = sliptHash[1];
    }
    return { baseURL, hash };
  }
  return { baseURL: "", hash: "" };
}

function updateExtensionStatus() {
  console.log("init");
  chrome.storage.local.get("enabled", function (results) {
    let enabled = results.enabled || results.enabled == undefined;
    console.log("init enabled: " + enabled);
    setIcon(enabled);
    if (enabled) {
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

    chrome.action.setTitle({ title: "TabRecycle (Enabled)" });
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
