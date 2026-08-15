# เอกสารเตรียมตัวก่อนอบรม (Pre-course Setup)

**หลักสูตร:** LINE Workflow Automation with Claude Code & MCP
**วันอบรม:** เสาร์ที่ 8 - อาทิตย์ที่ 9 สิงหาคม 2569 · 20:30-23:30 น.

> ทำตามเอกสารนี้ให้เสร็จ **ก่อนวันอบรม** จะได้ใช้เวลาในคลาสกับ Workshop เต็มที่
> ใช้เวลาประมาณ 45-60 นาที ถ้าติดขัดตรงไหน แจ้งในกลุ่มผู้เรียนได้เลย

---

## Checklist ภาพรวม

| # | รายการ | ใช้ในวันไหน | เสร็จแล้ว |
| --- | --- | --- | --- |
| 1 | Node.js v22 ขึ้นไป | ทั้งสองวัน | ☐ |
| 2 | Git | ทั้งสองวัน | ☐ |
| 3 | Claude Code + บัญชี Claude (Pro ขึ้นไป) | ทั้งสองวัน | ☐ |
| 4 | บัญชี LINE Developers | Day 1 | ☐ |
| 5 | LINE บนมือถือพร้อมใช้งาน | ทั้งสองวัน | ☐ |
| 6 | PostgreSQL 16 (หรือ Docker Desktop) | Day 2 | ☐ |
| 7 | cloudflared (Cloudflare Tunnel) | Day 2 | ☐ |
| 8 | โปรแกรมแก้ไขโค้ด (VS Code) | ทั้งสองวัน | ☐ |
| 9 | Codex CLI + ChatGPT Plus (ไม่บังคับ) | ช่วง cross-check | ☐ |
| 10 | Zoom เวอร์ชันล่าสุด | ทั้งสองวัน | ☐ |

---

## 1. Node.js v22 ขึ้นไป (จำเป็น)

`line-bot-mcp-server` ของ LINE ต้องใช้ Node.js v22 ขึ้นไป ถ้าเวอร์ชันต่ำกว่านี้ MCP จะต่อไม่ติด

- ดาวน์โหลด: https://nodejs.org (เลือก LTS ที่เป็น 22 ขึ้นไป)
- ตรวจสอบ:

```bash
node -v      # ต้องได้ v22.x.x หรือสูงกว่า
npm -v
```

Windows ที่ติดตั้งหลายเวอร์ชันแล้วสับสน แนะนำใช้ `nvm-windows` จัดการ

---

## 2. Git

- ดาวน์โหลด: https://git-scm.com/downloads
- ตรวจสอบ: `git --version`

---

## 3. Claude Code

```bash
npm install -g @anthropic-ai/claude-code
claude --version
```

ครั้งแรกที่รัน `claude` ในโฟลเดอร์ใดก็ตาม ระบบจะให้ล็อกอินด้วยบัญชี Claude
(ต้องเป็นแพลน Pro ขึ้นไปจึงจะใช้งานได้ต่อเนื่องตลอดคลาส)

ทดสอบว่าใช้ได้:

```bash
mkdir test-claude && cd test-claude
claude
```

แล้วพิมพ์ `สวัสดี ช่วยสร้างไฟล์ hello.txt ที่มีข้อความ hello world ให้ด้วย` ถ้าได้ไฟล์ออกมาคือพร้อมแล้ว

---

## 4. บัญชี LINE Developers

1. เข้า https://developers.line.biz/console/ แล้วล็อกอินด้วย **บัญชี LINE ส่วนตัว**
2. ยอมรับข้อตกลง กรอกชื่อและอีเมล
3. สร้าง **Provider** ไว้ล่วงหน้า 1 อัน (ตั้งชื่อเป็นชื่อตัวเองหรือชื่อองค์กรก็ได้)

> **ยังไม่ต้องสร้าง Channel** เราจะสร้างพร้อมกันในคลาส Day 1 Session 2
> เพื่อให้ทุกคนเห็นทุกขั้นตอนและตั้งค่าไม่พลาด

