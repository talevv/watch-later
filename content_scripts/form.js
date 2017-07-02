(function() {
  let getURL = () => window.location.href;

  let isYoutube = (url) => {
    return url.search("youtube.com/watch") != -1 ? true : false;
  }

  let youtubeData = () => {
    let time = document.querySelector(".ytp-time-current").textContent;
    let title = document.querySelector(".watch-title").textContent;
    return {time, title};
  }

  let info = (request, sender, sendResponse) => {

    let url = getURL();

    let movieData = {};

    if(isYoutube(url)) {
      movieData = youtubeData();
      movieData.url = url;
    } else {
      movieData = {
        title: "",
        url,
        time: ""
      }
    }

    sendResponse({movie: movieData});
    browser.runtime.onMessage.removeListener(info);
  }

  browser.runtime.onMessage.addListener(info);
})();
