from [[Mini HTTP-Server in Rust - Working Draft]] and chatgpt proposed plan [[Mini HTTP-Server in Rust - chat proposed plan]]

Title: **Easy Intro to Networks and the Internet**

---

Before implementing a [[Rust Impl of mini HTTP Server|mini HTTP server]] (in Rust for more fun), let's make sure we have a decent **mental model for networking**. Before calling high-level APIs - Berkeley sockets style `accept`, `send`/`recv`, `connect`, ... - let's build our **foundations** first.

# Layered Architecture

Networks get complicated fast, so their architecture is designed in _layers_.

A layer in the network stack does 3 things: - It offers _services_ to the layer above itself while relying on the services provided by the layer below itself. - It exposes an _interface_ for the upper layer to access its services - this is "vertical", happening on the same machine - It defines a _protocol_ to communicate with a peer layer running on another machine - this is "horizontal", happening between two machines

For example, web apps may speak HTTP with each other - this is their protocol - while vertically interfacing with a lower-level transport layers - typically speaking another protocol like TCP or UDP among themselves.
In the drawing below, HTTP may be the protocol used by the top layer (layer 3), interfacing with layer 2 using the TCP protocol.
![[Layers - Interface and Protocols.svg | 400]]

The distinction between services and protocols is similar to the separation in OOP or APIs more generally between interfaces and "implementation details". In the drawing below, layer k+1 depends on the _services_ exposed by layer k. Given that the interface exposing these services and the services themselves do not change, the protocol used by layers k can be changed: it does not matter from the pov of layer k.
![[Layer_ service VS protocol.excalidraw.svg | 400]]

# From Physics to Apps

## TCP/IP vs OSI in Short

Two important models for networks are the OSI model and the TCP/IP model.

![[osi_tcpip_layer_mapping.png| 240]]

