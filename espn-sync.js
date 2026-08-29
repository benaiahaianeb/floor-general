/* Floor General - ESPN draft-room sync
   Paste this whole file into the Console on your ESPN draft page. */
(function () {
  if (window.__fgESPN) { window.__fgESPN.box.style.display = "block"; return; }

  var BOARD = "https://benaiahaianeb.github.io/floor-general/";
  var NAMES = "aaron jones|aaron rodgers|adam trautman|adonai mitchell|aj barner|aj brown|alec pierce|alvin kamara|amonra st brown|andrei iosivas|antonio williams|ashton dulin|ashton jeanty|austin hooper|baker mayfield|ben sims|bhayshul tuten|bijan robinson|blake corum|blake grupe|bo nix|braelon allen|brandon aubrey|breece hall|brenton strange|brian robinson|brian thomas|brock bowers|brock purdy|brock wright|bryce lance|bryce young|bub means|bucky irving|cade otton|cairo santos|caleb douglas|caleb williams|calvin austin|calvin ridley|cam little|cam skattebo|cam ward|cameron dicker|carnell tate|cedric tillman|ceedee lamb|charlie kolar|charlie smyth|chase brown|chase mclaughlin|chig okonkwo|chimere dike|chris bell|chris brazzell|chris godwin|chris olave|chris rodriguez|christian kirk|christian mccaffrey|christian watson|chuba hubbard|cj stroud|colby parkinson|cole kmet|colston loveland|cooper kupp|courtland sutton|cyrus allen|dak prescott|dallas goedert|dalton kincaid|dalton schultz|dandre swift|daniel bellinger|daniel jones|darius slayton|darnell mooney|darnell washington|davante adams|david montgomery|david njoku|davis allen|davis mills|dawson knox|deebo samuel|demarcus robinson|demario douglas|denzel boston|derrick henry|devaughn vele|devon achane|devonta smith|dezhaun stribling|dj moore|dk metcalf|dontayvion wicks|donte thornton|drake london|drake maye|dyami brown|dylan sampson|eddy pineiro|eli stowers|elic ayomanor|elijah arroyo|elijah higgins|elijah sarratt|emeka egbuka|emmett johnson|erick all|evan engram|evan mcpherson|fernando mendoza|garrett wilson|geno smith|george kittle|george pickens|germie bernard|greg dulcich|gunnar helm|harold fannin|harrison butker|harrison mevis|hollywood brown|hunter henry|isaac teslaa|isaiah likely|isiah pacheco|jack bech|jacoby brissett|jacory croskeymerritt|jadarian price|jahan dotson|jahdae walker|jahmyr gibbs|jake bates|jake ferguson|jake tonges|jakobi lane|jakobi meyers|jalen coker|jalen hurts|jalen mcmillan|jalen nailor|jalen tolbert|jamarr chase|james cook|jameson williams|jared goff|jason myers|jason sanders|jatavion sanders|jauan jennings|javonte williams|jaxon smithnjigba|jaxson dart|jayden daniels|jayden higgins|jayden reed|jaydon blue|jaylen waddle|jaylen warren|jaylin lane|jaylin noel|jeremiyah love|jeremy ruckert|jerry jeudy|jj mccarthy|jk dobbins|joe burrow|joe flacco|john bates|john metchie|jonah coleman|jonathan taylor|jonathon brooks|jordan addison|jordan love|jordan mason|jordan whittington|jordyn tyson|josh allen|josh downs|josh jacobs|josh oliver|joshua palmer|julian hill|justin fields|justin herbert|justin jefferson|juwan johnson|kaelon black|kaimi fairbairn|kalif raymond|kavontae turpin|kayshon boutte|kc concepcion|keaton mitchell|keenan allen|kendrick bourne|kenneth walker|kenny gainwell|kenyon sadiq|keon coleman|khalil shakir|kirk cousins|kyle monangai|kyle pitts|kyler murray|kyren williams|ladd mcconkey|lamar jackson|luke mccaffrey|luke musgrave|luther burden|mac jones|mack hollins|makai lemon|malachi fields|malik nabers|malik washington|malik willis|marcus mariota|mark andrews|marlin klein|marshawn lloyd|marvin harrison|marvin mims|mason taylor|matthew golden|matthew stafford|michael mayer|michael penix|michael pittman|michael wilson|mike evans|mike gesicki|mike washington|n folk|nick westbrookikhine|nico collins|noah fant|noah gray|olamide zaccheaus|omar cooper|omarion hampton|oronde gadsden|parker washington|pat bryant|pat freiermuth|patrick mahomes|puka nacua|quentin johnston|quinshon judkins|rachaad white|rashee rice|rashid shaheed|rashod bateman|rhamondre stevenson|ricky pearsall|rico dowdle|rj harvey|rome odunze|romeo doubs|ryan flournoy|sam darnold|sam laporta|saquon barkley|savion williams|shedeur sanders|spencer rattler|stefon diggs|tank bigsby|tank dell|ted hurst|tee higgins|terrance ferguson|terry mclaurin|tetairoa mcmillan|theo johnson|theo wease|tj hockenson|tommy tremble|tony pollard|tory horton|travis etienne|travis hunter|travis kelce|tre harris|tre tucker|treveyon henderson|trevor lawrence|trey mcbride|trey smack|treylon burks|troy franklin|tua tagovailoa|tucker kraft|tutu atwell|tyjae spears|tyler allgeier|tyler bass|tyler higbee|tyler loop|tyler shough|tyler warren|tyquan thornton|tyrone tracy|van jefferson|wandale robinson|wil lutz|will kacmarek|will reichard|woody marks|xavier hutchinson|xavier legette|xavier worthy|zach charbonnet|zachariah branch|zay flowers".split("|");
  var NSET = {}; for (var i = 0; i < NAMES.length; i++) NSET[NAMES[i]] = 1;

  var target = null, timer = null, board = null, reverse = false, picking = false, lastSent = "", isTable = false;

  function norm(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[.'\-,]/g, "").replace(/\s+/g, " ");
  }
  /* how many distinct known players appear in this text, in order of appearance */
  function scan(text) {
    var t = " " + norm(text) + " ", hits = [], seen = {};
    for (var i = 0; i < NAMES.length; i++) {
      var n = NAMES[i], at = t.indexOf(" " + n + " ");
      if (at >= 0 && !seen[n]) { seen[n] = 1; hits.push([at, n]); }
    }
    hits.sort(function (a, b) { return a[0] - b[0]; });
    return hits.map(function (h) { return h[1]; });
  }
  function textOf(el) {
    if (!el) return "";
    var t = el.innerText || el.textContent || "";
    return reverse ? t.split("\n").reverse().join("\n") : t;
  }

  var box = document.createElement("div");
  box.style.cssText = "position:fixed;z-index:2147483647;right:16px;bottom:16px;width:320px;background:#fff;" +
    "color:#212121;border:1px solid #C3CAD1;border-radius:4px;box-shadow:0 4px 16px rgba(0,0,0,.3);padding:12px;" +
    "font:13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
  box.innerHTML =
    "<div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:8px'>" +
      "<b style='color:#14568C'>Floor General sync</b><span id='fgX' style='cursor:pointer;color:#6E7681;padding:0 4px'>&times;</span></div>" +
    "<div id='fgMsg' style='color:#4A515C;margin-bottom:9px'>Open the <b>Pick History</b> tab (set it to <b>All Rounds</b>), then click <b>Find picks</b>.</div>" +
    "<div style='display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px'>" +
      "<button id='fgAuto'>Find picks</button><button id='fgPick'>Pick manually</button>" +
      "<button id='fgWide'>Widen</button><button id='fgRev'>Reverse</button></div>" +
    "<div style='display:flex;gap:6px;flex-wrap:wrap'>" +
      "<button id='fgGo' style='font-weight:600'>Start sync</button><button id='fgCopy'>Copy</button></div>";
  document.documentElement.appendChild(box);
  [].forEach.call(box.querySelectorAll("button"), function (b) {
    b.style.cssText = "font:12px/1 inherit;padding:6px 10px;border:1px solid #C3CAD1;background:#fff;border-radius:3px;cursor:pointer";
  });
  var msg = box.querySelector("#fgMsg");
  function say(h, bad) { msg.innerHTML = h; msg.style.color = bad ? "#A32B2B" : "#4A515C"; }

  function report() {
    var names = scan(textOf(target));
    if (!names.length) { say("No player names found in that area. Try <b>Widen</b> or <b>Pick manually</b>.", 1); return 0; }
    if (names.length > MAXPICKS) {
      say("That area has <b>" + names.length + "</b> players - too many to be the pick list. " +
          "Open the <b>Pick History</b> tab and click <b>Find picks</b> again.", 1);
      return 0;
    }
    var first = names.slice(0, 2).join(", "), last = names.slice(-2).join(", ");
    say((isTable ? "Reading the <b>Pick History</b> table. " : "") +
        "Found <b>" + names.length + "</b> picks.<br>" +
        "First: <b>" + first + "</b><br>Last: <b>" + last + "</b><br>" +
        "The <i>Last</i> names must match the most recent picks. If they are the earliest instead, click <b>Reverse</b>. Then <b>Start sync</b>.");
    return names.length;
  }

  /* auto-find: the element with the most known names that isn't the whole page */
  var MAXPICKS = 200;

  /* ESPN's Pick History is a real table with PICK / PLAYER / TEAM headers.
     Find it structurally - far more reliable than counting names. */
  function findPickTable() {
    var tables = document.querySelectorAll("table");
    for (var i = 0; i < tables.length; i++) {
      var tb = tables[i];
      var head = ((tb.tHead && tb.tHead.innerText) || tb.innerText.slice(0, 300)).toUpperCase();
      if (head.indexOf("PICK") >= 0 && head.indexOf("PLAYER") >= 0) return tb;
    }
    /* some layouts use divs with role=table or a grid */
    var cands = document.querySelectorAll("[role=table],[class*=pickHistory],[class*=pick-history],[class*=PickHistory]");
    for (var j = 0; j < cands.length; j++) {
      var c = cands[j], ct = (c.innerText || "").toUpperCase();
      if (ct.indexOf("PICK") >= 0 && ct.indexOf("PLAYER") >= 0) return c;
    }
    return null;
  }

  box.querySelector("#fgAuto").onclick = function () {
    var tb = findPickTable();
    if (tb) { target = tb; isTable = true; return report(); }
    isTable = false;
    var best = null, bestN = 0, biggest = 0;
    var all = document.body.querySelectorAll("div,section,ul,ol,table,aside,main");
    for (var i = 0; i < all.length; i++) {
      var el = all[i], txt = el.innerText || "";
      if (txt.length < 12 || txt.length > 40000) continue;
      var n = scan(txt).length;
      if (n > biggest) biggest = n;
      if (n > MAXPICKS) continue;
      if (n > bestN || (n === bestN && best && txt.length < (best.innerText || "").length)) { bestN = n; best = el; }
    }
    if (!best || !bestN) return say("Could not find the pick list. Open the <b>Pick History</b> tab, set the dropdown to <b>All Rounds</b>, then click <b>Find picks</b> again.", 1);
    target = best; report();
  };

  var hi = document.createElement("div");
  hi.style.cssText = "position:fixed;z-index:2147483646;pointer-events:none;background:rgba(20,86,140,.18);border:2px solid #14568C;display:none";
  document.documentElement.appendChild(hi);
  function outline(el) {
    if (!el) { hi.style.display = "none"; return; }
    var r = el.getBoundingClientRect();
    hi.style.display = "block"; hi.style.left = r.left + "px"; hi.style.top = r.top + "px";
    hi.style.width = r.width + "px"; hi.style.height = r.height + "px";
  }
  function onMove(e) { if (picking) outline(e.target); }
  function onClick(e) {
    if (!picking) return;
    e.preventDefault(); e.stopPropagation(); picking = false;
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("click", onClick, true);
    target = e.target; outline(target); report();
  }
  box.querySelector("#fgPick").onclick = function () {
    picking = true; say("Now click the list of draft picks on the page.");
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
  };
  box.querySelector("#fgWide").onclick = function () {
    if (!target) return say("Find or pick the panel first.", 1);
    if (target.parentElement) target = target.parentElement;
    outline(target); report();
  };
  box.querySelector("#fgRev").onclick = function () {
    reverse = !reverse; say("Reading order reversed."); report();
  };

  function send() {
    var t = textOf(target);
    if (!t || t === lastSent) return;
    lastSent = t;
    if (!board || board.closed) board = window.open(BOARD, "fgboard");
    if (!board) return say("Popup blocked - allow popups for this site, then Start sync again.", 1);
    board.postMessage({ fg: "fgsync", text: t }, "*");
  }
  window.addEventListener("message", function (e) {
    if (e.data && e.data.fg === "fgack")
      say("Synced. Board has <b>" + e.data.total + "</b> picks. Leave both tabs open.");
  });

  box.querySelector("#fgGo").onclick = function () {
    if (timer) { clearInterval(timer); timer = null; this.textContent = "Start sync"; say("Sync stopped."); return; }
    if (!target) return say("Click <b>Find picks</b> first.", 1);
    this.textContent = "Stop sync"; lastSent = ""; send();
    timer = setInterval(send, 2000);
    say("Syncing every 2 seconds...");
  };
  box.querySelector("#fgCopy").onclick = function () {
    var t = textOf(target);
    if (!t) return say("Find the panel first.", 1);
    navigator.clipboard.writeText(t).then(
      function () { say("Copied. Paste into the board's <b>Paste sync</b> box."); },
      function () { say("Clipboard blocked.", 1); });
  };
  box.querySelector("#fgX").onclick = function () {
    if (timer) clearInterval(timer);
    box.remove(); hi.remove(); window.__fgESPN = null;
  };

  window.__fgESPN = { box: box };
  console.log("[Floor General] ready - click 'Find picks'");
})();
