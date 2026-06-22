document.addEventListener("DOMContentLoaded", function () {
  var pills = document.querySelectorAll(".topic-pill");
  var papers = document.querySelectorAll(".paper");

  pills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      pills.forEach(function (p) { p.classList.remove("active"); });
      pill.classList.add("active");

      var topic = pill.getAttribute("data-topic");

      papers.forEach(function (paper) {
        var topics = (paper.getAttribute("data-topics") || "").split(" ");
        if (topic === "all" || topics.indexOf(topic) !== -1) {
          paper.style.display = "";
        } else {
          paper.style.display = "none";
        }
      });
    });
  });
});
