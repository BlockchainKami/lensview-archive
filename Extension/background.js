chrome.runtime.onInstalled.addListener((reason) => {
    if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({
            url: 'http://localhost:5173/'
        });
    }
});


chrome.action.onClicked.addListener(async (tab) => {
    chrome.tabs.create({
        url: `http://localhost:5173/?url=${encodeURI(tab.url)}`
    });
});
