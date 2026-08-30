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
      var owner = info.split(/\s-\s/).slice(1).join(" - ").trim();
      out.push({
        owner: owner,
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

  /* Which of the twelve teams is HIS? ESPN answers this itself: it tags the
     user's own column in the draft board grid with class "myTeam" - on the
     header cell (which holds the team name) and on every pick cell in that
     column (whose .roundPick reads "round.pickInRound", e.g. "2.8").
     From any one of those we can recover the draft slot exactly, so the board
     never has to be told by hand which team to call "You". */
  function readMyTeam() {
    var out = { name: null, rnd: 0, pk: 0, teams: 0 };
    var hdr = document.querySelector(".draft-board-grid-header-cell.myTeam");
    if (hdr) out.name = (hdr.textContent || "").trim();
    out.teams = document.querySelectorAll(".draft-board-grid-header-cell").length;
    var cells = document.querySelectorAll(".draft-board-grid-pick-cell.myTeam .roundPick");
    for (var i = 0; i < cells.length; i++) {
      var m = (cells[i].textContent || "").trim().match(/^(\d+)\.(\d+)$/);
      if (m) { out.rnd = parseInt(m[1], 10); out.pk = parseInt(m[2], 10); break; }
    }
    /* Fallback: the sidebar names the team on every pick, so if we know the
       name but not the column, the team's round-1 pick gives the slot. */
    if (out.name && !out.rnd) {
      var ps = readPicks();
      for (var j = 0; j < ps.length; j++)
        if (ps[j].owner === out.name) { out.rnd = ps[j].rnd; out.pk = ps[j].pk; break; }
    }
    return (out.name || out.rnd) ? out : null;
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
    var me = readMyTeam();
    say("Reading <b>" + picks.length + "</b> picks from the sidebar.<br>" +
        "Latest: <b>R" + last.rnd + " P" + last.pk + " - " + last.name + "</b>" +
        (me ? "<br>Your team: <b>" + (me.name || "(unnamed)") + "</b>" +
              (me.rnd ? " - slot " + (me.rnd % 2 === 1 ? me.pk : (me.teams || 12) + 1 - me.pk) : "")
            : "<br><span style='color:#A32B2B'>Could not identify your team - open the <b>Board</b> tab once, " +
              "or set your slot by hand on the board.</span>"));
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
    board.postMessage({ fg: "fgsync", text: text, me: readMyTeam() }, "*");
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

  window.__fgESPN = { box: box, read: readPicks, me: readMyTeam };
  report();
  console.log("[Floor General] ready");
})();
