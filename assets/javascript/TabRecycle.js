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

/*

 - open new tab, paste url 
  * current tab is: active
  * new tab is active
  > url is the same -> close the new tab


- command-click, same URL with #
  * current tab is: active
  * new tab is: inactive
  > close _other_ that are inactive
  > 


- command-click, different base Url
  * current tab is: active
  * new tab is: inactive
  > close _other_ that are inactive


*/

let tabListener = function (tabId, changeInfo, tab) {
  // read changeInfo data and do something with it (like read the url)
  if (changeInfo.url) {
    let newURL = changeInfo.url;
    let newTabId = tabId;
    let isNewTabActive = tab.active;

    const newUrlExtracted = extractHash(newURL);

    // First find the active tab for the current window
    chrome.tabs.query(
      { active: true, windowId: tab.windowId },
      function (activetabs) {
        let activeUrl = "";
        let activeID = -1;
        if (activetabs.length > 0) {
          activeUrl = activetabs[0].url;
          activeID = activetabs[0].id;
          console.log("activeUrl: " + activeUrl);
        }

        const activeUrlExtracted = extractHash(activeUrl);

        chrome.tabs.query({}, function (tabs) {
          let found = false;
          let tabIndex = 0;

          while (!found && tabIndex < tabs.length) {
            let tabi = tabs[tabIndex];

            const tabUrlExtracted = extractHash(tabi.url);

            let closeTab =
              // if the processing tabi has the same URL as targeted
              tabUrlExtracted.baseURL === newUrlExtracted.baseURL &&
              // base URL is not the current active tab
              (activeUrlExtracted.baseURL != newUrlExtracted.baseURL ||
                // or active url and new url are the same because we are modifing current tab
                (activeUrlExtracted.baseURL === newUrlExtracted.baseURL &&
                  isNewTabActive)) &&
              // and the processing tab is not the new tab
              newTabId != tabi.id;

            if (closeTab) {
              // Switch to tab
              // https://developer.chrome.com/docs/extensions/reference/tabs/

              let tabToRemoveId = newTabId; // newly open

              chrome.tabs.remove(tabToRemoveId, () => {
                console.log("tab removed: " + tabToRemoveId);

                chrome.storage.local.get({ removed: 0 }, function (results) {
                  console.dir(results);
                  let updateRemove = results.removed + 1;
                  chrome.storage.local.set({ removed: updateRemove });

                  chrome.action.setBadgeText({
                    text: "" + updateRemove,
                  });
                });

                if (newUrlExtracted.hash != tabUrlExtracted.hash) {
                  let finalUrl = newURL;

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
  chrome.storage.local.get({ enabled: true, removed: 0 }, function (results) {
    let enabled = results.enabled;
    console.log("init enabled: " + enabled);

    chrome.action.setBadgeText({
      text: "" + results.removed,
    });

    setIcon(enabled);
    if (enabled) {
      chrome.tabs.onUpdated.addListener(tabListener);
    } else {
      chrome.tabs.onUpdated.removeListener(tabListener);
    }

    if (results.removed == undefined) {
      chrome.storage.local.set({ removed: 0 });
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
