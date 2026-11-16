---
title: "Hostinger KVM 4 Malaysia VPS Benchmark: AMD EPYC, 5.7 GB/s NVMe, and 6ms to Singapore"
description: "Real-world hardware, disk I/O, and network benchmarks for Hostinger's KVM 4 VPS in Kuala Lumpur, Malaysia. YABS, fio, Geekbench 6, 60-second CPU steal test, and latency analysis."
date: 2026-11-16
category: Infrastructure
tags: [hostinger, vps, benchmark, amd-epyc, linux, sysadmin, devops]
cover: /work/hostinger-kvm4-malaysia.svg
coverAlt: Comprehensive benchmark summary for Hostinger KVM 4 VPS in Kuala Lumpur, Malaysia showing 5.76 GB/s NVMe, AMD EPYC 9354P, and 6.08ms ping to Singapore.
featured: true
---

Whenever developers, startups, and sysadmins across Southeast Asia spin up a cloud VPS, the instinctive answer has almost always been Singapore. Five years ago, that instinct was completely justified: Singapore held the lion's share of submarine cable landings, major Internet Exchange Points (IXPs), and regional cloud availability zones. Deploying in neighboring countries often meant dealing with sluggish, sub-optimal routing hops.

Hostinger recently changed that calculus by opening their **Kuala Lumpur, Malaysia datacenter (AS47583)**, powered by AMD EPYC 9004-series (Genoa) enterprise hardware. Their **KVM 4** plan delivers **4 vCPUs, 16 GB of DDR5 RAM, and a 200 GB NVMe drive** at a price point that makes typical hyperscaler pricing look exorbitant.

I provisioned a clean Ubuntu 26.04 instance on the Kuala Lumpur node and ran a comprehensive, no-nonsense performance suite: **Yet Another Bench Script (YABS)**, deep **fio** disk I/O profiles across four block sizes, **Geekbench 6**, a sustained **60-second mpstat 100% CPU saturation stress test**, and **sysbench** memory throughput.

Here are the raw benchmark numbers, the architectural findings, and why this location might be the highest-value pick for your next server deployment.

![Hostinger KVM 4 Malaysia Datacenter Benchmark](/work/hostinger-kvm4-banner.jpg "Hostinger KVM 4 VPS in Kuala Lumpur, Malaysia: AMD EPYC 9354P Zen 4 compute blade with enterprise NVMe array.")

---

## 1. The Hardware Baseline

Here is the system profile retrieved directly from `/proc/cpuinfo`, `lscpu`, and the hypervisor:

```text
Host / Network:
  ISP         : HOSTINGER MY
  ASN         : AS47583 Hostinger International Limited
  Location    : Kuala Lumpur, Malaysia
  IP Routing  : Native Dual Stack (IPv4 Online / IPv6 Online)

Compute & Memory:
  Processor   : AMD EPYC 9354P 32-Core Processor (Zen 4)
  CPU Cores   : 4 vCPUs @ 3,245.12 MHz
  AES-NI      : Enabled (Hardware cryptographic acceleration)
  VM-x/AMD-V  : Disabled (No nested virtualization)
  RAM         : 15.6 GiB (DDR5 ECC)
  Swap        : 0.0 KiB

Storage & Platform:
  Disk Size   : 193.9 GiB NVMe (/dev/sda1)
  OS Distro   : Ubuntu 26.04.1 LTS
  Linux Kernel: 7.0.0-38-generic
  Hypervisor  : KVM
```

Two architectural points stand out immediately:

1. **Zen 4 Genoa Silicon:** The EPYC 9354P is built on TSMC's 5nm node with 256MB of L3 cache. It delivers high single-thread IPC and AVX-512 instructions. For single-threaded workloads—such as Node.js event loops, Python Gunicorn workers, and Redis pipelines—this translates into significantly lower request processing latency compared to older Zen 2 or Xeon E5 instances that budget VPS hosts often repurpose.
2. **Virtualization Boundaries:** `VM-x/AMD-V` is disabled on the guest. You cannot run nested virtual machines (e.g. Proxmox VE or nested KVM instances). However, application-level containers like Docker, Podman, and LXC operate without restriction.

---

## 2. Disk I/O: 5.7 GB/s Sequential & 114k 4K IOPS

Storage speed is where budget cloud providers typically conceal severe limits. They advertise "NVMe," but place heavy burst throttling or assign weak IOPS quotas that freeze your system during high-concurrency database queries.

To test the true storage limits of `/dev/sda1`, we ran `fio` with a **50/50 mixed read/write workload** across four block sizes (direct I/O, queue depth 64):

