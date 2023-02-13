// stored in chrome.storage.
function restore_options() {
  // load data from storage with default values
  chrome.storage.local.get(
    {
      removed: 0,
      enabled: true,
    },
    function (items) {
      console.log("options: removed: " + items.removed);

      document.getElementById("removed").innerText = items.removed;
      document.getElementById("enabled").checked = items.enabled;
    }
  );

  // find out many tabs are doubled
  chrome.tabs.query({}, function (tabs) {
    let tabcount = {};

    tabs.forEach((element) => {
      console.log(element.url);
      if (tabcount[element.url] == undefined) {
        tabcount[element.url] = 0;
      } else {
        tabcount[element.url]++;
      }
    });

    let doubles = "";
    for (const [key, value] of Object.entries(tabcount)) {
      if (value > 1) {
        console.log("double: " + key);
        doubles += key + "\n";
      }
    }

    document.getElementById("doubles").innerText = doubles;
  });
}
document.addEventListener("DOMContentLoaded", restore_options);
//document.getElementById("save").addEventListener("click", save_options);
