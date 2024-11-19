chrome.action.onClicked.addListener((tab) => {
    const url = new URL(tab.url);
    const pathSegments = url.pathname.split("/")
    const type = pathSegments[0] === "lessons"
  console.log(tab);
});