---

## 5. LINE บนมือถือ

- ต้องล็อกอินบัญชีเดียวกับที่ใช้เข้า LINE Developers
- Day 2 จะต้องอยู่ในไลน์กลุ่มทดสอบร่วมกับเพื่อนในคลาส 3-4 คน
- ตรวจว่าเพิ่มเพื่อนด้วย ID ได้ (Settings > Privacy > Allow others to add me)

---

## 6. PostgreSQL 16

เลือกทางใดทางหนึ่ง

### ทางที่ 1 (แนะนำสำหรับผู้ที่มี Docker Desktop อยู่แล้ว)

ในโฟลเดอร์ `app/` ของชุดไฟล์ workshop มี `docker-compose.yml` ให้แล้ว

```bash
docker compose up -d          # เปิดฐานข้อมูล
docker compose ps             # ตรวจว่าสถานะ healthy
```

ได้ PostgreSQL 16 ที่ `postgres://postgres:postgres@localhost:5432/linechat` ทันที ไม่ต้องตั้งค่าอะไรเพิ่ม

### ทางที่ 2 (ติดตั้งลงเครื่อง)

- Windows/macOS: https://www.postgresql.org/download/
- ตอนติดตั้ง **จดรหัสผ่านของ user `postgres` ไว้ให้ดี** (จะต้องใช้ในไฟล์ `.env`)
- ติ๊กติดตั้ง **pgAdmin** ไปด้วย จะดูข้อมูลง่ายขึ้น
- ตรวจสอบ:

```bash
psql --version
psql -U postgres -c "SELECT version();"
```

ถ้า Windows บอกว่าไม่รู้จักคำสั่ง `psql` ให้เพิ่ม `C:\Program Files\PostgreSQL\16\bin` เข้า PATH

สร้างฐานข้อมูลที่จะใช้ในคลาส:

```bash
psql -U postgres -c "CREATE DATABASE linechat;"
```

---

## 7. cloudflared (Cloudflare Tunnel)

LINE ต้องการ Webhook URL ที่เป็น HTTPS สาธารณะ เครื่องเราอยู่หลัง NAT จึงต้องใช้ tunnel

> **ทำไมไม่ใช้ ngrok:** ต้นปี 2026 ngrok ตัดแพลนฟรีเหลือ **session ละ 2 ชั่วโมง**
> และจำกัด 20,000 requests/เดือน ซึ่งจะหลุดกลางคลาสได้
> **cloudflared ยังฟรีไม่จำกัด ไม่ต้องสมัครบัญชี** จึงเป็นตัวเลือกหลักของหลักสูตรนี้

### ติดตั้ง

- Windows: ดาวน์โหลด `cloudflared-windows-amd64.exe` จาก
  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
  แล้วเปลี่ยนชื่อเป็น `cloudflared.exe` วางไว้ในโฟลเดอร์ที่อยู่ใน PATH
  (หรือใช้ `winget install --id Cloudflare.cloudflared`)
- macOS: `brew install cloudflared`
- ตรวจสอบ: `cloudflared --version`

### ทดสอบ

```bash
cloudflared tunnel --url http://localhost:3000
```

จะได้ URL หน้าตาแบบ `https://xxxx-yyyy-zzzz.trycloudflare.com` แสดงบนหน้าจอ
(ยังไม่ต้องรันตอนนี้ก็ได้ แค่ตรวจว่าคำสั่งทำงาน)

**ข้อควรรู้:** URL แบบ quick tunnel เปลี่ยนทุกครั้งที่รันใหม่ เหมือน ngrok ฟรี
ถ้ามีโดเมนอยู่บน Cloudflare แล้ว สามารถทำ named tunnel ให้ URL คงที่ตลอดได้ (ตั้งครั้งเดียว 5 นาที)

**ทางเลือกสำรอง** (ถ้า cloudflared ใช้ไม่ได้ในเครือข่ายของคุณ)

