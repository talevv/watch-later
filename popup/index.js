

let clearList = (list) => {
  while(list.childNodes.length) {
    list.removeChild(list.lastChild);
  }
}

let reverseArray = (array) => {
  return array.reduce((a, b) => [b].concat(a), [])
}

let fillForm = (form, movie) => {
  form.elements.namedItem("title").value = movie.title.trim();
  form.elements.namedItem("url").value = movie.url;
  form.elements.namedItem("time").value = movie.time;
}

let checkMovie = (movie) => {
  // if it's YT movie
  if(movie.url.search("youtube.com/watch") != -1) {
    let time = movie.time.split(":");
    let timeString = "";
    if(time.length == 2) {
      timeString = `${time[0]}m${time[1]}s`;
    }

    return {
      title: movie.title,
      url: movie.url.search('\\?') == -1 ? `${movie.url}?t=${timeString}` : `${movie.url}&t=${timeString}`,
      time: movie.time
    }
  } else {
    return movie;
  }
}


let setID = () => '_' + Math.random().toString(36).substr(2, 9);

let load = (moviesList) => {
  browser.storage.local.get().then((data) => {
    // alert(JSON.stringify(data.movies))
    if(data.movies != undefined) {
      render(moviesList, reverseArray(data.movies));
    }
  });
}

let save = (moviesList, movie) => {
  let checkedMovie = checkMovie(movie);
  browser.storage.local.get().then((data) => {
    if(Object.keys(data).length === 0) {
      checkedMovie.id = setID();
      browser.storage.local.set({"movies": [].concat(checkedMovie)}).then(() => {
        load(moviesList);
      })
    } else {
      let ids = data.movies.map((m) => m.id);
      let set = false;
      let id = "";
      while(!set) {
        id = setID();
        if(ids.indexOf(id) == -1) {
          set = true;
        }
      }
      checkedMovie.id = id;

      browser.storage.local.set({"movies": data.movies.concat(checkedMovie)}).then(() => {
        load(moviesList);
      })
    }
  });
}

let deleteMovie = (moviesList, id) => {
  return () => {
    browser.storage.local.get().then((data) => {
      if(data.movies != undefined) {
        let filtered = data.movies.filter((movie) => movie.id != id);
        browser.storage.local.set({"movies": filtered}).then(() => {
          load(moviesList);
        })
      }
    });
  }
}

let render = (list, movies) => {
  clearList(list);

  movies.forEach((movie) => {

    // create elements
    let listItem     = document.createElement("LI");
    let titleElement = document.createElement("H2");
    let urlElement   = document.createElement("A");
    let timeElement  = document.createElement("TIME");
    let deleteButton = document.createElement("BUTTON");
    // set styles
    listItem.className     = "movies-list__movie";
    titleElement.className = "movies-list__movie-title";
    urlElement.className   = "movies-list__movie-link";
    timeElement.className  = "movies-list__movie-time";
    deleteButton.className = "movies-list__movie-delete";
    // set content
    titleElement.textContent = movie.title;
    urlElement.textContent   = movie.url;
    timeElement.textContent  = movie.time;
    // setup link
    urlElement.href = movie.url;
    urlElement.addEventListener("click", (event) => {
      event.preventDefault();
      browser.tabs.create({url: movie.url});
    });
    //setup delete button
    deleteButton.addEventListener("click", deleteMovie(list, movie.id));
    deleteButton.textContent = "delete";
    // append elements
    listItem.appendChild(titleElement);
    listItem.appendChild(urlElement);
    listItem.appendChild(timeElement);
    listItem.appendChild(deleteButton);
    list.appendChild(listItem);

  });
}

let init = (moviesList) => {
  load(moviesList)
  let form = document.querySelector("#movies-form");

  browser.tabs.executeScript(null, {
    file: "/content_scripts/form.js"
  });

  let gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
  gettingActiveTab.then((tabs) => {
    browser.tabs.sendMessage(tabs[0].id, {}).then((data) => {
      fillForm(form, data.movie);
    });
  });
}

let hideError = (formElement) => {
  return () => {
    formElement.previousElementSibling.classList.add("error--hidden");
    formElement.previousElementSibling.textContent = "";
    formElement.classList.remove("input--error");
  }
}

let showError = (formElement, message) => {
  let spanErrorElement = formElement.previousElementSibling;
  spanErrorElement.classList.remove("error--hidden");
  spanErrorElement.textContent = message;
  formElement.classList.add("input--error");
}

let validateTime = (time) => {
  let timeReg =  /^(([0-1][0-9])|(2[0-3])|([0-9])):[0-5][0-9]$|^(([0-1][0-9])|(2[0-3])|([0-9])):[0-5][0-9]:[0-5][0-9]$/;
  return timeReg.test(time);
}

let validation = (titleInput, timeInput) => {
  let valid = true;
  if(!titleInput.value.length) {
    showError(titleInput, "Title can't be empty")
    valid = false;
  }
  if(!timeInput.value.length) {
    showError(timeInput, "Time can't be empty")
    valid = false;
  } else if(!validateTime(timeInput.value)) {
    showError(timeInput, "Wrong time format")
    valid = false;
  }
  return valid;
}

let setupForm = (form) => {
  let title = form.elements.namedItem("title");
  let time = form.elements.namedItem("time");
  title.addEventListener("keydown", hideError(title));
  time.addEventListener("keydown", hideError(time));
}

let moviesList = document.querySelector("#movies-list");
let moviesForm = document.querySelector("#movies-form");
setupForm(moviesForm);

let submit = (event) => {
  event.preventDefault();
  let form = event.target;
  if(validation(form.elements.namedItem("title"), form.elements.namedItem("time"))) {
    let title = form.elements.namedItem("title").value;
    let url = form.elements.namedItem("url").value;
    let time = form.elements.namedItem("time").value;
    let movie = {title, url, time};

    save(moviesList, movie);

    form.reset();
  }
}

moviesForm.addEventListener("submit", submit);

init(moviesList);
