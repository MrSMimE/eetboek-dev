const c = require("http"), f = require("fs"), p = require("path");
const POORT = parseInt(process.env.POORT || "8123", 10);
c.createServer((q, s) => {
  let d = p.join(process.cwd(), decodeURIComponent(q.url.split("?")[0]));
  if (f.existsSync(d) && f.statSync(d).isDirectory()) d = p.join(d, "index.html");
  f.readFile(d, (e, b) => { if (e) { s.statusCode = 404; s.end("404"); } else { s.end(b); } });
}).listen(POORT, () => console.log("server aan op " + POORT));
