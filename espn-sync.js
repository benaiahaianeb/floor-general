/* Floor General - ESPN draft-room sync
   Reads the Picks sidebar (always visible - no tab switching).
   Paste into the Console on your ESPN draft page. */
(function () {
  if (window.__fgESPN) { window.__fgESPN.box.style.display = "block"; return; }

  var BOARD = "https://benaiahaianeb.github.io/floor-general/";
  var timer = null, board = null, lastSent = "", manual = null, picking = false;

  /* ESPN renders each sidebar pick as:
       li.pick-message__container
         span.playerinfo__playername   -> "Jahmyr Gibbs"
         div.pick-info                 -> "R1, P1 - Team Name"
     The R/P gives us the true pick number, so order never depends on the DOM. */
  function readPicks() {
    var root = manual || document;
    var items = root.querySelectorAll(".pick-message__container");
    if (!items.length && root.querySelectorAll) items = root.querySelectorAll("[class*='pick-message']");
    var out = [];
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var nameEl = el.querySelector(".playerinfo__playername");
      if (!nameEl) continue;
      var name = (nameEl.textContent || "").trim();
      if (!name) continue;
      var infoEl = el.querySelector(".pick-info");
      var info = infoEl ? (infoEl.textContent || "") : "";
      var m = info.match(/R\s*(\d+)\s*,\s*P\s*(\d+)/i);
      var teamEl = el.querySelector(".playerinfo__playerteam");
      var posEl = el.querySelector(".playerinfo__playerpos");
      out.push({
        rnd: m ? parseInt(m[1], 10) : 0,
        pk: m ? parseInt(m[2], 10) : i + 1,
        seq: i,
        name: name,
        team: teamEl ? teamEl.textContent.trim() : "",
        pos: posEl ? posEl.textContent.trim() : ""
      });
    }
    /* sort by real round/pick when ESPN gave it to us, else DOM order */
    var haveRP = out.length && out[0].rnd > 0;
    out.sort(function (a, b) {
      if (haveRP && (a.rnd !== b.rnd)) return a.rnd - b.rnd;
      if (haveRP && (a.pk !== b.pk)) return a.pk - b.pk;
      return a.seq - b.seq;
    });
    return out;
  }

  function payload(picks) {
    return picks.map(function (p, i) {
      return (i + 1) + ". " + p.name + (p.team ? " " + p.team : "") + (p.pos ? " " + p.pos : "");
    }).join("\n");
  }

  var box = document.createElement("div");
  box.style.cssText = "position:fixed;z-index:2147483647;right:16px;bottom:16px;width:330px;background:#fff;" +
    "color:#212121;border:1px solid #C3CAD1;border-radius:4px;box-shadow:0 4px 16px rgba(0,0,0,.3);padding:12px;" +
    "font:13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
  box.innerHTML =
    "<div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:8px'>" +
      "<b style='color:#14568C'>Floor General sync</b><span id='fgX' style='cursor:pointer;color:#6E7681;padding:0 4px'>&times;</span></div>" +
    "<div id='fgMsg' style='color:#4A515C;margin-bottom:9px'>Reading the <b>Picks</b> sidebar. Click <b>Start sync</b>.</div>" +
    "<div style='display:flex;gap:6px;flex-wrap:wrap'>" +
      "<button id='fgGo' style='font-weight:600'>Start sync</button>" +
      "<button id='fgChk'>Check now</button><button id='fgCopy'>Copy</button></div>";
  document.documentElement.appendChild(box);
  [].forEach.call(box.querySelectorAll("button"), function (b) {
    b.style.cssText = "font:12px/1 inherit;padding:6px 10px;border:1px solid #C3CAD1;background:#fff;border-radius:3px;cursor:pointer";
  });
  var msg = box.querySelector("#fgMsg");
  function say(h, bad) { msg.innerHTML = h; msg.style.color = bad ? "#A32B2B" : "#4A515C"; }

  function report() {
    var picks = readPicks();
    if (!picks.length) {
      say("Found the sidebar but <b>no picks yet</b>. That is correct before the draft starts - " +
          "click <b>Start sync</b> and they will flow in automatically.");
      return picks;
    }
    var last = picks[picks.length - 1];
    say("Reading <b>" + picks.length + "</b> picks from the sidebar.<br>" +
        "Latest: <b>R" + last.rnd + " P" + last.pk + " - " + last.name + "</b>");
    return picks;
  }
  box.querySelector("#fgChk").onclick = function () { report(); };

  function send() {
    var picks = readPicks();
    if (!picks.length) return;
    var text = payload(picks);
    if (text === lastSent) return;
    lastSent = text;
    if (!board || board.closed) board = window.open(BOARD, "fgboard");
    if (!board) { say("Popup blocked - allow popups here, then Start sync again.", 1); return; }
    board.postMessage({ fg: "fgsync", text: text }, "*");
  }
  window.addEventListener("message", function (e) {
    if (e.data && e.data.fg === "fgack") {
      var p = readPicks(), last = p.length ? p[p.length - 1].name : "-";
      say("Synced - board has <b>" + e.data.total + "</b> picks. Latest: <b>" + last + "</b>.<br>Leave both tabs open.");
    }
  });

  box.querySelector("#fgGo").onclick = function () {
    if (timer) { clearInterval(timer); timer = null; this.textContent = "Start sync"; say("Sync stopped."); return; }
    this.textContent = "Stop sync"; lastSent = "";
    if (!board || board.closed) board = window.open(BOARD, "fgboard");
    send(); timer = setInterval(send, 2000);
    var n = readPicks().length;
    say(n ? "Syncing every 2s - " + n + " picks so far." : "Watching for picks. Nothing drafted yet.");
  };
  box.querySelector("#fgCopy").onclick = function () {
    var t = payload(readPicks());
    if (!t) return say("No picks yet.", 1);
    navigator.clipboard.writeText(t).then(
      function () { say("Copied. Paste into the board's <b>Paste sync</b> box."); },
      function () { say("Clipboard blocked.", 1); });
  };
  box.querySelector("#fgX").onclick = function () {
    if (timer) clearInterval(timer);
    box.remove(); window.__fgESPN = null;
  };

  window.__fgESPN = { box: box, read: readPicks };
  report();
  console.log("[Floor General] ready");
})();
