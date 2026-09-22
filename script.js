document.addEventListener("DOMContentLoaded", function () {
  var pills = document.querySelectorAll(".topic-pill");
  var papers = document.querySelectorAll(".pub-group .paper");
  var groups = document.querySelectorAll(".pub-group");

  pills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      pills.forEach(function (p) { p.classList.remove("active"); });
      pill.classList.add("active");

      var topic = pill.getAttribute("data-topic");

      papers.forEach(function (paper) {
        var topics = (paper.getAttribute("data-topics") || "").split(" ");
        paper.style.display = (topic === "all" || topics.indexOf(topic) !== -1) ? "" : "none";
      });

      // Hide group headings that have no visible papers under the current filter
      groups.forEach(function (group) {
        var visible = group.querySelectorAll('.paper:not([style*="none"])').length;
        group.style.display = visible ? "" : "none";
      });
    });
  });
});
