document.addEventListener("DOMContentLoaded", function () {
  var root = document.documentElement;
  root.classList.add("js");
  var all = function (selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); };
  var one = function (selector, scope) { return (scope || document).querySelector(selector); };
  function make(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }
  function closeOnBackdrop(dialog) {
    dialog.addEventListener("click", function (event) { if (event.target === dialog) dialog.close(); });
  }

  /* ---- Research explorer: one project at a time, shareable as #work-poregcn ---- */
  var list = one(".work-tabs");
  var tabs = all(".work-tab");
  var panels = all(".work-panel");
  var step = one(".work-step");
  var current = 0;

  list.setAttribute("role", "tablist");
  tabs.forEach(function (tab, i) {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[i].id);
    panels[i].setAttribute("role", "tabpanel");
    panels[i].setAttribute("aria-labelledby", tab.id);
  });

  function show(index) {
    current = (index + tabs.length) % tabs.length;
    tabs.forEach(function (tab, i) {
      tab.setAttribute("aria-selected", i === current ? "true" : "false");
      tab.tabIndex = i === current ? 0 : -1;
      panels[i].classList.toggle("active", i === current);
    });
    one("span", step).textContent = (current + 1) + " of " + tabs.length;
  }
  function select(index) {
    show(index);
    history.replaceState(null, "", "#" + panels[current].id);
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function (event) { event.preventDefault(); select(i); });
    tab.addEventListener("keydown", function (event) {
      var move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      var next = move ? i + move : null;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (event.key === " ") next = i;
      if (next === null) return;
      event.preventDefault();
      show(next);
      tabs[current].focus();
    });
  });
  step.hidden = false;
  all("button", step).forEach(function (button) {
    button.addEventListener("click", function () { select(current + Number(button.dataset.step)); });
  });
  function openLinked() {
    for (var i = 0; i < panels.length; i += 1) {
      if (location.hash === "#" + panels[i].id) { show(i); list.scrollIntoView(); }
    }
  }
  show(0);
  openLinked();
  window.addEventListener("hashchange", openLinked);

  /* ---- Pop-ups: enlarged graphics and tool previews ---- */
  var lightbox = document.getElementById("lightbox");
  var big = one("img", lightbox);
  closeOnBackdrop(lightbox);
  function enlargeable(button) {
    button.addEventListener("click", function () {
      var small = one("img", button);
      big.src = small.src;
      big.alt = small.alt;
      lightbox.showModal();
    });
  }
  all(".zoom").forEach(enlargeable);

  var toolbox = document.getElementById("toolbox");
  var toolboxBody = one(".toolbox-body", toolbox);
  closeOnBackdrop(toolbox);
  var toolProjects = {
    "antimicrobial-xai-predictor": "fragment", "taste-xai-predictor": "taste", "PoreGCN": "poregcn",
    "metal-ligand-binding": "coordbind", "tmc-xai-predictor": "tmgnn", "prottrust-xai": "prottrust"
  };
  all(".tool-grid li").forEach(function (card) {
    var app = one("a.button", card);
    var key = toolProjects[app.href.split("/").pop()];
    if (!key) return;
    var panel = document.getElementById("work-" + key);
    var about = make("button", "about-tool", "About this tool");
    about.type = "button";
    card.insertBefore(about, card.lastElementChild);
    about.addEventListener("click", function () {
      toolboxBody.textContent = "";
      var title = make("h3", "", one("h3", card).textContent);
      title.id = "toolbox-title";
      toolboxBody.appendChild(title);
      var figure = one("figure img", panel);
      if (figure) {
        var image = figure.cloneNode();
        image.loading = "eager";
        toolboxBody.appendChild(image);
      }
      var text = one(".work-text", panel).cloneNode(true);
      one(".work-venue", text).remove();
      one("h3", text).remove();
      toolboxBody.appendChild(text);
      toolbox.showModal();
    });
  });

  /* ---- Drop-down menus, built from the page so they stay in step with it ---- */
  var nav = one(".site-nav");
  var menus = [];
  function dropdown(hash, allLabel, items) {
    var link = one('.nav-links a[href="' + hash + '"]');
    var wrap = make("div", "menu");
    var button = make("button", "menu-button", link.textContent);
    var panel = make("div", "menu-panel");
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.dataset.section = hash.slice(1);
    panel.hidden = true;
    items.concat([{ label: allLabel, href: hash, className: "menu-all" }]).forEach(function (item) {
      var entry = make("a", item.className, item.label);
      entry.href = item.href;
      if (item.external) { entry.target = "_blank"; entry.rel = "noopener"; }
      if (item.note) entry.appendChild(make("span", "", item.note));
      entry.addEventListener("click", function () { closeMenus(); });
      panel.appendChild(entry);
    });
    button.addEventListener("click", function () {
      var opening = panel.hidden;
      closeMenus();
      panel.hidden = !opening;
      button.setAttribute("aria-expanded", opening ? "true" : "false");
    });
    wrap.appendChild(button);
    wrap.appendChild(panel);
    link.replaceWith(wrap);
    menus.push({ button: button, panel: panel });
  }
  function closeMenus() {
    menus.forEach(function (menu) { menu.panel.hidden = true; menu.button.setAttribute("aria-expanded", "false"); });
  }
  dropdown("#programme", "See all research", tabs.map(function (tab) {
    return { label: one("strong", tab).textContent, note: one("span", tab).textContent, href: tab.getAttribute("href") };
  }));
  dropdown("#software", "Compare all tools", all(".tool-grid li").map(function (card) {
    return { label: one("h3", card).textContent, note: "Opens the app", href: one("a.button", card).href, external: true };
  }));
  document.addEventListener("click", function (event) { if (!event.target.closest(".menu")) closeMenus(); });
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    var open = menus.filter(function (menu) { return !menu.panel.hidden; })[0];
    if (open) { closeMenus(); open.button.focus(); }
  });

  /* ---- Reading progress, current section and back to top ---- */
  var bar = one(".progress");
  var toTop = document.getElementById("to-top");
  var sections = ["programme", "software", "publications", "media", "research"].map(function (id) { return document.getElementById(id); });
  function onScroll() {
    var room = root.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (room > 0 ? window.scrollY / room : 0) + ")";
    toTop.hidden = window.scrollY < 700;
    var here = "";
    sections.forEach(function (section) {
      var box = section.getBoundingClientRect();
      if (box.top <= 140 && box.bottom > 140) here = section.id;
    });
    all(".nav-links a, .menu-button", nav).forEach(function (el) {
      var target = el.dataset.section || (el.getAttribute("href") || "").slice(1);
      el.classList.toggle("here", target === here);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0 }); });
  onScroll();

  /* ---- Trust label demonstration ---- */
  var scenarios = {
    "yes-yes": ["A", "Trustworthy", "The answer and the reason both pass. This is the first candidate to act on."],
    "yes-no": ["B", "Overconfident", "The models agree, but the explanation does not support them. Check the reason before acting."],
    "no-yes": ["C", "Underconfident", "The explanation holds up, but the models disagree on the answer. Investigate further."],
    "no-no": ["D", "Unreliable", "Neither check passes. Verify by another method before using this prediction."]
  };
  function label() {
    var key = one('input[name="consensus"]:checked').value + "-" + one('input[name="reason"]:checked').value;
    var result = one(".demo-result");
    result.dataset.scenario = scenarios[key][0];
    one(".demo-letter", result).textContent = scenarios[key][0];
    one(".demo-name", result).textContent = scenarios[key][1];
    one(".demo-text", result).textContent = scenarios[key][2];
  }
  all(".demo input").forEach(function (input) { input.addEventListener("change", label); });
  label();

  /* ---- Publications: collapsible groups, topic filters and search ---- */
  var PREVIEW = 6;
  var pills = all(".topic-pill");
  var search = document.getElementById("pub-search");
  var count = document.getElementById("pub-count");
  var total = all(".pub-group .paper").length;
  var topic = "all";

  var groups = all(".pub-group").map(function (element) {
    var heading = one(".group-title", element);
    var name = heading.textContent;
    var papers = all(".paper", element);
    var toggle = make("button", "group-toggle");
    toggle.type = "button";
    toggle.appendChild(make("span", "", name));
    var tally = make("span", "tally", String(papers.length));
    toggle.appendChild(tally);
    heading.textContent = "";
    heading.appendChild(toggle);
    var more = make("button", "show-more");
    more.type = "button";
    element.appendChild(more);
    var group = { element: element, toggle: toggle, tally: tally, more: more, papers: papers,
                  open: name === "Preprints" || name === "Journal articles", expanded: false };
    toggle.addEventListener("click", function () { group.open = !group.open; update(); });
    more.addEventListener("click", function () { group.expanded = !group.expanded; update(); });
    return group;
  });

  function plain(text) {
    return text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[‐-―]/g, "-");
  }
  function update() {
    var words = plain(search.value).split(/\s+/).filter(Boolean);
    var filtering = topic !== "all" || words.length > 0;
    var found = 0;
    groups.forEach(function (group) {
      var matches = group.papers.filter(function (paper) {
        var topics = (paper.getAttribute("data-topics") || "").split(" ");
        var text = plain(paper.textContent);
        return (topic === "all" || topics.indexOf(topic) !== -1) &&
          words.every(function (word) { return text.indexOf(word) !== -1; });
      });
      found += matches.length;
      var open = filtering ? matches.length > 0 : group.open;
      var limit = filtering || group.expanded ? matches.length : PREVIEW;
      group.papers.forEach(function (paper) {
        var at = matches.indexOf(paper);
        paper.hidden = !(open && at !== -1 && at < limit);
      });
      group.element.hidden = filtering && matches.length === 0;
      group.tally.textContent = String(matches.length);
      group.toggle.setAttribute("aria-expanded", open ? "true" : "false");
      group.toggle.disabled = filtering;
      group.more.hidden = filtering || !open || matches.length <= PREVIEW;
      group.more.textContent = group.expanded ? "Show fewer" : "Show all " + matches.length;
    });
    count.textContent = !filtering ? total + " entries. Select a heading to open or close it."
      : found ? "Found " + found + " of " + total + " entries"
      : "No entries match. Try a shorter search or choose All.";
  }
  pills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      topic = pill.getAttribute("data-topic");
      pills.forEach(function (other) {
        other.classList.toggle("active", other === pill);
        other.setAttribute("aria-pressed", other === pill ? "true" : "false");
      });
      update();
    });
  });
  search.addEventListener("input", update);
  update();
});
