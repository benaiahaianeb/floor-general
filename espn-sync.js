/* Floor General - ESPN draft-room sync
   Paste into the Console on your ESPN draft page. */
(function () {
  if (window.__fgESPN) { window.__fgESPN.box.style.display = "block"; return; }

  var BOARD = "https://benaiahaianeb.github.io/floor-general/";
  var NAMES = "aaron jones|aaron rodgers|adam trautman|adonai mitchell|aj barner|aj brown|alec pierce|alvin kamara|amonra st brown|andrei iosivas|antonio williams|ashton dulin|ashton jeanty|austin hooper|baker mayfield|ben sims|bhayshul tuten|bijan robinson|blake corum|blake grupe|bo nix|braelon allen|brandon aubrey|breece hall|brenton strange|brian robinson|brian thomas|brock bowers|brock purdy|brock wright|bryce lance|bryce young|bub means|bucky irving|cade otton|cairo santos|caleb douglas|caleb williams|calvin austin|calvin ridley|cam little|cam skattebo|cam ward|cameron dicker|carnell tate|cedric tillman|ceedee lamb|charlie kolar|charlie smyth|chase brown|chase mclaughlin|chig okonkwo|chimere dike|chris bell|chris brazzell|chris godwin|chris olave|chris rodriguez|christian kirk|christian mccaffrey|christian watson|chuba hubbard|cj stroud|colby parkinson|cole kmet|colston loveland|cooper kupp|courtland sutton|cyrus allen|dak prescott|dallas goedert|dalton kincaid|dalton schultz|dandre swift|daniel bellinger|daniel jones|darius slayton|darnell mooney|darnell washington|davante adams|david montgomery|david njoku|davis allen|davis mills|dawson knox|deebo samuel|demarcus robinson|demario douglas|denzel boston|derrick henry|devaughn vele|devon achane|devonta smith|dezhaun stribling|dj moore|dk metcalf|dontayvion wicks|donte thornton|drake london|drake maye|dyami brown|dylan sampson|eddy pineiro|eli stowers|elic ayomanor|elijah arroyo|elijah higgins|elijah sarratt|emeka egbuka|emmett johnson|erick all|evan engram|evan mcpherson|fernando mendoza|garrett wilson|geno smith|george kittle|george pickens|germie bernard|greg dulcich|gunnar helm|harold fannin|harrison butker|harrison mevis|hollywood brown|hunter henry|isaac teslaa|isaiah likely|isiah pacheco|jack bech|jacoby brissett|jacory croskeymerritt|jadarian price|jahan dotson|jahdae walker|jahmyr gibbs|jake bates|jake ferguson|jake tonges|jakobi lane|jakobi meyers|jalen coker|jalen hurts|jalen mcmillan|jalen nailor|jalen tolbert|jamarr chase|james cook|jameson williams|jared goff|jason myers|jason sanders|jatavion sanders|jauan jennings|javonte williams|jaxon smithnjigba|jaxson dart|jayden daniels|jayden higgins|jayden reed|jaydon blue|jaylen waddle|jaylen warren|jaylin lane|jaylin noel|jeremiyah love|jeremy ruckert|jerry jeudy|jj mccarthy|jk dobbins|joe burrow|joe flacco|john bates|john metchie|jonah coleman|jonathan taylor|jonathon brooks|jordan addison|jordan love|jordan mason|jordan whittington|jordyn tyson|josh allen|josh downs|josh jacobs|josh oliver|joshua palmer|julian hill|justin fields|justin herbert|justin jefferson|juwan johnson|kaelon black|kaimi fairbairn|kalif raymond|kavontae turpin|kayshon boutte|kc concepcion|keaton mitchell|keenan allen|kendrick bourne|kenneth walker|kenny gainwell|kenyon sadiq|keon coleman|khalil shakir|kirk cousins|kyle monangai|kyle pitts|kyler murray|kyren williams|ladd mcconkey|lamar jackson|luke mccaffrey|luke musgrave|luther burden|mac jones|mack hollins|makai lemon|malachi fields|malik nabers|malik washington|malik willis|marcus mariota|mark andrews|marlin klein|marshawn lloyd|marvin harrison|marvin mims|mason taylor|matthew golden|matthew stafford|michael mayer|michael penix|michael pittman|michael wilson|mike evans|mike gesicki|mike washington|n folk|nick westbrookikhine|nico collins|noah fant|noah gray|olamide zaccheaus|omar cooper|omarion hampton|oronde gadsden|parker washington|pat bryant|pat freiermuth|patrick mahomes|puka nacua|quentin johnston|quinshon judkins|rachaad white|rashee rice|rashid shaheed|rashod bateman|rhamondre stevenson|ricky pearsall|rico dowdle|rj harvey|rome odunze|romeo doubs|ryan flournoy|sam darnold|sam laporta|saquon barkley|savion williams|shedeur sanders|spencer rattler|stefon diggs|tank bigsby|tank dell|ted hurst|tee higgins|terrance ferguson|terry mclaurin|tetairoa mcmillan|theo johnson|theo wease|tj hockenson|tommy tremble|tony pollard|tory horton|travis etienne|travis hunter|travis kelce|tre harris|tre tucker|treveyon henderson|trevor lawrence|trey mcbride|trey smack|treylon burks|troy franklin|tua tagovailoa|tucker kraft|tutu atwell|tyjae spears|tyler allgeier|tyler bass|tyler higbee|tyler loop|tyler shough|tyler warren|tyquan thornton|tyrone tracy|van jefferson|wandale robinson|wil lutz|will kacmarek|will reichard|woody marks|xavier hutchinson|xavier legette|xavier worthy|zach charbonnet|zachariah branch|zay flowers".split("|");

  var target = null, timer = null, board = null, reverse = false, picking = false, lastSent = "";

  function norm(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[.'\-,]/g, "").replace(/\s+/g, " ");
  }
  /* known player names present in a string, in order of appearance */
  function scan(text) {
    var t = " " + norm(text) + " ", hits = [], seen = {};
    for (var i = 0; i < NAMES.length; i++) {
      var n = NAMES[i], at = t.indexOf(" " + n + " ");
      if (at >= 0 && !seen[n]) { seen[n] = 1; hits.push([at, n]); }
    }
    hits.sort(function (a, b) { return a[0] - b[0]; });
    return hits.map(function (h) { return h[1]; });
  }
  function visible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }

  /* A pick row = a leading pick number AND exactly one known player name.
     This is what stops us reading the Players ranking list or a roster panel. */
  function extractPicks(root) {
    if (!root) return [];
    var rows = root.querySelectorAll("tr");
    if (!rows.length) rows = root.querySelectorAll("[role=row],li");
    var out = [], seen = {};
    for (var i = 0; i < rows.length; i++) {
      var txt = (rows[i].innerText || "").trim();
      if (!txt) continue;
      var m = txt.match(/^\s*(\d{1,3})(?:\D|$)/);
      if (!m) continue;
      var names = scan(txt);
      if (names.length !== 1) continue;
      if (seen[names[0]]) continue;
      seen[names[0]] = 1;
      out.push({ no: parseInt(m[1], 10), name: names[0], raw: txt.replace(/\s+/g, " ") });
    }
    return out;
  }

  /* the visible table whose headers say PICK and PLAYER */
  function findPickTable() {
    var cands = [].slice.call(document.querySelectorAll("table,[role=table]"));
    for (var i = 0; i < cands.length; i++) {
      var tb = cands[i];
      if (!visible(tb)) continue;
      var head = ((tb.tHead && tb.tHead.innerText) || (tb.innerText || "").slice(0, 300)).toUpperCase();
      if (head.indexOf("PICK") >= 0 && head.indexOf("PLAYER") >= 0) return tb;
    }
    return null;
  }

  function currentPicks() {
    if (!target || !document.contains(target) || !visible(target)) target = findPickTable();
    var picks = extractPicks(target);
    if (reverse) picks = picks.slice().reverse();
    return picks;
  }

  var box = document.createElement("div");
  box.style.cssText = "position:fixed;z-index:2147483647;right:16px;bottom:16px;width:330px;background:#fff;" +
    "color:#212121;border:1px solid #C3CAD1;border-radius:4px;box-shadow:0 4px 16px rgba(0,0,0,.3);padding:12px;" +
    "font:13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
  box.innerHTML =
    "<div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:8px'>" +
      "<b style='color:#14568C'>Floor General sync</b><span id='fgX' style='cursor:pointer;color:#6E7681;padding:0 4px'>&times;</span></div>" +
    "<div id='fgMsg' style='color:#4A515C;margin-bottom:9px'>Open the <b>Pick History</b> tab, then click <b>Start sync</b>. It is fine to start before the draft.</div>" +
    "<div style='display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px'>" +
      "<button id='fgAuto'>Check now</button><button id='fgPick'>Pick manually</button><button id='fgRev'>Reverse</button></div>" +
    "<div style='display:flex;gap:6px;flex-wrap:wrap'>" +
      "<button id='fgGo' style='font-weight:600'>Start sync</button><button id='fgCopy'>Copy</button></div>";
  document.documentElement.appendChild(box);
  [].forEach.call(box.querySelectorAll("button"), function (b) {
    b.style.cssText = "font:12px/1 inherit;padding:6px 10px;border:1px solid #C3CAD1;background:#fff;border-radius:3px;cursor:pointer";
  });
  var msg = box.querySelector("#fgMsg");
  function say(h, bad) { msg.innerHTML = h; msg.style.color = bad ? "#A32B2B" : "#4A515C"; }

  function report() {
    var picks = currentPicks();
    if (!target) {
      say("Can't see the <b>Pick History</b> table. Click that tab (set it to <b>All Rounds</b>), then <b>Check now</b>. " +
          "You can still click <b>Start sync</b> - it will pick it up automatically.", 1);
      return picks;
    }
    if (!picks.length) {
      say("Pick History found, but <b>no picks yet</b>. That is correct before the draft starts. " +
          "Click <b>Start sync</b> and picks will flow in as they happen.");
      return picks;
    }
    var f = picks.slice(0, 2).map(function (p) { return p.no + " " + p.name; }).join(", ");
    var l = picks.slice(-2).map(function (p) { return p.no + " " + p.name; }).join(", ");
    say("Found <b>" + picks.length + "</b> picks.<br>First: <b>" + f + "</b><br>Last: <b>" + l + "</b><br>" +
        "If <i>Last</i> is not the newest pick, click <b>Reverse</b>.");
    return picks;
  }
  box.querySelector("#fgAuto").onclick = function () { target = null; report(); };
  box.querySelector("#fgRev").onclick = function () { reverse = !reverse; report(); };

  var hi = document.createElement("div");
  hi.style.cssText = "position:fixed;z-index:2147483646;pointer-events:none;background:rgba(20,86,140,.18);border:2px solid #14568C;display:none";
  document.documentElement.appendChild(hi);
  function onMove(e) {
    if (!picking) return;
    var r = e.target.getBoundingClientRect();
    hi.style.display = "block"; hi.style.left = r.left + "px"; hi.style.top = r.top + "px";
    hi.style.width = r.width + "px"; hi.style.height = r.height + "px";
  }
  function onClick(e) {
    if (!picking) return;
    e.preventDefault(); e.stopPropagation(); picking = false;
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("click", onClick, true);
    hi.style.display = "none";
    target = e.target; report();
  }
  box.querySelector("#fgPick").onclick = function () {
    picking = true; say("Click the area listing the draft picks.");
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
  };

  function payload(picks) {
    return picks.map(function (p) { return p.no + ". " + p.raw; }).join("\n");
  }
  function send() {
    var picks = currentPicks();
    if (!picks.length) return;
    var text = payload(picks);
    if (text === lastSent) return;
    lastSent = text;
    if (!board || board.closed) board = window.open(BOARD, "fgboard");
    if (!board) { say("Popup blocked - allow popups here, then Start sync again.", 1); return; }
    board.postMessage({ fg: "fgsync", text: text }, "*");
  }
  window.addEventListener("message", function (e) {
    if (e.data && e.data.fg === "fgack")
      say("Synced. Board has <b>" + e.data.total + "</b> picks. Leave both tabs open.");
  });

  box.querySelector("#fgGo").onclick = function () {
    if (timer) { clearInterval(timer); timer = null; this.textContent = "Start sync"; say("Sync stopped."); return; }
    this.textContent = "Stop sync"; lastSent = "";
    if (!board || board.closed) board = window.open(BOARD, "fgboard");
    send(); timer = setInterval(send, 2000);
    var n = currentPicks().length;
    say(n ? "Syncing every 2 seconds - " + n + " picks so far." : "Watching for picks. Nothing drafted yet.");
  };
  box.querySelector("#fgCopy").onclick = function () {
    var t = payload(currentPicks());
    if (!t) return say("No picks to copy yet.", 1);
    navigator.clipboard.writeText(t).then(
      function () { say("Copied. Paste into the board's <b>Paste sync</b> box."); },
      function () { say("Clipboard blocked.", 1); });
  };
  box.querySelector("#fgX").onclick = function () {
    if (timer) clearInterval(timer);
    box.remove(); hi.remove(); window.__fgESPN = null;
  };

  window.__fgESPN = { box: box };
  report();
  console.log("[Floor General] ready");
})();