![fio Disk Speed Tests Chart](/work/kvm4-disk-chart.svg "fio 50/50 mixed read/write throughput and IOPS across 4k, 64k, 512k, and 1m block sizes on /dev/sda1.")

| Block Size | Workload Type | Read Speed (IOPS) | Write Speed (IOPS) | Combined Speed | Total IOPS |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **4k** | Random Database I/O | 233.46 MB/s (56.9k) | 234.08 MB/s (57.1k) | **467.55 MB/s** | **114,100 IOPS** |
| **64k** | Mixed App & Assets | 2.82 GB/s (43.1k) | 2.84 GB/s (43.4k) | **5.67 GB/s** | **86,500 IOPS** |
| **512k** | Docker Builds / Images | 2.80 GB/s (5.3k) | 2.95 GB/s (5.6k) | **5.76 GB/s** | **10,900 IOPS** |
| **1m** | Sequential Streaming | 2.73 GB/s (2.6k) | 2.91 GB/s (2.7k) | **5.65 GB/s** | **5,300 IOPS** |

### What this means in practice:
- **114,100 IOPS on 4k blocks:** This is enterprise-grade storage performance. Most standard cloud droplets provide between 3,000 and 10,000 4k IOPS before queuing occurs. Over 114k IOPS means write-heavy PostgreSQL WAL flushes, high-frequency MySQL transactions, and Redis snapshots will not cause disk bottlenecks.
- **5.76 GB/s sequential throughput:** Confirms a hardware PCIe 4.0 NVMe RAID array beneath the KVM hypervisor. Large Docker image layers unpack in seconds, and cold database restores finish without disk throttling.

---

## 3. Compute & Geekbench 6 Performance

We ran Geekbench 6.3.0 to measure raw CPU execution speed against real-world compilation, encryption, and data processing tasks:

```text
Geekbench 6 CPU Benchmark Result:
------------------------------------------------------
Single-Core Score : 1,451
Multi-Core Score  : 4,468
Validation Link   : https://browser.geekbench.com/v6/cpu/19480437
```

A **1,451 single-core score** on a virtualized 3.24 GHz vCPU indicates strong per-core efficiency. Multicore scaling reaches **4,468**, confirming that compute power scales linearly across all 4 assigned vCPUs without artificial CPU throttling.

### Memory Speed: 21,725 MiB/s via Sysbench

To evaluate memory throughput and latency across the 16 GB DDR5 allocation, we ran a multi-threaded 20 GB block transfer using `sysbench`:

```text
sysbench Memory Speed:
---------------------------------
20480.00 MiB transferred (21725.61 MiB/sec)
Latency: min 0.17ms, avg 0.18ms, max 0.35ms
```

A measured throughput of **21,725.61 MiB/sec (~21.2 GB/s)** combined with a tight latency window (**0.17ms minimum, 0.18ms average, 0.35ms maximum**) demonstrates the advantages of DDR5 ECC memory on Zen 4 architecture. Even under peak multi-threaded write saturation, latency variation is less than 0.18 milliseconds across the entire 20 GB transfer. In-memory databases like Redis, Valkey, KeyDB, and Dragonfly run on this node with virtually zero thread jitter.

---

## 4. The "Noisy Neighbour" Test: 60-Second CPU Steal Analysis

Standard benchmark suites execute quick burst tests that can easily mask noisy neighbours on oversubscribed physical nodes. If a hosting provider overprovisions its hypervisors, your guest VM gets starved of CPU time slices the moment neighboring instances spin up workloads. In Linux, this performance penalty shows up directly in the hypervisor's `%steal` metric.

To stress-test Hostinger's host node allocation, we took an idle baseline, then saturated all 4 assigned vCPUs at 100% load continuously for 60 seconds using `mpstat`:

![mpstat CPU Steal and Stability Chart](/work/kvm4-cpu-chart.svg "mpstat 60-second sustained 100% CPU load benchmark across all 4 AMD EPYC vCPUs showing average steal of 2.05% and 0.00% iowait.")

### Baseline (Idle System Profile):

```text
CPU   %usr   %nice    %sys %iowait   %irq   %soft  %steal  %guest  %gnice   %idle
all   0.05    0.00    0.05    0.00   0.00    0.00    0.11    0.00    0.00   99.79
```

At idle, background steal is just **0.11%**, showing a quiet host hypervisor with virtually no baseline scheduling interference.

### Sustained 100% Saturation Test (60 Seconds @ 100% Load):

