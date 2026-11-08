/* GUIDE CONTENT. The only file to write for a new guide.
   Contract: GUIDE, PAGES, NAV, DIAGRAMS. See references/content.md. */
const GUIDE = { title: 'How a web application works', lang: 'en', meta: ['Beginner, no code', '30 minutes'], updated: '8 November 2026', updatedISO: '2026-11-08' };


const PAGES = {
  introduction: {
    line: 'What this guide is, who it is for, and how to read it.',
    title: 'How a web application works', nav: 'Introduction', home: true,
    lead: 'This guide shows the main blocks of a web application. It tells you what each block does, and how a request moves from block to block.',
    body: () => `
<h2 id="about">About this guide</h2>
<p>A web application is a program that you use through a web browser. Online shops, email and maps are web applications.</p>
<p>A web application does not run on one computer. It runs on a set of blocks. Each block does one job. The blocks send data to each other through the network.</p>
<p>This guide gives the name and the job of each main block. It also shows the path of one request, from the browser to the database and back.</p>
<h2 id="who">Who this guide is for</h2>
<ul>
<li>People who start to work on a web application, for example a new developer or a support engineer.</li>
<li>Product people who want to understand the words of the team.</li>
<li>Teachers who show the blocks to a class. The text and the diagrams are large, so you can show them on a projector.</li>
</ul>
<h2 id="before">Before you start</h2>
<dl class="meta">
<div><dt>Level</dt><dd>Beginner. No code.</dd></div>
<div><dt>Reading time</dt><dd>30 minutes, all pages</dd></div>
<div><dt>Last updated</dt><dd><time datetime="${GUIDE.updatedISO}">${GUIDE.updated}</time></dd></div>
<div><dt>Language</dt><dd>Simple English, in STE style</dd></div>
</dl>
${adm('note', 'This guide uses one term for one thing. For example, it always says “application server”. It never says “back end”. The page <a href="#/terms">Terms</a> gives the meaning of each term.')}
<h2 id="contents">Contents</h2>
<p>The guide has ten pages in four groups. Read the pages in order, or go directly to one page.</p>
${contentsIndex()}` },

  'main-blocks': {
    line: 'The nine main blocks in one diagram, and the four zones.',
    title: 'The main blocks',
    lead: 'A web application is a set of blocks. Each block does one job. This page shows the nine main blocks in one diagram.',
    body: () => `
<h2 id="what">What a block is</h2>
<p>A block is a program or a server with one job. The blocks send data to each other through the network.</p>
<p>Small applications put some blocks on one server. Large applications have many copies of each block. The jobs of the blocks stay the same.</p>
<h2 id="diagram">The diagram</h2>
<p>The diagram shows the nine blocks in four zones. The arrows show where a request or a task goes.</p>
${figure('arch', 'The main blocks of a web application', 'Nine blocks in four zones. Select a block to see its job, if it keeps data, and its connections.')}
<h3 id="use">How to use the diagram</h3>
<ul>
<li>Select a block to see its job and its connections.</li>
<li>Drag the background to move the diagram. Use the + and − buttons to zoom.</li>
<li>Use Tab to go from block to block. Use the arrow keys to go to the nearest block in that direction. Push Enter to open the details.</li>
<li>Select <strong>Full screen</strong> to show the diagram on all of the screen, for example on a projector.</li>
<li>The colour, the shape and the name of a block always go together. The colour never shows the meaning alone.</li>
</ul>
<h2 id="zones">The four zones</h2>
<p>Each block is in one zone. The zone tells you where the block runs.</p>
<h3 id="client">Client</h3>
<p>The client zone is the computer or the phone of the user. The browser runs here.</p>
<h3 id="edge-zone">Edge</h3>
<p>The edge zone is between the user and your servers. DNS, the CDN and the load balancer are here. They find your servers, keep copies of files and share the requests.</p>
<h3 id="app-zone">Application</h3>
<p>The application zone runs your code. The application server and the worker are here.</p>
<h3 id="data-zone">Data</h3>
<p>The data zone keeps the data. The database, the cache and the queue are here.</p>
<h2 id="keeps">Which blocks keep data</h2>
<div class="tbl-wrap"><table class="tbl">
<caption><b>Which blocks keep data</b>And what happens when the block stops.</caption>
<thead><tr><th scope="col">Block</th><th scope="col">Keeps data</th><th scope="col">If the block stops</th></tr></thead>
<tbody>
<tr><th scope="row">Database</th><td>Yes. The main copy of the data.</td><td>You cannot read or write data.</td></tr>
<tr><th scope="row">Queue</th><td>Yes, until a worker completes the task.</td><td>New tasks cannot go in.</td></tr>
<tr><th scope="row">Cache</th><td>A copy, for a short time.</td><td>The application is slower. You do not lose data.</td></tr>
<tr><th scope="row">CDN, browser</td><td>A copy of files, for a short time.</td><td>Pages load more slowly.</td></tr>
<tr><th scope="row">DNS, load balancer, application server, worker</th><td>No.</td><td>Requests or tasks stop. You do not lose data.</td></tr>
</tbody></table></div>
${adm('caution', 'The database is the one block that must not lose data. Make a backup of the database every day. The page <a href="#/database/backups">Database</a> gives the procedure.')}` },

  'request-path': {
    line: 'One request, step by step, with a decision and two branches.',
    title: 'The path of a request',
    lead: 'What happens between a click and the page. This page follows one request through the blocks, and back.',
    body: () => `
<h2 id="example">The example</h2>
<p>In this example, a user opens the page of order 1042 in an online shop. The browser sends this request:</p>
${code('HTTP request', `GET /orders/1042 HTTP/1.1
Host: shop.example.com
Accept: text/html
Accept-Language: en`)}
<p>The first line gives the method and the path. <code>GET</code> means “send me this page”. The other lines give more information about the request.</p>
<h2 id="flow">The flow</h2>
<p>The diagram shows the path of the request. At the decision, the path has two branches. The application server reads the order from the cache, or from the database.</p>
${figure('flow', 'The path of one request', 'Eight steps and one decision. Select a step to see what it does and what it needs.')}
<h2 id="steps">Step by step</h2>
<ol class="steps">
<li>The user selects the link to the order. The browser asks DNS for the IP address of shop.example.com.</li>
<li>The browser sends the request to the CDN. The CDN does not keep a copy of order pages, so it sends the request to the load balancer.</li>
<li>The load balancer selects an application server that is ready. It sends the request to that server.</li>
<li>The application server reads the request. It looks for order 1042 in the cache.</li>
<li>The application server makes the page. The response goes back to the browser on the same path.</li>
</ol>
<h3 id="hit">When the order is in the cache</h3>
<p>The application server uses the copy from the cache. It does not read the database. This is the fast branch.</p>
<h3 id="miss">When the order is not in the cache</h3>
<p>The application server reads the order from the database. Then it keeps a copy in the cache for the next request. This is the slow branch.</p>
<h2 id="time">Time for each part</h2>
<div class="tbl-wrap"><table class="tbl">
<caption>${EXAMPLE}<b>Time for each part of one request</b>The numbers only show the size of each part.</caption>
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
${chart({ title: 'Total time of one request', desc: 'The data part makes the difference between the two branches.', unit: 'ms', illustrative: true,
  series: [{ key: 'edge', label: 'Edge', color: 'c1' }, { key: 'server', label: 'Server', color: 'c2' }, { key: 'data', label: 'Data', color: 'c3' }],
  rows: [{ label: 'Fast branch', values: { edge: 35, server: 35, data: 2 } }, { label: 'Slow branch', values: { edge: 35, server: 35, data: 83 } }] })}
${adm('note', 'These numbers are an example. They are not measured data. Measure your own application before you make a decision.')}
<h2 id="long">Long tasks</h2>
<p>Some tasks take a long time, for example a confirmation email. The application server does not do these tasks during the request. It adds a task to the queue and sends the response immediately. Then a worker gets the task from the queue and does it.</p>
<p>Because of this, the user does not wait for the long task.</p>
${adm('caution', 'Do not send an email or make a report during the request. If the task is slow, all of the request is slow. Put the task in the queue.')}` },

  edge: {
    line: 'DNS, the CDN and the load balancer.',
    title: 'Edge blocks',
    lead: 'DNS, the CDN and the load balancer. These blocks are between the user and your servers.',
    body: () => `
<h2 id="dns">DNS</h2>
<p>DNS changes a name into an IP address. For example, it changes shop.example.com into 203.0.113.10. The browser needs this address to send a request.</p>
<p>You can ask DNS for an address with the <code>dig</code> command:</p>
${code('Terminal', `<span class="c">$</span> dig +short shop.example.com
203.0.113.10`)}
<h3 id="dns-keeps">What DNS keeps</h3>
<p>DNS keeps the names and the addresses. It does not see the request, and it does not keep application data.</p>
<h2 id="cdn">CDN</h2>
<p>A CDN is a set of servers in many countries. Each server keeps copies of files that do not change frequently, for example images and styles. The user gets these files from a server that is near. This makes the page faster.</p>
<h3 id="cdn-old">Old copies</h3>
<p>The CDN keeps each copy for a set time.</p>
${adm('note', 'After you change a file, users can see the old copy for some minutes. Give each new version of a file a new name, for example styles.v42.css.')}
<h2 id="lb">Load balancer</h2>
<p>The load balancer receives each request that the CDN cannot answer. It sends the request to one application server that is ready.</p>
<h3 id="health">Health checks</h3>
<p>The load balancer sends a small request to each application server every few seconds. This is a health check. If a server does not answer, the load balancer stops sending requests to it.</p>
${adm('caution', 'Do not stop all application servers at the same time. The load balancer then has no server for the requests, and users get errors. Stop and start one server at a time.')}` },

  application: {
    line: 'The application server, the worker and the logs.',
    title: 'Application blocks',
    lead: 'The application server runs your code and makes each response. The worker does long tasks later.',
    body: () => `
<h2 id="app">Application server</h2>
<p>The application server reads the request, gets the data and makes the response. Most applications have two or more application servers. Then one server can stop, and the application continues to work.</p>
<h3 id="stateless">Keep no data in the server</h3>
<p>An application server must not keep data between two requests. The next request can go to a different server. Keep the data in the database, the cache or the queue.</p>
<h3 id="one-request">One request inside the server</h3>
<p>The sequence shows who talks to whom, in order, when the order is not in the cache.</p>
${figure('seq-app', 'One request inside the application server', 'Eight messages between the browser, the server, the cache and the database. Select a message to see what happens.')}
<h2 id="worker">Worker</h2>
<p>The worker does tasks that take a long time, for example emails and reports. It gets each task from the queue. The user does not wait for the worker.</p>
<p>The application server adds a task to the queue with one line of code. This example is in JavaScript:</p>
${code('JavaScript', `<span class="c">// Add a task. A worker sends the email later.</span>
await queue.add('send-confirmation-email', { orderId: 1042 });`)}
<h3 id="retry">If a task fails</h3>
<p>The worker can try the task again. Make sure that a task can run two times without a problem. For example, the worker must not send two emails for one order.</p>
<h2 id="logs">Logs</h2>
<p>Each application server and each worker writes a log. A log is a list of events with the time of each event. Logs help you find the cause of a problem.</p>
${adm('warning', 'Do not write passwords, card numbers or health data in logs. Many people and tools can read logs. If this data becomes public, people can be harmed.')}` },

  database: {
    line: 'The main copy of the data, queries and backups.',
    title: 'Database',
    lead: 'The database keeps the main copy of the data. It is the one block that must not lose data.',
    body: () => `
<h2 id="keeps">What the database keeps</h2>
<p>The database keeps the data of the application, for example users, products and orders. The data is in tables. Each row of a table is one item, for example one order.</p>
<h2 id="query">Read and write data</h2>
<p>The application server sends a query to the database. A query is a request for data. This query reads order 1042:</p>
${code('SQL', `SELECT id, status, total
FROM orders
WHERE id = 1042;`)}
<p>A query can also write data, for example a new order.</p>
<h2 id="which-store">Database, cache or queue</h2>
<p>The three blocks all keep data, but for different jobs.</p>
${figure('stores', 'Where to keep data', 'Three blocks, four criteria. Select a criterion to compare the three blocks.')}
<h2 id="backups">Backups</h2>
<p>A backup is a copy of all of the data at one time. If the database loses data, you can put the data back from the backup.</p>
<div class="tbl-wrap"><table class="tbl">
<caption>${EXAMPLE}<b>A backup plan</b>Change the times to agree with your application.</caption>
<thead><tr><th scope="col">Backup</th><th scope="col">When</th><th scope="col" class="num">Keep for</th></tr></thead>
<tbody>
<tr><td>Full backup</td><td>Every day at 02:00</td><td class="num">30 days</td></tr>
<tr><td>Change log</td><td>Every 5 minutes</td><td class="num">7 days</td></tr>
<tr><td>Monthly copy</td><td>First day of the month</td><td class="num">12 months</td></tr>
</tbody></table></div>
<h3 id="test">Test the backup</h3>
<ol class="steps">
<li>Each month, put a backup on a test server.</li>
<li>Start the application on the test server.</li>
<li>Open some orders and make sure that the data is correct.</li>
</ol>
${adm('caution', 'Do not stop the database while it writes data. You can lose data. First stop the application servers and the workers. Then stop the database.')}` },

  cache: {
    line: 'Fast copies of frequent data, and when a copy is too old.',
    title: 'Cache',
    lead: 'The cache keeps a copy of frequent data in memory. Memory is faster than a disk.',
    body: () => `
<h2 id="how">How the cache works</h2>
<p>The application server asks the cache for the data first. If the cache has the data, the application server uses it. If the cache does not have the data, the application server reads the database and keeps a copy in the cache.</p>
<p>Each copy has a name. This command reads the copy of order 1042:</p>
${code('Cache command', `GET order:1042`)}
<h2 id="old">When a copy is too old</h2>
${figure('cache-life', 'The life of one copy in the cache', 'From the first write to the next read from the database, with an expiry time of 60 seconds. Select a moment to see what happens.')}
<p>The data in the database can change. Then the copy in the cache is old.</p>
<h3 id="expiry">Expiry time</h3>
<p>Each copy has an expiry time, for example 60 seconds. After this time, the cache deletes the copy. The next request reads the new data from the database.</p>
<h3 id="delete">Delete a copy after a change</h3>
<p>When the application changes an order, it also deletes the copy of that order in the cache.</p>
${adm('caution', 'Do not clear all of the cache at one time. All requests then go to the database. The database can become too slow and stop.')}
${adm('note', 'If the cache stops, you do not lose data. The data is still in the database. The application is slower until the cache starts again.')}` },

  queue: {
    line: 'Tasks that wait for a worker, and their states.',
    title: 'Queue',
    lead: 'The queue keeps a list of tasks that wait for a worker.',
    body: () => `
<h2 id="how">How the queue works</h2>
<p>The application server adds a task to the end of the queue. The worker gets the task at the start of the queue. When the task is complete, the worker removes it.</p>
<h2 id="states">The states of a task</h2>
<div class="tbl-wrap"><table class="tbl">
<caption><b>The states of a task</b>Each task has one state at a time.</caption>
<thead><tr><th scope="col">State</th><th scope="col">Meaning</th></tr></thead>
<tbody>
<tr><th scope="row">Waiting</th><td>The task is in the queue. No worker has it.</td></tr>
<tr><th scope="row">Running</th><td>A worker does the task.</td></tr>
<tr><th scope="row">Complete</th><td>The worker completed the task and removed it.</td></tr>
<tr><th scope="row">Failed</th><td>The task did not complete. The worker tries again, up to 3 times.</td></tr>
</tbody></table></div>
<h2 id="stops">If the worker stops</h2>
<p>If the worker stops, the tasks stay in the queue. They wait. When the worker starts again, it does the tasks in order.</p>
<h3 id="long-queue">A queue that becomes long</h3>
<p>Look at the number of waiting tasks. If the number increases for a long time, the workers are too slow. Add one more worker.</p>
${adm('caution', 'Do not delete the queue to make it short. You lose the tasks, for example the emails to your users.')}` },

  safety: {
    line: 'All WARNING, CAUTION and NOTE items in one page.',
    title: 'Safety notes',
    lead: 'What can go wrong, and how to prevent it. Read these notes before you change a live system.',
    body: () => `
<h2 id="types">Types of notes</h2>
<p>This guide uses three types of notes. Each type has a word and a shape. The colour only helps.</p>
<dl class="kinds">
<div><dt><span aria-hidden="true">▲</span>WARNING</dt><dd>There is a risk to people.</dd></div>
<div><dt><span aria-hidden="true">◆</span>CAUTION</dt><dd>There is a risk to equipment or data.</dd></div>
<div><dt><span aria-hidden="true">●</span>NOTE</dt><dd>Information that helps you.</dd></div>
</dl>
<h2 id="data">Data</h2>
${adm('warning', 'Do not write passwords, card numbers or health data in logs. Many people and tools can read logs. If this data becomes public, people can be harmed.')}
${adm('caution', 'Do not stop the database while it writes data. You can lose data. First stop the application servers and the workers. Then stop the database.')}
<h2 id="changes">Changes to a live system</h2>
${adm('caution', 'Do not clear all of the cache at one time. All requests then go to the database. The database can become too slow and stop.')}
${adm('caution', 'Do not stop all application servers at the same time. Stop and start one server at a time.')}
${adm('note', 'The CDN can keep an old copy of a file for some minutes. After you change a file, users can see the old file for a short time.')}
<h3 id="before-change">Before you change a live system</h3>
<ol class="steps">
<li>Make sure that you have a backup of the database.</li>
<li>Tell the team what you change, and when.</li>
<li>Change one block at a time.</li>
<li>Look at the logs and the errors for 10 minutes after the change.</li>
</ol>` },

  terms: {
    line: 'The meaning of each term in this guide.',
    title: 'Terms',
    lead: 'Each term has one meaning in this guide.',
    body: () => `
<h2 id="blocks">Blocks</h2>
<dl class="kinds">
<div><dt>Application server</dt><dd>The server that runs the code of the application and makes each response.</dd></div>
<div><dt>Browser</dt><dd>The program on the computer or phone of the user. It sends requests and shows pages.</dd></div>
<div><dt>Cache</dt><dd>A fast memory that keeps a copy of frequent data for a short time.</dd></div>
<div><dt>CDN</dt><dd>Content delivery network. A set of servers in many places. They keep copies of files near the users.</dd></div>
<div><dt>Database</dt><dd>The block that keeps the main copy of the data.</dd></div>
<div><dt>DNS</dt><dd>Domain name system. It changes a name, for example shop.example.com, into an IP address.</dd></div>
<div><dt>Load balancer</dt><dd>The block that sends each request to one of the application servers.</dd></div>
<div><dt>Queue</dt><dd>A list of tasks that wait for a worker.</dd></div>
<div><dt>Worker</dt><dd>A program that does long tasks from the queue.</dd></div>
</dl>
<h2 id="messages">Messages</h2>
<dl class="kinds">
<div><dt>Query</dt><dd>A request for data that the application server sends to the database.</dd></div>
<div><dt>Request</dt><dd>A message from the browser. It asks for a page or for data.</dd></div>
<div><dt>Response</dt><dd>The message that comes back to the browser. It contains the page or the data.</dd></div>
<div><dt>Task</dt><dd>A job for a worker, for example “send the confirmation email for order 1042”.</dd></div>
</dl>
<h2 id="other">Other terms</h2>
<dl class="kinds">
<div><dt>Backup</dt><dd>A copy of all of the data at one time.</dd></div>
<div><dt>Block</dt><dd>One part of the application with one job. A block is a program, a server or a service.</dd></div>
<div><dt>Expiry time</dt><dd>The time after which the cache deletes a copy.</dd></div>
<div><dt>Health check</dt><dd>A small request that the load balancer sends to find out if a server is ready.</dd></div>
<div><dt>IP address</dt><dd>The number that identifies a server on the network, for example 203.0.113.10.</dd></div>
<div><dt>Log</dt><dd>A list of events with the time of each event.</dd></div>
<div><dt>Zone</dt><dd>A part of the diagram that shows where a block runs: client, edge, application or data.</dd></div>
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
        db: ['good', 'Yes. It writes the data to disk.'], cache: ['bad', 'No. A restart can empty it.'], queue: ['mid', 'Usually, until a worker takes the task.'] } },
      { label: 'Speed', what: 'How fast the application server can read or write.', cells: {
        db: ['mid', 'Fast, but slower than memory.'], cache: ['good', 'Very fast: the data is in memory.'], queue: ['good', 'Fast to add and take a task.'] } },
      { label: 'Find data', what: 'Can you search and filter the data?', cells: {
        db: ['good', 'Yes. Queries find and filter any data.'], cache: ['bad', 'Only by key.'], queue: ['bad', 'Only the next task.'] } },
      { label: 'If it stops', what: 'What happens to the application when the block stops.', cells: {
        db: ['bad', 'You cannot read or write data.'], cache: ['mid', 'The application is slower. You do not lose data.'], queue: ['mid', 'New tasks cannot go in.'] } }
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
