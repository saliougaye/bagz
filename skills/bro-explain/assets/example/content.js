/* GUIDE CONTENT. The only file to write for a new guide.
   Contract: GUIDE, PAGES, NAV, DIAGRAMS. See references/content.md. */
const GUIDE = { title: 'How a web application works', lang: 'en', meta: ['Beginner, no code', '30 minutes'], updated: '8 November 2026', updatedISO: '2026-11-08' };


const PAGES = {
  introduction: {
    line: 'The question this guide answers, the short answer, and how to read it.',
    title: 'How a web application works', nav: 'Introduction', home: true,
    lead: 'You click a link in an online shop and, a fraction of a second later, your order appears. This guide follows that click through every block it touches, so you can picture what runs where and why.',
    body: () => `
<h2 id="short-answer">The short answer</h2>
<p>A web application is not one program on one computer. It is a handful of blocks, each with a single job, that pass your request along like a relay: one finds the server, one spreads the load, one runs the code, one keeps the data. When you know what each block does and in which order they are called, most of what developers talk about (slow pages, caches, outages, backups) starts to make sense.</p>
<p>Throughout the guide you follow one example: a user opens the page of order 1042 in an online shop. Every page picks up that request where the previous one left it.</p>
<h2 id="how-to-read">How to read this guide</h2>
<p>Read the first two pages in order: <a href="#/main-blocks">The main blocks</a> gives you the map, and <a href="#/request-path">The path of a request</a> walks the example across it. After that, each block has its own page, which you can read in order or open when you need it. The last two pages collect the safety notes and the terms, for when you come back to look something up.</p>
<dl class="meta">
<div><dt>Level</dt><dd>Beginner, no code needed</dd></div>
<div><dt>Reading time</dt><dd>30 minutes for the whole guide</dd></div>
<div><dt>Last updated</dt><dd><time datetime="${GUIDE.updatedISO}">${GUIDE.updated}</time></dd></div>
</dl>
${adm('note', 'The guide uses one name for each thing. It always says “application server”, for example, never “back end”, so that you never wonder whether two words mean two blocks. <a href="#/terms">Terms</a> lists them all.')}
<h2 id="contents">Contents</h2>
${contentsIndex()}` },

  'main-blocks': {
    line: 'The map: nine blocks in four zones, and which of them keep your data.',
    title: 'The main blocks',
    lead: 'Before following the request, you need the map it travels on. This page shows the nine blocks of a typical web application and where each one runs.',
    body: () => `
<h2 id="what">What a block is</h2>
<p>A block is a program or a server with one job, such as finding addresses or keeping data. The blocks talk to each other over the network, so each one can be replaced, copied or restarted without touching the others. That is the whole reason to split an application this way.</p>
<p>A small application may run several blocks on the same server, while a large one runs many copies of each. The jobs stay the same either way, so the map below fits both.</p>
<h2 id="diagram">The map</h2>
<p>The diagram groups the nine blocks into four zones, from the user's device on the left to the data on the right. Read it left to right: that is roughly the order in which the request for order 1042 meets them.</p>
${figure('arch', 'The main blocks of a web application', 'Nine blocks in four zones. Select a block to see its job, whether it keeps data, and what it connects to.')}
<p>You can drag the map, zoom it, or open it full screen for a projector. With the keyboard, Tab moves between blocks, the arrow keys jump to the nearest one, and Enter opens its details.</p>
<h2 id="zones">The four zones</h2>
<p>A zone tells you where a block runs, which in turn tells you who controls it and what happens when it fails.</p>
<h3 id="client">Client</h3>
<p>The client is the user's computer or phone. Only the browser runs here, and you do not control it: the user may have an old version, a slow connection or a full disk.</p>
<h3 id="edge-zone">Edge</h3>
<p>The edge sits between the user and your servers. DNS, the CDN and the load balancer live here, and their job is to get each request to the right server as fast as possible, answering it themselves when they can.</p>
<h3 id="app-zone">Application</h3>
<p>The application zone runs your code: the application server, which answers requests, and the worker, which handles slow jobs in the background.</p>
<h3 id="data-zone">Data</h3>
<p>The data zone keeps everything that must outlive a single request: the database, the cache and the queue.</p>
<h2 id="keeps">Which blocks keep data</h2>
<p>Whether a block keeps data decides how careful you must be with it. The table sorts the blocks from the one you can never lose to the ones you can restart freely.</p>
<div class="tbl-wrap"><table class="tbl">
<caption><b>Which blocks keep data</b>And what the user notices when the block stops.</caption>
<thead><tr><th scope="col">Block</th><th scope="col">Keeps data</th><th scope="col">If the block stops</th></tr></thead>
<tbody>
<tr><th scope="row">Database</th><td>Yes, the main copy of everything.</td><td>Nobody can read or save anything.</td></tr>
<tr><th scope="row">Queue</th><td>Yes, until a worker finishes the task.</td><td>New background tasks cannot be added.</td></tr>
<tr><th scope="row">Cache</th><td>A short-lived copy.</td><td>Pages get slower, but no data is lost.</td></tr>
<tr><th scope="row">CDN, browser</td><td>Short-lived copies of files.</td><td>Pages load more slowly.</td></tr>
<tr><th scope="row">DNS, load balancer, application server, worker</th><td>No.</td><td>Requests or tasks stop until it is back; no data is lost.</td></tr>
</tbody></table></div>
<p>So the database is the one block whose failure costs you data rather than time, which is why it gets its own backup plan.</p>
${adm('caution', 'Back up the database every day. A lost database is the one failure you cannot fix by restarting something. <a href="#/database/backups">Database</a> explains how.')}` },

  'request-path': {
    line: 'Order 1042 from click to page, including the fork between a fast and a slow path.',
    title: 'The path of a request',
    lead: 'With the map in mind, you can now follow the request for order 1042 from the click to the finished page, and see why the same page is sometimes fast and sometimes slow.',
    body: () => `
<h2 id="example">The request</h2>
<p>When the user clicks the link to their order, the browser sends a short text message to the shop:</p>
${code('HTTP request', `GET /orders/1042 HTTP/1.1
Host: shop.example.com
Accept: text/html
Accept-Language: en`)}
<p>The first line carries the important part: <code>GET</code> means “send me this”, and <code>/orders/1042</code> says what. The lines below add context, such as which site it is for and which language the user prefers.</p>
<h2 id="flow">The path at a glance</h2>
<p>The request crosses the edge, reaches an application server, and then hits a fork: either the order is already in the cache, or the server has to fetch it from the database. Everything else is the same on both branches.</p>
${figure('flow', 'The path of one request', 'Eight steps and one decision. Select a step to see what it does and what it needs.')}
<h2 id="steps">Step by step</h2>
<p>Here is the same path in words, with the blocks named in the order the request meets them.</p>
<ol class="steps">
<li>The browser asks DNS for the IP address of shop.example.com.</li>
<li>The browser sends the request to the CDN, which does not store order pages and passes it to the load balancer.</li>
<li>The load balancer picks an application server that is ready and forwards the request.</li>
<li>The application server reads the path, finds the order number and asks the cache for order 1042.</li>
<li>The server builds the page and sends it back to the browser along the same route.</li>
</ol>
<h3 id="hit">When the order is in the cache</h3>
<p>If another request read order 1042 a moment ago, the cache still holds a copy, and the server uses it without touching the database. This is the fast branch.</p>
<h3 id="miss">When the order is not in the cache</h3>
<p>Otherwise the server reads the order from the database and, before answering, leaves a copy in the cache, so that the next request for the same order takes the fast branch. This is the slow branch.</p>
<h2 id="time">Where the time goes</h2>
<p>To see how much the fork matters, add up the time each part takes. The numbers below are invented but realistic in proportion: compare the two columns rather than reading any single value.</p>
<div class="tbl-wrap"><table class="tbl">
<caption>${EXAMPLE}<b>Time for each part of one request</b>Only the proportions matter.</caption>
<thead><tr><th scope="col">Part of the request</th><th scope="col" class="num">Fast branch</th><th scope="col" class="num">Slow branch</th></tr></thead>
<tbody>
<tr><td>DNS finds the IP address</td><td class="num">20 ms</td><td class="num">20 ms</td></tr>
<tr><td>CDN and load balancer</td><td class="num">15 ms</td><td class="num">15 ms</td></tr>
<tr><td>Application server reads the request</td><td class="num">10 ms</td><td class="num">10 ms</td></tr>
<tr><td>Read from the cache</td><td class="num">2 ms</td><td class="num na"><span aria-hidden="true">—</span><span class="sr">not used</span></td></tr>
<tr><td>Read from the database</td><td class="num na"><span aria-hidden="true">—</span><span class="sr">not used</span></td><td class="num">80 ms</td></tr>
<tr><td>Keep a copy in the cache</td><td class="num na"><span aria-hidden="true">—</span><span class="sr">not used</span></td><td class="num">3 ms</td></tr>
<tr><td>Make the response</td><td class="num">25 ms</td><td class="num">25 ms</td></tr>
</tbody>
<tfoot><tr><td>Total</td><td class="num">72 ms</td><td class="num">153 ms</td></tr></tfoot>
</table></div>
<p>The chart groups the same numbers by zone. The edge and the server cost the same on both branches; the whole difference is the data part.</p>
${chart({ title: 'Total time of one request', desc: 'The data part makes the difference between the two branches.', unit: 'ms', illustrative: true,
  series: [{ key: 'edge', label: 'Edge', color: 'c1' }, { key: 'server', label: 'Server', color: 'c2' }, { key: 'data', label: 'Data', color: 'c3' }],
  rows: [{ label: 'Fast branch', values: { edge: 35, server: 35, data: 2 } }, { label: 'Slow branch', values: { edge: 35, server: 35, data: 83 } }] })}
${adm('note', 'These numbers are an example, not a measurement. Measure your own application before you decide what to optimise.')}
<h2 id="long">What the request does not wait for</h2>
<p>Placing the order also triggers a confirmation email, which can take seconds to send. If the server sent it during the request, the user would stare at a loading page the whole time. Instead the server drops a task in the queue and answers at once; a worker picks the task up a moment later and sends the email in the background.</p>
${adm('caution', 'Never do slow work, such as sending email or building a report, inside the request. The user waits for all of it. Put it in the queue.')}
<p>The next pages open up each block along this path, starting from the edge.</p>` },

  edge: {
    line: 'How DNS, the CDN and the load balancer get the request to a server.',
    title: 'Edge blocks',
    lead: 'The first three blocks the request meets have one goal in common: get it to a working server quickly, or answer it before it gets there.',
    body: () => `
<h2 id="dns">DNS</h2>
<p>Computers find each other by number, people by name, and DNS translates between the two: it turns shop.example.com into an IP address such as 203.0.113.10, which is what the browser needs to send anything. You can ask DNS yourself with <code>dig</code>:</p>
${code('Terminal', `<span class="c">$</span> dig +short shop.example.com
203.0.113.10`)}
<h3 id="dns-keeps">What DNS sees</h3>
<p>DNS only knows names and addresses. It never sees the request itself, so it holds no application data and a DNS problem never corrupts your orders, though it can make the whole shop unreachable.</p>
<h2 id="cdn">CDN</h2>
<p>A CDN is a network of servers spread across many countries, each holding copies of files that rarely change, such as images and stylesheets. The user downloads them from the nearest one instead of from your servers, which makes the page faster and takes load off your application. Order pages change for every user, so the CDN passes those through.</p>
<h3 id="cdn-old">Stale copies</h3>
<p>Because the CDN keeps each copy for a set time, a file you have just changed can stay old for users until that time runs out.</p>
${adm('note', 'Give every new version of a file a new name, for example styles.v42.css, so that the CDN treats it as a new file instead of serving the old copy.')}
<h2 id="lb">Load balancer</h2>
<p>Every request the CDN cannot answer reaches the load balancer, which picks one of your application servers and forwards it. Spreading requests this way lets you run several servers, and therefore lose one without losing the shop.</p>
<h3 id="health">Health checks</h3>
<p>To know which servers are ready, the load balancer sends each one a tiny request every few seconds, called a health check. A server that stops answering is taken out of rotation until it recovers.</p>
${adm('caution', 'Never stop all application servers at once: the load balancer would have nowhere to send requests and every user would get an error. Restart them one at a time.')}` },

  application: {
    line: 'The application server, the worker, and the logs they write.',
    title: 'Application blocks',
    lead: 'Past the edge, the request reaches your own code. Two blocks run it: the application server answers requests, and the worker does slow jobs afterwards.',
    body: () => `
<h2 id="app">Application server</h2>
<p>The application server is where the request for order 1042 is actually understood: it reads the path, fetches the data and builds the page. Most applications run two or more of them behind the load balancer, so one can crash or be updated while the others keep serving.</p>
<h3 id="stateless">Why it keeps nothing between requests</h3>
<p>Since the load balancer can send the next request to a different server, anything one server remembers is invisible to the others. That is why an application server keeps no data between requests and stores everything in the database, the cache or the queue instead.</p>
<h3 id="one-request">Inside the server</h3>
<p>The sequence below zooms in on the slow branch from the previous page and shows each message the server exchanges, in order.</p>
${figure('seq-app', 'One request inside the application server', 'Eight messages between the browser, the server, the cache and the database. Select a message to see what happens.')}
<h2 id="worker">Worker</h2>
<p>The worker handles the jobs that are too slow for a request, such as the confirmation email for order 1042. It takes tasks from the queue one by one, so the user never waits for it. Adding a task takes the application server a single line:</p>
${code('JavaScript', `<span class="c">// Add a task. A worker sends the email later.</span>
await queue.add('send-confirmation-email', { orderId: 1042 });`)}
<h3 id="retry">When a task fails</h3>
<p>A worker retries failed tasks, which means the same task can run twice. Write tasks so that a second run does no harm: the email code, for instance, should check whether the email for order 1042 has already gone out.</p>
<h2 id="logs">Logs</h2>
<p>Both blocks write a log, a timestamped list of what they did. When something breaks, the log is usually where you find out what happened just before.</p>
${adm('warning', 'Never write passwords, card numbers or health data to a log. Logs are read by many people and tools, and if this data leaks, real people can be harmed.')}` },

  database: {
    line: 'Where the main copy of the data lives, how the server reads it, and how to back it up.',
    title: 'Database',
    lead: 'On the slow branch, the application server asks the database for order 1042. The database holds the one copy of your data that must never be lost.',
    body: () => `
<h2 id="keeps">What the database keeps</h2>
<p>The database stores everything the application needs to remember: users, products, orders. Data sits in tables, and each row is one item, so order 1042 is one row in the <code>orders</code> table.</p>
<h2 id="query">Reading and writing</h2>
<p>The application server talks to the database with queries, requests written in a language such as SQL. This one fetches order 1042:</p>
${code('SQL', `SELECT id, status, total
FROM orders
WHERE id = 1042;`)}
<p>Writing a new order works the same way, with a different kind of query.</p>
<h2 id="which-store">Database, cache or queue</h2>
<p>The database is not the only block that keeps data: the cache and the queue do too, but each for a different purpose. The comparison shows where each one is strong.</p>
${figure('stores', 'Where to keep data', 'Three blocks, four criteria. Select a criterion to compare the three blocks.')}
<h2 id="backups">Backups</h2>
<p>A backup is a copy of all the data at a moment in time. If the database loses or corrupts data, the backup is how you get it back, so how often you take one decides how much you can lose. A common plan combines three kinds:</p>
<div class="tbl-wrap"><table class="tbl">
<caption>${EXAMPLE}<b>A backup plan</b>Adjust the times to how much data you can afford to lose.</caption>
<thead><tr><th scope="col">Backup</th><th scope="col">When</th><th scope="col" class="num">Keep for</th></tr></thead>
<tbody>
<tr><td>Full backup</td><td>Every day at 02:00</td><td class="num">30 days</td></tr>
<tr><td>Change log</td><td>Every 5 minutes</td><td class="num">7 days</td></tr>
<tr><td>Monthly copy</td><td>First day of the month</td><td class="num">12 months</td></tr>
</tbody></table></div>
<h3 id="test">Test the backup</h3>
<p>A backup you have never restored is a hope, not a backup. Once a month, prove that it works:</p>
<ol class="steps">
<li>Restore the latest backup on a test server.</li>
<li>Start the application on the test server.</li>
<li>Open a few orders and check that the data is correct.</li>
</ol>
${adm('caution', 'Do not stop the database while it is writing, or you can lose data. Stop the application servers and the workers first, then the database.')}` },

  cache: {
    line: 'Why the fast branch is fast, and how a copy goes stale.',
    title: 'Cache',
    lead: 'The cache is what makes the fast branch fast. It keeps copies of frequently read data in memory, which answers far quicker than the database on disk.',
    body: () => `
<h2 id="how">How the cache works</h2>
<p>The application server always asks the cache first. If the cache has the data, the server uses it and is done; if not, the server reads the database and stores a copy in the cache on the way back. Each copy is stored under a name, so reading order 1042 looks like this:</p>
${code('Cache command', `GET order:1042`)}
<h2 id="old">Why a copy goes stale</h2>
<p>The catch is that the copy can fall behind. If the order changes in the database, the cache keeps serving the old version until something removes it. The timeline follows one copy through its life.</p>
${figure('cache-life', 'The life of one copy in the cache', 'From the first write to the next read from the database, with an expiry time of 60 seconds. Select a moment to see what happens.')}
<p>There are two ways to keep stale copies in check, and most applications use both.</p>
<h3 id="expiry">Let it expire</h3>
<p>Every copy gets an expiry time, for example 60 seconds, after which the cache deletes it. The next request then reads fresh data from the database, so a copy is never more than 60 seconds out of date.</p>
<h3 id="delete">Delete it on change</h3>
<p>When the application changes order 1042, it also deletes the cached copy right away, so the next read fetches the new version instead of waiting for the expiry.</p>
${adm('caution', 'Do not clear the whole cache at once. Every request would fall through to the database at the same moment, and the database can slow down or stop under the load.')}
${adm('note', 'If the cache stops, no data is lost: it is all still in the database. The application is slower until the cache is back.')}` },

  queue: {
    line: 'How background tasks wait for a worker, and what their states mean.',
    title: 'Queue',
    lead: 'The confirmation email for order 1042 waits in the queue until a worker is free. The queue is what lets the request answer straight away.',
    body: () => `
<h2 id="how">How the queue works</h2>
<p>The application server adds tasks to the end of the queue, and workers take them from the front, so tasks run in the order they arrived. A worker removes a task only when it has finished it, which means a task is never lost just because a worker crashed halfway.</p>
<h2 id="states">The states of a task</h2>
<p>At any moment a task is in exactly one of four states. When you look at a queue dashboard, these are the numbers you see.</p>
<div class="tbl-wrap"><table class="tbl">
<caption><b>The states of a task</b>Each task has one state at a time.</caption>
<thead><tr><th scope="col">State</th><th scope="col">Meaning</th></tr></thead>
<tbody>
<tr><th scope="row">Waiting</th><td>In the queue, not yet taken by a worker.</td></tr>
<tr><th scope="row">Running</th><td>A worker is doing it now.</td></tr>
<tr><th scope="row">Complete</th><td>Done and removed from the queue.</td></tr>
<tr><th scope="row">Failed</th><td>Did not finish; the worker will retry it, up to 3 times.</td></tr>
</tbody></table></div>
<h2 id="stops">When the worker stops</h2>
<p>If every worker stops, nothing is lost: tasks simply pile up in the waiting state and run, in order, once a worker comes back.</p>
<h3 id="long-queue">A queue that keeps growing</h3>
<p>Watch the number of waiting tasks. A short spike is normal, but if it keeps climbing for a long time, the workers cannot keep up and you need another one.</p>
${adm('caution', 'Do not empty the queue to shorten it. Every task in it is real work, such as an email a customer is waiting for.')}` },

  safety: {
    line: 'Every WARNING, CAUTION and NOTE from the guide, in one place.',
    title: 'Safety notes',
    lead: 'The notes from every page, collected here so you can read them all before you touch a live system.',
    body: () => `
<h2 id="types">Types of notes</h2>
<p>The guide uses three kinds of notes, each with its own word and shape; the colour only helps.</p>
<dl class="kinds">
<div><dt><span aria-hidden="true">▲</span>WARNING</dt><dd>A risk to people.</dd></div>
<div><dt><span aria-hidden="true">◆</span>CAUTION</dt><dd>A risk to equipment or data.</dd></div>
<div><dt><span aria-hidden="true">●</span>NOTE</dt><dd>Something that helps you.</dd></div>
</dl>
<h2 id="data">Data</h2>
${adm('warning', 'Never write passwords, card numbers or health data to a log. Logs are read by many people and tools, and if this data leaks, real people can be harmed.')}
${adm('caution', 'Do not stop the database while it is writing, or you can lose data. Stop the application servers and the workers first, then the database.')}
<h2 id="changes">Changes to a live system</h2>
${adm('caution', 'Do not clear the whole cache at once. Every request would fall through to the database at the same moment, and the database can slow down or stop under the load.')}
${adm('caution', 'Never stop all application servers at once. Restart them one at a time.')}
${adm('note', 'The CDN can serve an old copy of a file for a few minutes after you change it. Give each new version a new name.')}
<h3 id="before-change">Before you change a live system</h3>
<ol class="steps">
<li>Check that you have a recent, tested backup of the database.</li>
<li>Tell the team what you are changing, and when.</li>
<li>Change one block at a time.</li>
<li>Watch the logs and the error rate for 10 minutes after the change.</li>
</ol>` },

  terms: {
    line: 'Every term in the guide, with the one meaning it has here.',
    title: 'Terms',
    lead: 'Each term has exactly one meaning in this guide. Come back here when a word is unclear.',
    body: () => `
<h2 id="blocks">Blocks</h2>
<dl class="kinds">
<div><dt>Application server</dt><dd>The server that runs the application's code and builds each response.</dd></div>
<div><dt>Browser</dt><dd>The program on the user's computer or phone that sends requests and shows pages.</dd></div>
<div><dt>Cache</dt><dd>Fast memory that holds short-lived copies of frequently read data.</dd></div>
<div><dt>CDN</dt><dd>Content delivery network: servers in many places that keep copies of files close to users.</dd></div>
<div><dt>Database</dt><dd>The block that keeps the main copy of the data.</dd></div>
<div><dt>DNS</dt><dd>Domain name system: turns a name such as shop.example.com into an IP address.</dd></div>
<div><dt>Load balancer</dt><dd>The block that sends each request to one of the application servers.</dd></div>
<div><dt>Queue</dt><dd>An ordered list of tasks waiting for a worker.</dd></div>
<div><dt>Worker</dt><dd>A program that takes tasks from the queue and does them in the background.</dd></div>
</dl>
<h2 id="messages">Messages</h2>
<dl class="kinds">
<div><dt>Query</dt><dd>A request for data that the application server sends to the database.</dd></div>
<div><dt>Request</dt><dd>A message from the browser asking for a page or for data.</dd></div>
<div><dt>Response</dt><dd>The message that goes back to the browser with the page or the data.</dd></div>
<div><dt>Task</dt><dd>A job for a worker, such as “send the confirmation email for order 1042”.</dd></div>
</dl>
<h2 id="other">Other terms</h2>
<dl class="kinds">
<div><dt>Backup</dt><dd>A copy of all the data at one moment in time.</dd></div>
<div><dt>Block</dt><dd>One part of the application with one job: a program, a server or a service.</dd></div>
<div><dt>Expiry time</dt><dd>How long the cache keeps a copy before deleting it.</dd></div>
<div><dt>Health check</dt><dd>A tiny request the load balancer sends to find out whether a server is ready.</dd></div>
<div><dt>IP address</dt><dd>The number that identifies a server on the network, such as 203.0.113.10.</dd></div>
<div><dt>Log</dt><dd>A timestamped list of what a block did.</dd></div>
<div><dt>Zone</dt><dd>A band of the map that shows where a block runs: client, edge, application or data.</dd></div>
</dl>` }
};