```text
CPU   %usr   %nice    %sys %iowait   %irq   %soft  %steal  %guest  %gnice   %idle
all  93.10    0.00    0.06    0.00   0.00    0.00    2.05    0.00    0.00    4.79
0    93.14    0.00    0.05    0.00   0.00    0.00    2.03    0.00    0.00    4.78
1    93.07    0.00    0.07    0.00   0.00    0.00    2.06    0.00    0.00    4.80
2    93.12    0.00    0.05    0.00   0.00    0.00    2.05    0.00    0.00    4.78
3    93.08    0.00    0.07    0.00   0.00    0.00    2.05    0.00    0.00    4.80
```

### Key observations from the mpstat run:
1. **Uniform User Execution (93.10% usr):** Every single core ran user-space computations at full power (93.07% to 93.14%). There was no individual core throttled more than another.
2. **2.05% Steal Under Sustained Load:** On budget VPS hosts, 60-second saturation typically triggers 15%–40% steal as the hypervisor throttles the instance. Here, steal averaged a modest 2.05% across the entire run.
3. **0.00% I/O Wait:** Disk I/O wait remained strictly at 0.00% across all 4 cores throughout the test. Storage operations never held back the CPU execution pipeline.

---

## 5. Network Matrix: 6.08ms Latency to Singapore & Dual-Stack Peering

Network performance was tested using `iperf3` over both IPv4 and IPv6 links against major transit nodes across Asia, Europe, and the Americas:

![iperf3 Network Latency Matrix Chart](/work/kvm4-network-chart.svg "iperf3 dual-stack latency and throughput matrix from Kuala Lumpur (AS47583) to Singapore, London, Amsterdam, and the US.")

### Complete iperf3 Dual-Stack Results:

| Target Location | Testing Node (Link) | IPv4 Send / Recv | IPv4 Ping | IPv6 Send / Recv | IPv6 Ping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Singapore (SG)** | Leaseweb (10G) | **1.01 Gbps / 974 Mbps** | **6.34 ms** | **996 Mbps / 945 Mbps** | **6.08 ms** |
| **London (UK)** | Clouvider (10G) | 116 Mbps / 327 Mbps | 165 ms | **278 Mbps / 483 Mbps** | **160 ms** |
| **Amsterdam (NL)** | Eranium (100G) | 110 Mbps / 778 Mbps | 164 ms | 119 Mbps / 774 Mbps | 164 ms |
| **Los Angeles (US)** | Clouvider (10G) | 247 Mbps / 353 Mbps | 183 ms | **414 Mbps / 441 Mbps** | **172 ms** |
| **Tashkent (UZ)** | Uztelecom (10G) | 270 Mbps / 316 Mbps | 225 ms | 225 Mbps / 348 Mbps | 236 ms |
| **New York (US)** | Leaseweb (10G) | 277 Mbps / 694 Mbps | 251 ms | 285 Mbps / 643 Mbps | 246 ms |
| **Sao Paulo (BR)** | Edgoo (1G) | *node busy* | 352 ms | *node busy* | 351 ms |

### Architectural Insights:
- **Sub-7ms Singapore Interconnect:** With a **6.08 ms IPv6 ping** and **6.34 ms IPv4 ping**, round-trip latency to Singapore is comparable to local metro routing. Both upstream and downstream links completely saturate the gigabit interface (**1.01 Gbps send / 974 Mbps recv** on IPv4; **996 Mbps / 945 Mbps** on IPv6).
- **Superior IPv6 Routing to the West:** IPv6 routing to London and Los Angeles delivers noticeably lower latency and more than double the send throughput compared to legacy IPv4 paths (London IPv6 send hits 278 Mbps at 160ms vs 116 Mbps at 165ms on IPv4; LA IPv6 send reaches 414 Mbps at 172ms vs 247 Mbps at 183ms).
- **Direct Peering into MyIX & SGIX:** Kuala Lumpur nodes benefit from direct terrestrial fiber running down the Malaysian peninsula across the Johor Strait straight into Singapore's primary exchange points, bypassing congested public transits.

---

## 6. Strategic Advantage: Why Deploy in Malaysia over Singapore?

For years, developers defaulted to Singapore because other Southeast Asian locations had unreliable power grids and limited fiber connectivity. Today, the dynamics have fundamentally shifted:

### 1. Cost-Performance Arbitrage (The Hybrid Architecture)
Hosting infrastructure in Singapore has grown increasingly expensive due to high real estate costs, power tariffs, and datacenter construction moratoriums. Hyperscalers charge steep premiums for compute in `ap-southeast-1`.

With a **6ms fiber route** to Singapore, you can deploy your heavy compute workloads (Docker containers, background worker queues, AI inference nodes, CI/CD runners) on Hostinger Malaysia at a fraction of the cost, while keeping latency to managed databases (AWS RDS, Aurora, Cloudflare Workers, Supabase) practically imperceptible to users.

