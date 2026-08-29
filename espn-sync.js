/* Floor General — ESPN draft-room sync
   Paste this into the DevTools console on your ESPN draft page (F12 > Console).
   It reads the pick panel as text and pushes it to your draft board tab.
   Nothing is sent anywhere else; it only talks to the board window it opens. */
(function () {
  if (window.__fgESPN) { window.__fgESPN.show(); return; }

  var KEY = "fg_board_url";
  var target = null, timer = null, board = null, reverse = false, picking = false;
  var lastAck = null, lastSent = "";

  var css = "font:13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;";
  var box = document.createElement("div");
  box.style.cssText = "position:fixed;z-index:2147483647;right:16px;bottom:16px;width:300px;" +
    "background:#fff;color:#212121;border:1px solid #C3CAD1;border-radius:4px;" +
    "box-shadow:0 3px 12px rgba(0,0,0,.28);padding:10px 12px;" + css;
  box.innerHTML =
    "<div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:8px'>" +
      "<b style='color:#14568C'>Floor General sync</b>" +
      "<span id='fgClose' style='cursor:pointer;color:#6E7681;padding:0 4px'>&times;</span></div>" +
    "<div id='fgMsg' style='color:#4A515C;margin-bottom:8px'>Step 1 &mdash; click <b>Select panel</b>, then click the list of draft picks on the page.</div>" +
    "<div style='display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px'>" +
      "<button id='fgPick'>Select panel</button>" +
      "<button id='fgWide'>Widen</button>" +
      "<button id='fgRev'>Newest first</button>" +
    "</div>" +
    "<div style='display:flex;gap:6px;flex-wrap:wrap'>" +
      "<button id='fgStart'>Start sync</button>" +
      "<button id='fgCopy'>Copy picks</button>" +
      "<button id='fgUrl'>Board URL</button>" +
    "</div>";
  document.documentElement.appendChild(box);

  [].forEach.call(box.querySelectorAll("button"), function (b) {
    b.style.cssText = "font:12px/1 inherit;padding:5px 9px;border:1px solid #C3CAD1;background:#fff;" +
      "border-radius:3px;cursor:pointer;color:#212121";
  });
  var msg = box.querySelector("#fgMsg");
  function say(t, warn) { msg.innerHTML = t; msg.style.color = warn ? "#A32B2B" : "#4A515C"; }

  /* ---- panel selection ---- */
  var hi = document.createElement("div");
  hi.style.cssText = "position:fixed;z-index:2147483646;pointer-events:none;background:rgba(20,86,140,.18);" +
    "border:2px solid #14568C;display:none";
  document.documentElement.appendChild(hi);

  function outline(el) {
    if (!el) { hi.style.display = "none"; return; }
    var r = el.getBoundingClientRect();
    hi.style.cssText += "";
    hi.style.display = "block";
    hi.style.left = r.left + "px"; hi.style.top = r.top + "px";
    hi.style.width = r.width + "px"; hi.style.height = r.height + "px";
  }
  function onMove(e) { if (picking) outline(e.target); }
  function onPick(e) {
    if (!picking) return;
    e.preventDefault(); e.stopPropagation();
    picking = false;
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("click", onPick, true);
    target = e.target;
    outline(target);
    say("Panel selected (" + textOf().length + " chars). Click <b>Start sync</b>. If picks are missing, click <b>Widen</b>.");
  }
  box.querySelector("#fgPick").onclick = function () {
    picking = true;
    say("Now click the panel on the page that lists the draft picks.");
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onPick, true);
  };
  box.querySelector("#fgWide").onclick = function () {
    if (!target) return say("Select a panel first.", 1);
    if (target.parentElement) target = target.parentElement;
    outline(target);
    say("Widened to &lt;" + target.tagName.toLowerCase() + "&gt; (" + textOf().length + " chars).");
  };
  box.querySelector("#fgRev").onclick = function () {
    reverse = !reverse;
    this.textContent = reverse ? "Oldest first" : "Newest first";
    say("Reading order: " + (reverse ? "reversed (panel shows newest at top)" : "as shown on the page") + ".");
  };

  function textOf() {
    if (!target) return "";
    var t = target.innerText || target.textContent || "";
    if (reverse) t = t.split("\n").reverse().join("\n");
    return t;
  }

  /* ---- board window ---- */
  function boardUrl(force) {
    var u = null;
    try { u = localStorage.getItem(KEY); } catch (e) {}
    if (!u || force) {
      u = prompt("Paste your Floor General board URL\n(e.g. https://you.github.io/floor-general/)", u || "");
      if (u) { try { localStorage.setItem(KEY, u); } catch (e) {} }
    }
    return u;
  }
  box.querySelector("#fgUrl").onclick = function () { boardUrl(true); say("Board URL saved."); };

  function connect() {
    var u = boardUrl(false);
    if (!u) { say("No board URL set.", 1); return null; }
    if (!board || board.closed) board = window.open(u, "fgboard");
    return board;
  }

  window.addEventListener("message", function (e) {
    if (e.data && e.data.fg === "fgack") {
      lastAck = e.data;
      say("Synced &mdash; board sees <b>" + e.data.total + "</b> picks (" +
          e.data.seen + " names in panel). If that looks wrong, try <b>Widen</b> or <b>Newest first</b>.");
    }
  });

  function tick() {
    var t = textOf();
    if (!t) return;
    if (t === lastSent) return;
    lastSent = t;
    var w = connect(); if (!w) return stop();
    try { w.postMessage({ fg: "fgsync", text: t }, "*"); }
    catch (err) { say("Could not reach the board tab.", 1); }
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    box.querySelector("#fgStart").textContent = "Start sync";
  }
  box.querySelector("#fgStart").onclick = function () {
    if (timer) { stop(); say("Sync stopped."); return; }
    if (!target) return say("Select the pick panel first.", 1);
    if (!connect()) return;
    this.textContent = "Stop sync";
    say("Syncing every 2s. Keep both tabs open.");
    lastSent = ""; tick();
    timer = setInterval(tick, 2000);
  };

  box.querySelector("#fgCopy").onclick = function () {
    var t = textOf();
    if (!t) return say("Select the pick panel first.", 1);
    navigator.clipboard.writeText(t).then(
      function () { say("Copied. Paste it into the board's <b>Paste sync</b> box."); },
      function () { say("Clipboard blocked — select the panel text manually.", 1); });
  };

  box.querySelector("#fgClose").onclick = function () {
    stop(); box.remove(); hi.remove(); window.__fgESPN = null;
  };

  window.__fgESPN = { show: function () { box.style.display = "block"; } };
  console.log("[Floor General] sync panel ready");
})();
