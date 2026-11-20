document.addEventListener('DOMContentLoaded', function () {
  // --- 1. Live Glossary Search (Whole-Word Boundary) ---
  var glossarySearch = document.getElementById('glossarySearch');
  var glossaryNoResults = document.getElementById('glossaryNoResults');
  var glossaryOverlay = document.getElementById('glossaryOverlay');

  function filterGlossary() {
    if (!glossarySearch) return;
    var query = glossarySearch.value.trim();
    var cards = glossaryOverlay.querySelectorAll('.term-card');
    var cats = glossaryOverlay.querySelectorAll('.glossary-cat');
    var visibleCount = 0;

    if (!query) {
      cards.forEach(function (c) { c.classList.remove('hidden'); });
      cats.forEach(function (cat) { cat.classList.remove('hidden'); });
      if (glossaryNoResults) glossaryNoResults.classList.add('hidden');
      return;
    }

    var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var regex = new RegExp('\\b' + escaped, 'i');

    cards.forEach(function (card) {
      var match = regex.test(card.textContent);
      card.classList.toggle('hidden', !match);
      if (match) visibleCount++;
    });

    cats.forEach(function (cat) {
      var next = cat.nextElementSibling;
      var hasVisible = false;
      while (next && !next.classList.contains('glossary-cat')) {
        if (next.classList.contains('term-card') && !next.classList.contains('hidden')) {
          hasVisible = true;
          break;
        }
        next = next.nextElementSibling;
      }
      cat.classList.toggle('hidden', !hasVisible);
    });

    if (glossaryNoResults) {
      glossaryNoResults.classList.toggle('hidden', visibleCount > 0);
    }
  }

  if (glossarySearch) {
    glossarySearch.addEventListener('input', filterGlossary);
  }

  // --- 2. Encapsulation Protocol Definitions ---
  var encapData = {
    'vxlan': {
      overhead: '+50 Bytes (L2–VXLAN)',
      transport: 'UDP Port 4789',
      underlayMtu: '1550+ Bytes (Jumbo 9000)',
      segmentId: '24-Bit VNI (16.7M) + 16-Bit SGT',
      headers: [
        { name: 'Outer Ethernet', bytes: '14 Bytes', cls: 'bg-outer-l2' },
        { name: 'Outer IPv4 (VTEP)', bytes: '20 Bytes', cls: 'bg-outer-ip' },
        { name: 'Outer UDP (4789)', bytes: '8 Bytes', cls: 'bg-udp' },
        { name: 'VXLAN-GPO (VNI + SGT)', bytes: '8 Bytes', cls: 'bg-tunnel' },
        { name: 'Original Inner Frame', bytes: 'Up to 1500B', cls: 'bg-inner' }
      ],
      detail: '<strong>VXLAN-GPO (Cisco SD-Access Data Plane):</strong> Encapsulates the entire original Layer 2 Ethernet frame inside UDP port <code>4789</code>. The 8-byte VXLAN-GPO header carries both the <strong>24-bit VNI</strong> (Virtual Network Identifier for Layer 2/3 VN isolation) and the <strong>16-bit SGT</strong> (Scalable Group Tag) for Security Group ACL enforcement at the egress edge switch.'
    },
    'lisp': {
      overhead: '+36 Bytes (IP–LISP)',
      transport: 'UDP 4341 (Data) / 4342 (Ctrl)',
      underlayMtu: '1536+ Bytes',
      segmentId: '24-Bit Instance ID (IID)',
      headers: [
        { name: 'Outer Ethernet', bytes: '14 Bytes', cls: 'bg-outer-l2' },
        { name: 'Outer IPv4 (RLOC)', bytes: '20 Bytes', cls: 'bg-outer-ip' },
        { name: 'Outer UDP (4341)', bytes: '8 Bytes', cls: 'bg-udp' },
        { name: 'LISP Header (IID)', bytes: '8 Bytes', cls: 'bg-tunnel' },
        { name: 'Inner IP Packet (EID)', bytes: 'Up to 1500B', cls: 'bg-inner' }
      ],
      detail: '<strong>LISP (Locator/ID Separation Protocol):</strong> Unlike VXLAN (which wraps an entire Layer 2 frame), standard LISP encapsulates an <strong>IP packet (EID)</strong> inside an outer IP header addressed to the destination switch\'s <strong>RLOC</strong> using UDP port <code>4341</code>. Control-plane Map-Requests and Map-Replies use UDP port <code>4342</code>.'
    },
    'gre': {
      overhead: '+24 Bytes (IP + GRE)',
      transport: 'IP Protocol 47',
      underlayMtu: '1524+ Bytes (or ip mtu 1476)',
      segmentId: '32-Bit Optional GRE Key',
      headers: [
        { name: 'Outer Ethernet', bytes: '14 Bytes', cls: 'bg-outer-l2' },
        { name: 'Outer IPv4 (Tunnel)', bytes: '20 Bytes', cls: 'bg-outer-ip' },
        { name: 'GRE Header (Proto 47)', bytes: '4 Bytes', cls: 'bg-tunnel' },
        { name: 'Inner IP Packet', bytes: 'Up to 1500B', cls: 'bg-inner' }
      ],
      detail: '<strong>Standard GRE (Generic Routing Encapsulation):</strong> Adds <strong>24 bytes</strong> of overhead (20-byte outer IPv4 header with Protocol <code>47</code> + 4-byte GRE header). Because GRE supports multicast and broadcast packets, it allows running dynamic routing protocols (OSPF, EIGRP) across point-to-point tunnels—though it provides <strong>zero encryption</strong> on its own.'
    },
    'gre-ipsec': {
      overhead: '+74 to 80 Bytes',
      transport: 'IP Proto 50 (ESP) / UDP 4500',
      underlayMtu: 'Set ip mtu 1400 / mss 1360',
      segmentId: '32-Bit IPsec SPI',
      headers: [
        { name: 'Outer Ethernet', bytes: '14 Bytes', cls: 'bg-outer-l2' },
        { name: 'Outer IPv4 (Crypto)', bytes: '20 Bytes', cls: 'bg-outer-ip' },
        { name: 'IPsec ESP Header + IV', bytes: '24 Bytes', cls: 'bg-sec' },
        { name: 'GRE (4B) + Inner IP (Encrypted)', bytes: 'Encrypted', cls: 'bg-inner' },
        { name: 'ESP Trailer + Auth ICV', bytes: '~18 Bytes', cls: 'bg-sec' }
      ],
      detail: '<strong>GRE over IPsec (Tunnel Mode):</strong> Combines GRE\'s multicast routing support with IPsec ESP (IP Protocol <code>50</code>) AES encryption and SHA authentication. Because total overhead reaches ~<code>74–80 bytes</code>, Cisco best practice configures <code>ip mtu 1400</code> and <code>ip tcp adjust-mss 1360</code> on the Tunnel interface to prevent Path MTU Black Holes.'
    }
  };

  var encapSelect = document.getElementById('encapSelect');

  function renderEncap() {
    var item = encapData[encapSelect.value];

    document.getElementById('metricsBar').innerHTML =
      '<div class="metric-pill"><span>Header Overhead</span><strong>' + item.overhead + '</strong></div>' +
      '<div class="metric-pill"><span>Outer Transport</span><strong>' + item.transport + '</strong></div>' +
      '<div class="metric-pill"><span>Recommended MTU</span><strong>' + item.underlayMtu + '</strong></div>' +
      '<div class="metric-pill"><span>Virtual Segment ID</span><strong>' + item.segmentId + '</strong></div>';

    document.getElementById('headerStack').innerHTML = item.headers.map(function (h) {
      return '<div class="hdr-block ' + h.cls + '">' +
        '<span class="hdr-name">' + h.name + '</span>' +
        '<span class="hdr-bytes">' + h.bytes + '</span>' +
        '</div>';
    }).join('');

    document.getElementById('encapDetail').innerHTML = item.detail;
  }

  encapSelect.addEventListener('change', renderEncap);
  // --- 3. Interactive SD-Access / LISP Packet Walk Stepper ---
  var walkSteps = [
    {
      title: '1. Host Onboarding & ISE SGT',
      text: 'Client A (EID <code>10.10.10.5</code>) connects to Fabric Edge Switch 1 (FE1). Cisco ISE authenticates the endpoint via 802.1X/MAB and assigns <strong>SGT 10 (Employees)</strong> and Virtual Network <strong>VN_Corp</strong>.'
    },
    {
      title: '2. EID Registration to MS/MR',
      text: 'FE1 registers Client A\'s EID (<code>10.10.10.5/32</code>) and FE1\'s Loopback0 IP (<strong>RLOC 192.168.1.1</strong>) into the SD-Access <strong>Control Plane Node (Map-Server / Map-Resolver)</strong> via LISP UDP <code>4342</code>.'
    },
    {
      title: '3. LISP Map-Request / Map-Reply',
      text: 'Client A pings Client B (<code>10.10.20.9</code>). FE1 (acting as <strong>ITR</strong>) has no local cache entry, so it sends a <strong>LISP Map-Request</strong> to the Control Plane Node and receives a <strong>Map-Reply</strong> pointing to <strong>RLOC 192.168.2.2 (FE2)</strong>.'
    },
    {
      title: '4. VXLAN-GPO Encapsulation',
      text: 'FE1 wraps Client A\'s Ethernet frame inside a <strong>VXLAN-GPO</strong> header (VNI + SGT 10) and an Outer IP header (Src RLOC <code>192.168.1.1</code> → Dst RLOC <code>192.168.2.2</code>, UDP <code>4789</code>) and forwards it across the routed underlay.'
    },
    {
      title: '5. Egress SGACL & Decapsulation',
      text: 'FE2 (acting as <strong>ETR</strong>) receives the VXLAN packet, checks the <strong>SGACL policy matrix</strong> for Source SGT 10 → Destination SGT 20, strips the outer VXLAN/IP headers, and delivers the original frame to Client B.'
    }
  ];

  var walkPills = document.getElementById('walkPills');
  var walkDetail = document.getElementById('walkDetail');

  walkSteps.forEach(function (step, idx) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'walk-pill' + (idx === 0 ? ' active' : '');
    btn.textContent = step.title;
    btn.addEventListener('click', function () {
      walkPills.querySelectorAll('.walk-pill').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      walkDetail.innerHTML = '<strong>' + step.title + ':</strong> ' + step.text;
    });
    walkPills.appendChild(btn);
  });

  walkDetail.innerHTML = '<strong>' + walkSteps[0].title + ':</strong> ' + walkSteps[0].text;

  // Close parent modal on Esc key when embedded in 4any1
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && window.parent !== window) {
      window.parent.postMessage('closeOverlayModal', '*');
    }
  });

  renderEncap();
});