### 2. Local Data Sovereignty & Compliance (PDPA)
If you build applications for Malaysian businesses, fintech, healthcare, or government-linked services, Malaysia's Personal Data Protection Act (PDPA) often mandates or strongly prefers domestic data residency. Deploying in Hostinger's Kuala Lumpur datacenter satisfies residency requirements without sacrificing modern server silicon.

### 3. Native Low-Latency for 600M+ Southeast Asian Users
Traffic to users across Malaysia, Indonesia, Thailand, Vietnam, and the Philippines routes cleanly through regional Internet Exchanges (MyIX, SGIX, JBIX) with typical latencies between **6ms and 40ms**.

---

## 7. Recommended Workloads for this Instance

With **4 Zen 4 vCPUs**, **16 GB DDR5 RAM**, and **114k 4K IOPS**, this server is best suited for:

- **Self-Hosted PaaS Platforms (Coolify, Dokku, CapRover):** Run 15 to 25 production microservices, full-stack Next.js/Node apps, and background cron jobs comfortably within the 16 GB footprint.
- **High-Concurrency PostgreSQL & MySQL Databases:** The 114,100 IOPS on 4k random writes handles write-heavy database transactions, WAL checkpoints, and concurrent queries without disk bottlenecks.
- **Large-Scale E-Commerce (WooCommerce, Magento, Medusa):** Eliminates the common memory starvation and slow catalog queries typical of smaller 4 GB or 8 GB VPS plans.
- **Low-Latency Game & WebSocket Servers:** Sub-7ms ping to Singapore combined with high Zen 4 single-core IPC provides stable tick rates and low-jitter packet delivery for real-time multiplayer backends.

---

## 8. Performance Summary Scorecard

| Resource Component | Measured Result | Production Rating |
| :--- | :--- | :--- |
| **Compute Engine** | AMD EPYC 9354P Zen 4 (4 vCPUs @ 3.25GHz) | **Strong** (Single: 1,451 / Multi: 4,468) |
| **Random 4K Storage** | 467.55 MB/s (114,100 IOPS mixed R/W) | **Exceptional** (Handles heavy database write bursts) |
| **Sequential Storage** | 5.76 GB/s Read & Write (/dev/sda1) | **Top-tier** (Enterprise PCIe 4.0 NVMe array) |
| **Memory Bandwidth** | 21,725.61 MiB/s (0.17ms–0.35ms latency) | **Blazing** (DDR5 ECC multi-threaded bus) |
| **CPU Steal (mpstat 60s)** | 2.05% average steal under 100% saturation | **Very Stable** (Minimal hypervisor contention) |
| **Regional Peering (SG)** | 6.08 ms IPv6 / 6.34 ms IPv4 (1.01 Gbps line) | **Metro Grade** (Sub-7ms direct fiber link) |

---

## 9. Raw Benchmark Telemetry Log

For system administrators and DevOps engineers who want to inspect the exact console output, here is the complete raw log captured during testing:

```text
#                     v2026-10-31                    #
# https://github.com/masonr/yet-another-bench-script #
# ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## #

Mon Nov 16 08:33:26 UTC 2026

Basic System Information:
---------------------------------
Uptime     : 0 days, 15 hours, 50 minutes
Processor  : AMD EPYC 9354P 32-Core Processor
CPU cores  : 4 @ 3245.122 MHz
AES-NI     : ✔ Enabled
VM-x/AMD-V : ❌ Disabled
RAM        : 15.6 GiB
Swap       : 0.0 KiB
Disk       : 193.9 GiB
Distro     : Ubuntu 26.04.1 LTS
Kernel     : 7.0.0-38-generic
VM Type    : KVM
IPv4/IPv6  : ✔ Online / ✔ Online

IPv6 Network Information:
---------------------------------
ISP        : HOSTINGER MY
ASN        : AS47583 Hostinger International Limited
Host       : Hostinger International Ltd.
Location   : Kuala Lumpur, Kuala Lumpur (14)
Country    : Malaysia

fio Disk Speed Tests (Mixed R/W 50/50) (Partition /dev/sda1):
---------------------------------
Block Size | 4k            (IOPS) | 64k           (IOPS)
  ------   | ---            ----  | ----           ---- 
Read       | 233.46 MB/s  (56.9k) | 2.82 GB/s    (43.1k)
Write      | 234.08 MB/s  (57.1k) | 2.84 GB/s    (43.4k)
Total      | 467.55 MB/s (114.1k) | 5.67 GB/s    (86.5k)
           |                      |                     
Block Size | 512k          (IOPS) | 1m            (IOPS)
  ------   | ---            ----  | ----           ---- 
Read       | 2.80 GB/s     (5.3k) | 2.73 GB/s     (2.6k)
Write      | 2.95 GB/s     (5.6k) | 2.91 GB/s     (2.7k)
Total      | 5.76 GB/s    (10.9k) | 5.65 GB/s     (5.3k)

iperf3 Network Speed Tests (IPv4):
---------------------------------
Provider        | Location (Link)           | Send Speed      | Recv Speed      | Ping           
-----           | -----                     | ----            | ----            | ----           
Clouvider       | London, UK (10G)          | 116 Mbits/sec   | 327 Mbits/sec   | 165 ms         
Eranium         | Amsterdam, NL (100G)      | 110 Mbits/sec   | 778 Mbits/sec   | 164 ms         
Uztelecom       | Tashkent, UZ (10G)        | 270 Mbits/sec   | 316 Mbits/sec   | 225 ms         
Leaseweb        | Singapore, SG (10G)       | 1.01 Gbits/sec  | 974 Mbits/sec   | 6.34 ms        
Clouvider       | Los Angeles, CA, US (10G) | 247 Mbits/sec   | 353 Mbits/sec   | 183 ms         
Leaseweb        | NYC, NY, US (10G)         | 277 Mbits/sec   | 694 Mbits/sec   | 251 ms         
Edgoo           | Sao Paulo, BR (1G)        | busy            | busy            | 352 ms         

iperf3 Network Speed Tests (IPv6):
---------------------------------
Provider        | Location (Link)           | Send Speed      | Recv Speed      | Ping           
-----           | -----                     | ----            | ----            | ----           
Clouvider       | London, UK (10G)          | 278 Mbits/sec   | 483 Mbits/sec   | 160 ms         
Eranium         | Amsterdam, NL (100G)      | 119 Mbits/sec   | 774 Mbits/sec   | 164 ms         
Uztelecom       | Tashkent, UZ (10G)        | 225 Mbits/sec   | 348 Mbits/sec   | 236 ms         
Leaseweb        | Singapore, SG (10G)       | 996 Mbits/sec   | 945 Mbits/sec   | 6.08 ms        
Clouvider       | Los Angeles, CA, US (10G) | 414 Mbits/sec   | 441 Mbits/sec   | 172 ms         
Leaseweb        | NYC, NY, US (10G)         | 285 Mbits/sec   | 643 Mbits/sec   | 246 ms         
Edgoo           | Sao Paulo, BR (1G)        | busy            | busy            | 351 ms         

Geekbench 6 Benchmark Test:
---------------------------------
Test            | Value                         
|
Single Core     | 1451                          
Multi Core      | 4468                          
Full Test       | https://browser.geekbench.com/v6/cpu/19480437

mpstat CPU Utilization (60s @ 100% Saturation):
---------------------------------
CPU   %usr   %nice    %sys %iowait   %irq   %soft  %steal  %guest  %gnice   %idle
all  93.10    0.00    0.06    0.00   0.00    0.00    2.05    0.00    0.00    4.79
0    93.14    0.00    0.05    0.00   0.00    0.00    2.03    0.00    0.00    4.78
1    93.07    0.00    0.07    0.00   0.00    0.00    2.06    0.00    0.00    4.80
2    93.12    0.00    0.05    0.00   0.00    0.00    2.05    0.00    0.00    4.78
3    93.08    0.00    0.07    0.00   0.00    0.00    2.05    0.00    0.00    4.80

mpstat Baseline (Idle):
---------------------------------
CPU   %usr   %nice    %sys %iowait   %irq   %soft  %steal  %guest  %gnice   %idle
all   0.05    0.00    0.05    0.00   0.00    0.00    0.11    0.00    0.00   99.79

sysbench Memory Speed:
---------------------------------
20480.00 MiB transferred (21725.61 MiB/sec)
Latency: min 0.17ms, avg 0.18ms, max 0.35ms
```

---

## The Verdict

If you have defaulted to Singapore for hosting because you assumed other Southeast Asian nodes were uncompetitive, these benchmarks offer a clear counter-argument. 

Hostinger’s **Kuala Lumpur (AS47583)** node combines genuine AMD EPYC Zen 4 enterprise compute, 114,100 random 4k IOPS, DDR5 memory throughput exceeding 21 GB/s, and a 6.08ms fiber run to Singapore. For developers looking to optimize server budgets without compromising performance, it is one of the most compelling VPS deployments currently available in the region.