/* Sidebar contents: groups, items, nested folders (two levels) */
const NAV = [
  { group: 'Start here', items: [{ page: 'introduction' }] },
  { group: 'Understand', items: [{ page: 'main-blocks' }, { page: 'request-path' }] },
  { group: 'Blocks in detail', items: [{ page: 'edge' }, { page: 'application' },
    { folder: 'Data', id: 'data', open: true, items: [{ page: 'database' },
      { folder: 'Temporary data', id: 'temp', items: [{ page: 'cache' }, { page: 'queue' }] }] }] },
  { group: 'Reference', items: [{ page: 'safety' }, { page: 'terms' }] }
];

/* ---------- diagram data ---------- */
const DIAGRAMS = {
  'seq-app': {
    type: 'sequence', title: 'One request inside the application server',
    parts: [{ id: 'br', label: 'Browser' }, { id: 'app', label: 'Application server' }, { id: 'cache', label: 'Cache' }, { id: 'db', label: 'Database' }],
    msgs: [
      { from: 'br', to: 'app', text: 'GET /orders/1042', what: 'The request arrives from the load balancer. The server reads the path and finds the order number.' },
      { from: 'app', to: 'cache', text: 'get order 1042', what: 'The server asks the cache for a copy of the order first, because the cache is faster than the database.' },
      { from: 'cache', to: 'app', text: 'not found', reply: true, what: 'The cache has no copy. This is a cache miss: the server must read the database.' },
      { from: 'app', to: 'db', text: 'SELECT … WHERE id = 1042', what: 'The server sends a query to the database for order 1042.' },
      { from: 'db', to: 'app', text: 'order 1042', reply: true, what: 'The database sends back the order. This is the slow part of the request.' },
      { from: 'app', to: 'cache', text: 'set order 1042, 60 s', what: 'The server keeps a copy in the cache for 60 seconds. The next request for this order uses the copy.' },
      { from: 'app', to: 'app', text: 'makes the page', what: 'The server puts the order data in the HTML page.' },
      { from: 'app', to: 'br', text: 'HTML page', reply: true, what: 'The response goes back through the load balancer and the CDN to the browser.' }
    ]
  },
  'cache-life': {
    type: 'timeline', title: 'The life of one copy in the cache',
    items: [
      { date: '0 s', title: 'Copy written', what: 'After a read from the database, the server writes a copy of order 1042 in the cache, with an expiry time of 60 seconds.' },
      { date: '5 s', title: 'Read: hit', what: 'A new request finds the copy. The server does not read the database.' },
      { date: '40 s', title: 'Read: hit', what: 'The copy is still valid. If the order changed in the database, this copy is now old.' },
      { date: '60 s', title: 'Copy expires', what: 'The cache deletes the copy. Nothing else happens until the next request.' },
      { date: '75 s', title: 'Read: miss', what: 'The next request does not find a copy. The server reads the database and writes a new copy.' }
    ]
  },
  stores: {
    type: 'compare', title: 'Where to keep data',
    options: [{ id: 'db', label: 'Database', sub: 'the main copy' }, { id: 'cache', label: 'Cache', sub: 'fast copies' }, { id: 'queue', label: 'Queue', sub: 'tasks in order' }],
    rows: [
      { label: 'After a restart', what: 'Does the data stay when the block stops and starts again?', cells: {
        db: ['good', 'It writes the data to disk.', 'Data kept'], cache: ['bad', 'It keeps data in memory only.', 'Can be empty'], queue: ['mid', 'Until a worker takes the task.', 'Usually kept'] } },
      { label: 'Speed', what: 'How fast the application server can read or write.', cells: {
        db: ['mid', 'Disk is slower than memory.', 'Fast'], cache: ['good', 'The data is in memory.', 'Very fast'], queue: ['good', 'Adding and taking a task is cheap.', 'Fast'] } },
      { label: 'Find data', what: 'Can you search and filter the data?', cells: {
        db: ['good', 'Queries search and filter on any field.', 'Any query'], cache: ['bad', 'You must know the exact name of the copy.', 'By key only'], queue: ['bad', 'You only get the next task.', 'Next task only'] } },
      { label: 'If it stops', what: 'What happens to the application when the block stops.', cells: {
        db: ['bad', 'Nobody can read or write data.', 'App stops'], cache: ['mid', 'Pages are slower, no data is lost.', 'App slower'], queue: ['mid', 'New tasks cannot go in.', 'Tasks wait'] } }
    ],
    when: { db: 'The main copy of your data.', cache: 'Copies of data that you read frequently.', queue: 'Work that can happen later.' }
  },
  arch: {
    title: 'The main blocks of a web application', nodeW: 204, nodeH: 74, w: 856, h: 472,
    hint: 'Drag to move · Ctrl or ⌘ + scroll to zoom · Tab and arrow keys to move between blocks',
    zones: [
      { id: 'client', title: 'Client', x: 0, y: 0, w: 856, h: 106 },
      { id: 'edge', title: 'Edge', x: 0, y: 122, w: 856, h: 106 },
      { id: 'app', title: 'Application', x: 0, y: 244, w: 856, h: 106 },
      { id: 'data', title: 'Data', x: 0, y: 366, w: 856, h: 106 }
    ],
    nodes: [
      { id: 'browser', zone: 'client', x: 384, y: 16, title: 'Browser', sub: 'Shows the page', what: 'The browser is the program on the computer or phone of the user. It sends requests and shows the pages that come back. It keeps some files for a short time, so that it does not ask for them again.', fields: [['Keeps data', 'A copy of files, for a short time.']] },
      { id: 'dns', zone: 'edge', x: 140, y: 138, title: 'DNS', sub: 'Finds the server address', what: 'DNS changes a name, for example shop.example.com, into an IP address. The browser needs this address to send a request. DNS does not see the request itself.', fields: [['Keeps data', 'No application data.']] },
      { id: 'cdn', zone: 'edge', x: 384, y: 138, title: 'CDN', sub: 'Keeps copies of files', what: 'A CDN is a set of servers in many countries. Each server keeps copies of files that do not change frequently, for example images and styles. The user gets these files from a server that is near.', fields: [['Keeps data', 'A copy of files, for a short time.']] },
      { id: 'lb', zone: 'edge', x: 628, y: 138, title: 'Load balancer', sub: 'Shares the requests', what: 'The load balancer receives each request that the CDN cannot answer. It sends the request to one application server that is ready. If an application server stops, the load balancer stops sending requests to it.', fields: [['Keeps data', 'No.']] },
      { id: 'app', zone: 'app', x: 384, y: 260, title: 'Application server', sub: 'Runs the code', what: 'The application server runs the code of the application. It reads the request, gets the data and makes the response. Most applications have two or more application servers.', fields: [['Keeps data', 'No. It must not keep data between two requests.']] },
      { id: 'worker', zone: 'app', x: 628, y: 260, title: 'Worker', sub: 'Does long tasks later', what: 'The worker does tasks that take a long time, for example emails and reports. It gets each task from the queue. The user does not wait for the worker.', fields: [['Keeps data', 'No.']] },
      { id: 'cache', zone: 'data', x: 140, y: 382, title: 'Cache', sub: 'Keeps frequent data', what: 'The cache keeps data that the application reads frequently. It keeps this data in memory, and memory is faster than a disk. If the cache stops, you do not lose data.', fields: [['Keeps data', 'A copy, for a short time.']] },
      { id: 'db', zone: 'data', x: 384, y: 382, title: 'Database', sub: 'Keeps the data', what: 'The database keeps the data of the application, for example users and orders. It is the one block that must not lose data. Make a backup of the database every day.', fields: [['Keeps data', 'Yes. The main copy of the data.']] },
      { id: 'queue', zone: 'data', x: 628, y: 382, title: 'Queue', sub: 'Holds tasks in order', what: 'The queue keeps a list of tasks for the worker. The application server adds a task. The worker removes the task when it is complete. If the worker stops, the tasks stay in the queue.', fields: [['Keeps data', 'Yes, until the worker completes the task.']] }
    ],
    edges: [
      { from: 'browser', to: 'dns', text: 'asks for the IP address' },
      { from: 'browser', to: 'cdn', text: 'sends the request' },
      { from: 'cdn', to: 'lb', text: 'sends the requests that it cannot answer' },
      { from: 'lb', to: 'app', text: 'sends each request to one server' },
      { from: 'app', to: 'cache', text: 'reads frequent data' },
      { from: 'app', to: 'db', text: 'reads and writes data' },
      { from: 'app', to: 'queue', text: 'adds a task' },
      { from: 'queue', to: 'worker', text: 'gives the next task' }
    ]
  },
  flow: {
    title: 'The path of one request', nodeW: 240, nodeH: 82, w: 780, h: 754,
    hint: 'Drag to move · Ctrl or ⌘ + scroll to zoom · Tab and arrow keys to move between steps',
    kinds: { start: { label: 'Start' }, step: { label: 'Step' }, decision: { label: 'Decision' }, end: { label: 'End' } },
    nodes: [
      { id: 's1', kind: 'start', x: 270, y: 0, title: 'The user opens the order page', what: 'The user selects the link to order 1042. The browser makes a request.', fields: [['Needs', 'The address of the page.']] },
      { id: 's2', kind: 'step', x: 270, y: 112, title: 'The edge passes the request on', sub: 'DNS, CDN, load balancer', what: 'DNS gives the IP address. The CDN does not keep order pages, so it sends the request to the load balancer. The load balancer selects an application server.', fields: [['Time', 'About 35 ms (example, not measured).']] },
      { id: 's3', kind: 'step', x: 270, y: 224, title: 'The server reads the request', sub: 'Application server', what: 'The application server reads the path /orders/1042 and finds the order number.', fields: [['Needs', 'A server that is ready.']] },
      { id: 'd1', kind: 'decision', x: 270, y: 336, title: 'Is the order in the cache?', what: 'The application server asks the cache for order 1042. The answer decides the branch.', fields: [['Yes', 'Fast branch: use the copy.'], ['No', 'Slow branch: read the database.']] },
      { id: 'hit', kind: 'step', x: 0, y: 448, title: 'Use the copy from the cache', sub: 'Fast branch', what: 'The cache sends its copy of the order. The application server does not read the database.', fields: [['Time', 'About 2 ms (example, not measured).']] },
      { id: 'miss', kind: 'step', x: 540, y: 448, title: 'Read the order from the database', sub: 'Slow branch', what: 'The application server sends a query to the database and gets the order.', fields: [['Time', 'About 80 ms (example, not measured).']] },
      { id: 'store', kind: 'step', x: 540, y: 560, title: 'Keep a copy in the cache', sub: 'Slow branch', what: 'The application server keeps a copy of the order in the cache. The next request for this order uses the fast branch.', fields: [['Expiry time', '60 seconds (example).']] },
      { id: 'end', kind: 'end', x: 270, y: 672, title: 'The browser shows the page', what: 'The application server makes the page. The response goes back through the load balancer and the CDN to the browser.', fields: [['Total', '72 ms or 153 ms (example, not measured).']] }
    ],
    edges: [
      { from: 's1', to: 's2' }, { from: 's2', to: 's3' }, { from: 's3', to: 'd1' },
      { from: 'd1', to: 'hit', label: 'yes', fs: 'l', ts: 't' }, { from: 'd1', to: 'miss', label: 'no', fs: 'r', ts: 't' },
      { from: 'miss', to: 'store' }, { from: 'hit', to: 'end', fs: 'b', ts: 'l' }, { from: 'store', to: 'end', fs: 'b', ts: 'r' }
    ]
  }
};