OSI is a "conceptually cleaner" than TCP/IP - precisely defining services, interfaces and protocols for all its _7 layers_. But it doesn’t map well onto real-world network implementations.
In contrast, TCP/IP emerged _from_ real-world networking implementations. It became the dominant model - winning the "[protocol war](https://en.wikipedia.org/wiki/Protocol_Wars#Internet%E2%80%93OSI_Standards_War)" - as it was simpler, already well-implemented and free (see [Berkeley sockets](https://en.wikipedia.org/wiki/Berkeley_sockets)).

We will focus on a mix of the two models, looking at the following layers:

- application
- transport
- network
- link / data-link
- physical

## 1. Physical Layer: Bits to Signals

**How do we send abstract "bits" - clean `1`s and `0`s from the programmer POV - through a physical medium like a copper wire ?**

---

Solving this is the job of the _physical layer_: bridging the gap between the world of bits and the world of atoms. This is about the raw "mechanical" transmission of digital information.

The main task is to solve this is _encoding_: deciding what kind of physical phenomenon will _encode_ bits. For example, a higher voltage may represent a `1` and a lower voltage a `0` ([NRZ](https://en.wikipedia.org/wiki/Non-return-to-zero)). Transitions between physical states can also be used to encode information ([Manchester code](https://en.wikipedia.org/wiki/Manchester_code)).

To cope with physical mediums' imperfections - e.g. noise, limited hardware precision - techniques like thresholding, timings and [clock recovery](https://en.wikipedia.org/wiki/Clock_recovery), and error detections are used.

> - physics, signal processing, electrical engineering, wires/waves

## 2. Link Layer: Local Networks (LAN)

When multiple computers share the same physical medium—whether that’s Wi-Fi or an Ethernet cable—**how does one machine make sure its message reaches the right destination?** This is the job of the **link layer**, which manages communication between devices on the _same local network segment_ (or **LAN**, Local Area Network).

---

The link layer introduces **addresses** ([MAC addresses](https://en.wikipedia.org/wiki/MAC_address)) so that devices can recognize which messages are meant for them. It also handles how these messages are packaged into units called **frames**, and how to avoid chaos when several machines try to send data at the same time.

To communicate reliably on a shared medium, each device is assigned a **MAC address**—a unique hardware identifier. When your laptop sends a message to your router over Wi-Fi or Ethernet, it wraps that message in a frame containing the MAC address of the intended receiver.

This wrapping process is called **encapsulation** and happens throughout the layer stack:

```
frame = header + payload (+ optional trailer)
```

The header includes essential information like source and destination MAC addresses. The payload is your actual message. Trailers may include things like error-detection codes.

**Encapsulation happens at every layer in the stack**—each layer adds its own header (and sometimes trailer) as the message goes down the stack and removes them as it goes up on the receiving side. This process of adding and removing headers is called **encapsulation and decapsulation**.

encapsulation, TCP/IP Illustrated 1:
![[encapsulation_tanenbum.png| 420]]

Notes:

1. [PDU](https://en.wikipedia.org/wiki/Protocol_data_unit): Protocol Data Unit
2. Note that special names are used to describe each layer PDU:
   - signals (physical) --> frames (link) --> packets (network) --> segments (transport) --> messages (app)

What happens if two devices try to send data at the same time? On older **shared Ethernet** setups (where all machines were wired onto a single cable), this led to collisions—two signals interfering with each other.
![[classic_ethernet_tanenbum.png| 420]]
Protocols like **CSMA/CD** (Carrier Sense Multiple Access with Collision Detection) were designed to handle these situations: devices would listen for activity before sending and retry if they detected a collision.

Modern **switched Ethernet** avoids this problem by connecting each device to a central switch, which ensures that messages are forwarded only between the correct sender and receiver ports—removing collisions entirely.
![[switched_ethernet_tanenbum.png| 420]]

Beyond sending messages to known MAC addresses, the link layer sometimes needs to **discover** who’s connected locally. Protocols like **ARP** (Address Resolution Protocol) help map an IP address (used at the network layer) to the corresponding MAC address needed at the link layer.

To keep messages reliable, link-layer frames may also include **[error detection](https://en.wikipedia.org/wiki/Data_link_layer#Error_detection_and_correction)** mechanisms like **[CRC checksums](https://en.wikipedia.org/wiki/Cyclic_redundancy_check)** in the trailer. If corruption is detected, the frame can be dropped and higher layers (like TCP) may request a retransmission.

The link layer is where the idea of a “network” begins to take shape:

- Within a LAN, devices communicate directly using MAC addresses.
- But to reach devices outside this local segment—on another LAN or across the Internet—we need a higher-level addressing scheme: **IP addresses**, handled at the network layer (covered next).

> MAC address, LAN, contention, frames, ARP, CRC

## 3. Network Layer: Routing Across Networks

Once your message can reach other machines on the same local network (thanks to the link+physical layers), **how do you send it across the world—from your laptop in Paris to a server in New York?**

---

Figuring out a path _across_ local networks through routers is the job of the network layer. This task is known as _routing_.

At this level, devices are no longer just direct neighbors—they’re nodes in a vast mesh of interconnected networks: an **internetwork** (hence, the "Internet").

To make sense of this global web, each device’s network interface is assigned an **IP address**. Unlike MAC addresses (which only identify devices within the same local network), the IP address space has a hierarchical structure to make large-scale routing efficient and scalable.
IP addresses are actually divided into:

- a network portion used find the correct LAN within the larger network
- and a host portion used to pinpoint the precise destination machine in the end.

Originally, this network/host split was _fixed_. Nowadays, the split is dynamic. Each IP address is associated to a binary **subnet mask** which defines how much of the address (how many bytes) refers to the network and how much to the host (see class vs classless).
![[IP_address_ANDed_with_subnetmask.png|400]]

> Bitwise AND operation on IP address + subnet mask yields the network portion of the address.

Once a packet finds its way to the final LAN, it's the link layer's responsibility to deliver it to the right machine - mapping the host portion of the IP address to the correct local MAC address.

As the address space is hierarchical, intermediary routers do not need to know about the _entire_ network. Local information is sufficient to the extent each router can make this one-hop decision:

- where to forward the packet next ?

Routers make this decision using their routing tables stored _locally_. These tables only store local, partial (!) knowledge about the entire network.
The goal of forwarding a packet is to move it closer to its destination OR to a router with better information about where to send it next.

Once a router has made its forwarding decision, it updates the link-layer header/trailer to point to the next-hop machine. Link layer data is very local and changes on a hop-to-hop basis. Link headers/trailers are stripped, read and re-written/added at each hop while the IP-level encapsulation information stays constant. The original source and the final destination are constant, while intermediary routers are discovered as the message is being sent.

Actually, IP has a mechanism to avoid a packet losing its way and hoping between routers indefinitely. It counts the number of hops the packet has made and cap it at a certain number, the TTL. Each router decrements the TTL value by one. If TTL reaches zero, the packet is dropped (TTL is a _hop limit_, not a time limit).
So IP packets stay unchanged besides the TTL (which is decremented) across hops while the inner link header is modified to point to the next machine.

---

This TTL feature is actually used `traceroute` to detect intermediary routers. See below the hops to go from my computer to example.com:
![[traceroute_example_dot_com_dump.png|400]]

1. my computer --> my internet box (192.168/16 is within [private address space](https://en.wikipedia.org/wiki/Private_network#Private_IPv4_addresses))
2. box --> where my fiber ends ("ISP's first point of presence")
3. this ISP first node --> regional center ("tou" --> Toulouse) for my ISP

- bunch of "\*\*\*": intermediary hops that do not respond to the TTL-exceeded packets which are used by traceroute to detect them (common behavior)
  - then two hops in Paris (Paris-based [NTT backbone](https://www.gin.ntt.net/about-the-global-ip-network/global-ip-network-worldwide/) routers)
  - then packets go to [Akamai's CDN](https://www.akamai.com/glossary/what-is-a-cdn) US routers ("snjsca" --> San Jose/Santa Clara)
  - and finally reaching the server hosting example.com
    In summary:

- Home --> Local Box
- Fiber --> ISP’s first node
- Regional aggregation center
- Backbone transit via Paris --> NTT backbone
- Akamai CDN edge server (US)

---

However, IP does not add any additional features of robustness/reliability: packets may be duplicated or received out of order, if they are received at all: connectionless, _datagrams_. Packets may also be fragmented into smaller packets, further complicating the delivery.
IP is even stateless: packets are dealt with independantly of each other. There is no memory of previous packets or information about future ones. This stands in stark contrast to what the next layer does when using TCP.

> IP address, inter-network, routing, connectionless, stateless, datagrams, packets

## 4. Transport Layer: Reliability & Connections (TCP, UDP)

With the network layer on top of the link and physical, we can route packets from computer A to computer B. But communication is unreliable. How do we add reliability to communications over unreliable channels ? How can a process on machine A "connect" with another process running on machine B ?

---

The transport layer, with TCP, adds reliability features to the network layer. Actually, TCP provides a _best effort_ at reliability (acknowledgements, retransmissions). This means it will detect communication failures and will warn the application using its service about them. TCP also controls the [_flow_ of communication](https://hpbn.co/building-blocks-of-tcp/#congestion-avoidance-and-control) to avoid both:

- overwhelming the receiver (control flow)
- overwhelming the network itself (_congestion_ control)
  UDP, on the other hand, does not add these and can be though of as a thin wrapper protocol over IP - a "[null protocol](https://hpbn.co/building-blocks-of-udp/#null-protocol-services)". With UDP, the communication stays connectionless, while TCP "elevates" the network datagram service to [virtual-circuit](https://en.wikipedia.org/wiki/Virtual_circuit#Layer_4_virtual_circuits)esque segments.

Note that TCP is not strictly superior over UDP: the added reliability comes at some [performance costs](https://hpbn.co/building-blocks-of-tcp/) - setting up the connection (3-way handshakes), or sending additional messages to acknowledge receptions for instance, see ACKs - which may be well worth the price in some situation and not in others. For example UDP is often chosen for real-time applications like video streaming where low latency matters more than reliability.

TCP three-way handshake with SYNs and ACKs:
![TCP three-way handshake|400](https://hpbn.co/assets/diagrams/eefa1170a673da0140efe1ece7a2884b.svg)

TCP and UDP also add the notion of _ports_ which allow communication not only to happen between two computers, but actually between two processes: more precision. Think of ports are like an additional argument of type integer in methods like `send` and `receive`.
So addressing can now use IP to pinpoint a machine on the larger network and the port number to add extra information about which process exactly should be receiving the message.

![[got4o_drawing_TCP_byte_stream_abstraction.png|400]]a

> Think: _“Make sure this stream of bytes gets from this app on my laptop to the right app on the server.”_

> TCP, virtual circuits, reliability, segments, ports

## 5. Application Layer: From Bytes to Meaning (HTTP, DNS, SMTP...)

And finally, application layer protocols like HTTP or DNS can focus on how data is structured and interpreted by applications

---

Application layer defines the shape and meaning of the messages apps exchange to communicate information. This information is wrapped in the many lower-layer protocol headers and is, generally, only visible at the end to the higher level application that sent/received this content to begin with.

> Your browser sends HTTP GET request bytes via TCP, receiving bytes that represent the HTML page.

The application layer is where the semantics of application is written: for example HTTP to request the content of a web-page, or SMTP to get/send emails.

Application protocols and standards are defined in public specification documents (see RFCs) and are built on top of lower layers. For instance, HTTP assumes a TCP service.

# Layer Interaction: Data Flow through the Stack

Together, these layers form an abstraction tower that allows applications running on distant computers to communicate over a diverse and messy physical infrastructure.

Summary of each layer unit of communication with some protocol examples:

| Layer       | Unit    | Protocol Examples | Purpose                         |
| ----------- | ------- | ----------------- | ------------------------------- |
| Application | message | HTTP, DNS, SMTP   | Meaningful data exchange        |
| Transport   | segment | TCP, UDP          | Reliability, process-to-process |
| Network     | packet  | IP                | Routing between networks        |
| Link        | frame   | Ethernet, Wi-FI   | Local delivery within network   |
| Physical    | signal  | NRZ, Manchester   | Bit-level transmission          |

Let's see an example. When you browse a web page, your browser uses HTTP to formulate its requests to a server.

See client-server situation:
![[Screenshot 2025-04-21 at 10.25.56.png | 420]]

These requests travels over TCP/IP. IP handles addressing across networks; TCP ensures reliable delivery. Lower layers like Ethernet handle local transfers, using MAC addresses. Auxiliary protocols are often involved - for instance to "discover" the IP-to-MAC address mappings (e.g. ARP).

In this sense, TCP and IP from the fundation of the internet, on top of which HTTP - an "app" relative to the network - can run.

See the protocol stack involved for the client/server communication, with routers in between:
![[Screenshot 2025-04-22 at 07.37.58.png | 420]]

Wikipedia illustration of data encapsulation with colors:
![[wikipedia_encapsulation_with_colors.png|400]]

Data flows down the stack on the one machine, is sent physically, and then flows up the stack on the next machine. This happens multiple times until the message arrives at its final destination (the server).
In between the client and the server, a number of intermediary machines like routers will relay the messages forward closer to destination. These intermediate nodes need only read and (re)write only relevant lower-layer headers to forward messages.

During communication, every layer assumes the existance of its "peer" on the destination machine. This "peer" is another instance of the layer, simply running on another computer. Both should therefore "speak" the same protocol.
Layers can safely add additional information to messages by encapsulating them with headers (and sometimes trailers) - trusting that the peer layer will correctly decode the new header/trailer and process them properly, as specified by their protocol.

Once a layer completes its task, it typically passes control or returns the results back up to the layer above it, which originally requested its services

# Follow-Up: Rust Impl. of Mini HTTP-Server

[[Rust Impl of mini HTTP Server]]

Follow-up blog post on my mini-HTTP server implementation in Rust.
Will cover :

- **Performance**: Multi-threading and asynchronous programming; memory efficiency; fast, zero-copy parsing; and buffering strategies.
- **HTTP compliance**: Supporting the most essential parts of the HTTP spec—request parsing, response formatting, status codes, headers, and connection management.
- **Programming and also Rust-specific patterns and challenges**:
  - Builder pattern for ergonomic configuration and object construction.
  - Traits vs enums (static vs dynamic dispatch) for extensibility and performance.
  - Error handling at multiple levels of abstraction: system errors, logic errors, and user-facing failures.
  - `Read` vs `BufRead` and how buffering affects performance and control.

## Learning Resources

- **Books**:
  - Tanenbum, for a very solid and broad intro
  - TCP/IP Illustrated, vol 1, for a very solid text on the TCP/IP stack
  - TCP/IP Illustrated, vol 2, on studying Berkeley sockets original impl.
  - [High Performance Browser Networking](https://hpbn.co/)

- **RFCs**
  - 791 (Internet protocol)
  - 768 (UDP), 793 (TCP)
  - 826 (IP to MAC mapping)
  - 1035 (DNS)
  - 7230 and 7231 (HTTP/1.1)

- **Hands-on projects**
  - codecrafters projects: HTTP and DNS servers