| เครื่องมือ | คำสั่ง | ข้อจำกัด |
| --- | --- | --- |
| ngrok | `ngrok http 3000` | ฟรี 2 ชม./session ต้องสมัครและผูก authtoken |
| localtunnel | `npx localtunnel --port 3000` | ไม่ต้องสมัคร แต่ไม่เสถียรเท่า |
| localhost.run | `ssh -R 80:localhost:3000 nokey@localhost.run` | ไม่ต้องติดตั้งอะไร |

---

## 8. VS Code

- https://code.visualstudio.com/
- ส่วนขยายที่แนะนำ: **Thai Language Pack** (ถ้าต้องการ), **PostgreSQL** (Chris Kolkman), **DotENV**

---

## 9. Codex CLI (ไม่บังคับ)

ใช้ในช่วง Cross-check เท่านั้น ถ้าไม่มีก็เรียนได้ครบ

```bash
npm install -g @openai/codex
codex --version
```

ต้องมีบัญชี ChatGPT Plus ขึ้นไป

---

## 10. เตรียมโฟลเดอร์ทำงานและเลือกสาขาให้ตรงวัน

สร้างโฟลเดอร์สำหรับคลาสนี้ไว้ที่ที่หาง่าย เช่น

```
C:\line-workshop-2026\
```

แล้วแตกไฟล์ zip ของชุด workshop ไว้ในนั้น

**ชุดไฟล์นี้แบ่ง git branch ตามวันอบรม** โค้ดต่อยอดกันเป็นเส้นเดียว ไม่ได้แยกคนละทาง

| สาขา | ใช้เมื่อไหร่ | ต้องมี PostgreSQL ไหม |
| --- | --- | --- |
| `day1` | วันแรก (Workshop 1-2) เซิร์ฟเวอร์มีแค่ webhook ที่ตอบกลับได้ | **ไม่ต้อง** |
| `day2` | วันที่สอง (Workshop 3-6) ระบบเต็มพร้อม Dashboard | ต้องมี |
| `main` | เหมือน `day2` ใช้เป็นสาขาอ้างอิง | ต้องมี |

```bash
cd line-workflow-workshop-2026
git branch -a          # ดูสาขาทั้งหมด
git checkout day1      # ก่อนเริ่มวันแรก
```

รายละเอียดทั้งหมดอยู่ในไฟล์ `BRANCHES.md`

---

## ทดสอบว่าพร้อมจริง (สำคัญ)

### ถ้าเตรียมสำหรับวันแรก (สาขา `day1`) - ไม่ต้องมีฐานข้อมูล

```bash
cd app
node -v                       # v22 ขึ้นไป
npm install                   # ต้องไม่มี error
cp .env.example .env          # Windows: copy .env.example .env
npm run dev                   # ต้องขึ้น "Day 1" ในหน้าจอ
```

เปิด http://localhost:3000/health ต้องได้ `{"status":"ok","day":1,...}` = พร้อมสำหรับวันแรก

### ถ้าเตรียมสำหรับวันที่สอง (สาขา `day2`) - ต้องมี PostgreSQL แล้ว

```bash
git checkout day2
cd app
npm install                   # วันที่สองใช้แพ็กเกจเพิ่ม ต้องรันซ้ำ
cp .env.example .env          # Windows: copy .env.example .env
npm run db:setup              # ต้องขึ้น "พร้อมใช้งาน"
npm run dev                   # ต้องเปิด http://localhost:3000 ได้
```

เปิดเบราว์เซอร์ที่ http://localhost:3000 ล็อกอิน `admin` / `admin1234`
ถ้าเห็นหน้า Dashboard มีกราฟและตัวเลข = เตรียมเครื่องสำเร็จ

ถ้าติดปัญหา อ่าน `docs/07-Troubleshooting.md` ก่อน แล้วถ้ายังไม่ได้ให้ส่งภาพหน้าจอ error มาในกลุ่มผู้เรียน
