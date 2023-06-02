var lem = document.querySelectorAll(".content");

setTimeout(function() {
    lem.forEach(e => {
        e.style.display = "block";
    })
    document.getElementById("loading").style.display = "none";
    document.querySelector("header").style.display = "flex";
  }, 3000);