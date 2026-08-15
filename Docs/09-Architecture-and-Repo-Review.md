# สถาปัตยกรรมของระบบ และรีวิว repo `iamsamitdev/line-chat-recorder`

---

## ส่วนที่ 1: รีวิว repo ที่ใช้เป็นฐาน

**repo:** https://github.com/iamsamitdev/line-chat-recorder
**สรุปคำตอบ: เหมาะสมมากที่จะใช้เป็นฐานของ Workshop 3** โครงสร้างและแนวคิดตรงกับ outline พอดี
ชุด workshop นี้จึงต่อยอดจาก repo เดิมโดยรักษาสไตล์โค้ดเดิมไว้ (TypeScript ไม่ใส่ semicolon, comment ภาษาไทย)

### สิ่งที่ repo เดิมทำถูกต้องแล้ว (เอามาใช้ต่อทั้งหมด)

| ประเด็น | ทำไมถูก |
| --- | --- |
| ตอบ 200 ก่อนประมวลผล event | ป้องกัน LINE หยุดส่ง event เมื่อ DB ช้า/ล่ม |
| try/catch หุ้มทีละ event | event เดียวที่ error ไม่ทำให้ event อื่นไม่ถูกประมวลผล |
| `ON CONFLICT (line_message_id) DO NOTHING` | กันข้อมูลซ้ำจาก retry ของ LINE ที่ระดับฐานข้อมูล |
| `middleware({ channelSecret })` วางก่อน handler | ตรวจ signature จาก raw body ถูกต้องตามที่ SDK ต้องการ |
| ไม่มี `express.json()` ครอบ /webhook | จุดที่ผู้เรียนพลาดบ่อยที่สุด repo เดิมทำถูก |
| แยก `config.ts` / `db.ts` ออกจาก `index.ts` | อ่านง่าย เหมาะกับการสอน |
| `getGroupMemberProfile` ล้มเหลวก็ยังบันทึกข้อความ | ระบบไม่ล้มเพราะรายละเอียดที่ไม่จำเป็น |
| `/health` ตอบ 500 เมื่อ DB ล่ม (ต่างจาก webhook) | แยกแยะได้ว่า health check คนละหน้าที่กับ webhook |
| `.env` อยู่ใน `.gitignore` และมี `.env.example` | แนวปฏิบัติเรื่อง secret ถูกต้อง |

### สิ่งที่ชุด workshop นี้เพิ่มเข้าไป

| เพิ่มอะไร | เพราะอะไร |
| --- | --- |
| ตาราง `media_files` + storage layer | แก้ปัญหา "ภาพและไฟล์ในไลน์หมดอายุ กดโหลดไม่ได้" ซึ่งเป็น pain point อันดับต้นขององค์กรไทย (ดู Workshop 6) |
| จัดการ `unsend` event | LINE กำหนดให้ระบบที่เก็บข้อมูลลบข้อความที่ผู้ใช้ยกเลิกส่ง repo เดิมยังไม่ได้จัดการ |
| ตาราง `line_groups` | เดิมรู้แต่ `group_id` ในตารางข้อความ ทำให้ dashboard เลือกกลุ่มไม่สะดวก และไม่มีที่บันทึกความยินยอม (PDPA) |
| ตาราง `message_logs` | ขาส่งไม่มีร่องรอยเลย ระบบที่ส่งข้อความหาคนหมู่มากต้องตรวจย้อนหลังได้ว่าใครสั่งส่งอะไร |
| ตาราง `group_tasks` | เก็บงานที่ AI สกัดจากบทสนทนา ทำให้ "สรุป" กลายเป็น "ติดตามได้" |
| ตาราง `group_summaries` | เก็บประวัติสรุป ไม่ต้องเรียก AI ซ้ำ และดูย้อนหลังได้ |
| ตาราง `sales_orders` | ข้อมูลธุรกิจจำลองสำหรับ Capstone |
| จัดการ event `leave` | เดิมไม่จัดการ ทำให้ระบบไม่รู้ว่าบอทถูกเตะออกจากกลุ่มแล้ว |
| Admin Dashboard 9 หน้า | outline ต้องการหน้าจอให้ admin ใช้งาน ผู้ใช้จริงไม่พิมพ์ prompt |
| โหมด MOCK + dry-run | ทำให้ทดสอบได้โดยไม่เสียโควต้าและไม่ต้องมี OA (สำคัญมากในคลาส) |
| `asyncRouter()` | **บั๊กที่พบจากการทดสอบจริง:** Express 4 ไม่จับ error จาก async handler ทำให้ process ดับทั้งตัวเมื่อ SQL ผิด |
| หน้า `/simulator` | แผนสำรองเมื่อเชิญบอทเข้ากลุ่มไม่สำเร็จ เรียนต่อได้ทันที |
| สคริปต์ `daily-summary` / `daily-report` | ผลลัพธ์หลักของ Day 2 ตาม outline |
| `npm run db:setup` | เดิมต้องใช้ `psql` ซึ่งผู้เรียนสาย non-dev มักติดปัญหา PATH |
| `docker-compose.yml` | ทางเลือกให้ผู้ที่ไม่อยากติดตั้ง PostgreSQL ลงเครื่อง |

### ข้อสังเกตเชิงเทคนิคที่ควรอธิบายในคลาส

1. **`rowCount` ต่างจาก `RETURNING`**
   `ON CONFLICT DO NOTHING` + `RETURNING` จะไม่คืนแถวเมื่อชนกัน ต้องเช็คด้วย `result.rowCount`
   จึงจะแยกได้ว่า "บันทึกใหม่" หรือ "ข้ามเพราะซ้ำ"

2. **พารามิเตอร์ใน `COALESCE`/`CASE` ต้อง cast ชนิดให้ชัด**
   PostgreSQL อนุมานชนิดของ `$n` ไม่ได้ในบางตำแหน่ง จะได้ error
   `could not determine data type of parameter $4` ต้องเขียน `$4::boolean`
   (พบจากการทดสอบจริง ไม่ใช่ทฤษฎี)

3. **`random()` ใน SQL ที่มี LATERAL อาจถูกประเมินครั้งเดียวต่อกลุ่มแถว**
   ทำให้ข้อมูลจำลองกระจุกตัว (ทุกบิลในวันเดียวกันได้สาขาเดียวกัน)
   ชุดนี้จึงใช้ `md5(เลขที่เอกสาร)` เป็นตัวสุ่มแทน ได้ผลกระจายดีและคงที่ทุกครั้งที่รัน

4. **`TIMESTAMPTZ` เท่านั้น**
   LINE ส่ง `event.timestamp` เป็น epoch (UTC) ถ้าเก็บเป็น `TIMESTAMP` ธรรมดา
   รายงาน "ของวันนี้" จะเพี้ยน 7 ชั่วโมงในไทย ทุก query ที่จัดกลุ่มรายวันต้องมี
   `AT TIME ZONE 'Asia/Bangkok'`

---

## ส่วนที่ 2: สถาปัตยกรรมของชุด workshop

### ภาพรวม

```
                    ┌──────────────────────────────────┐
                    │        LINE Platform             │
                    │  (ต้องได้ 2xx กลับใน ~2 วินาที)   │
                    └───────┬──────────────────▲───────┘
                     webhook│                  │ Push / Broadcast
                            ▼                  │
   ┌────────────────────────────────────────────────────────────┐
   │  Express (port 3000)                                       │
   │                                                            │
   │  POST /webhook  ── ตรวจ signature ── บันทึกข้อความ         │
   │  GET  /health                                              │
   │                                                            │
   │  Admin Dashboard (EJS + Tailwind + Chart.js)                │
   │   /  /messages  /summaries  /tasks  /send                  │
   │   /sales  /groups  /simulator  /logs                       │
   └───────────────────────────┬────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   PostgreSQL 16     │◄──── Postgres MCP ────┐
                    │                     │      (read-only)      │
                    │ line_messages       │                       │
                    │ line_groups         │              Claude Code / Codex
                    │ message_logs        │                       │
                    │ group_tasks         │       LINE Bot MCP ───┘
                    │ group_summaries     │
                    │ sales_orders        │
                    └──────────▲──────────┘
                               │
                    ┌──────────┴──────────────────────┐
                    │  สคริปต์ตั้งเวลา (Task Scheduler)│
                    │   daily-summary.ts              │
                    │   daily-report.ts               │
                    └─────────────────────────────────┘
```

### 4 เส้นทางของข้อมูล

| เส้นทาง | ใช้เมื่อไหร่ | ใครสั่ง |
| --- | --- | --- |
| LINE -> webhook -> DB | ตลอดเวลาที่มีคนพิมพ์ในกลุ่ม | อัตโนมัติ |
| DB -> Postgres MCP -> AI Agent | ถามอะไรก็ได้แบบ ad-hoc | คนพิมพ์ prompt |
| DB -> Dashboard -> LINE | งานประจำวันที่ต้องกดดูและตัดสินใจ | admin กดปุ่ม |
| DB -> สคริปต์ -> LINE | งานประจำเวลาเดิมทุกวัน | Task Scheduler |

จุดสอนที่สำคัญ: **ทั้ง 4 เส้นทางใช้ฐานข้อมูลเดียวกัน** สร้างครั้งเดียวได้ประโยชน์หลายทาง
นี่คือเหตุผลว่าทำไมการมี "หน่วยความจำกลาง" สำคัญกว่าการเขียนบอทเก่ง ๆ ตัวเดียว

### โครงสร้างไฟล์ของ `app/`

```
app/
├── src/
│   ├── index.ts               ประกอบ Express, session, view engine, error handler
│   ├── config.ts              อ่าน .env ทั้งหมดไว้ที่เดียว + บังคับ MOCK เมื่อไม่มี token
│   ├── db.ts                  pg Pool + ตั้ง time zone ไทยทุก connection
│   ├── line/client.ts         ห่อ Messaging API + รองรับโหมด MOCK + แปลง error ให้อ่านรู้เรื่อง
│   ├── scheduler.ts           ตัวตั้งเวลาในตัว (node-cron) ใช้แทน Task Scheduler บน cloud
│   ├── middleware/
│   │   ├── auth.ts            ล็อกอิน (bcrypt/plain), requireLogin, flash message
│   │   └── asyncRouter.ts     กันเซิร์ฟเวอร์ล่มจาก async error ของ Express 4
│   ├── jobs/                  งานที่รันเป็นชุด เรียกได้จาก CLI, scheduler และ dashboard
│   │   ├── dailySummary.ts    สรุปแชทกลุ่ม -> ส่งกลับเข้ากลุ่ม
│   │   └── dailyReport.ts     รายงานผู้บริหาร + ตรวจ anomaly + เขียน HTML
│   ├── routes/
│   │   ├── webhook.ts         ขาเข้าจาก LINE
│   │   ├── auth.ts            /login /logout
│   │   └── admin.ts           ทุกหน้าของ dashboard
│   ├── services/              ตรรกะทางธุรกิจ (ไม่รู้จัก req/res เลย = เทสง่าย ใช้ซ้ำได้)
│   │   ├── messages.ts        ค้นหา/กรอง/แบ่งหน้า/export CSV
│   │   ├── groups.ts          ทะเบียนกลุ่ม + ความยินยอม
│   │   ├── stats.ts           สถิติสำหรับกราฟ
│   │   ├── summary.ts         AI สรุป (Claude API) + fallback rule-based
│   │   ├── tasks.ts           งานที่มอบหมาย
│   │   ├── messaging.ts       ส่งออก + บันทึก message_logs ทุกครั้ง
│   │   ├── flex.ts            เทมเพลต Flex Message 4 แบบ
│   │   ├── storage.ts         ชั้นเก็บไฟล์ (ดิสก์ / S3) เปลี่ยนที่เดียวย้ายได้ทั้งระบบ
│   │   ├── media.ts           ดึงภาพและไฟล์จาก LINE มาเก็บถาวร + แกลเลอรี
│   │   ├── unsend.ts          ลบข้อความและไฟล์เมื่อผู้ใช้กดยกเลิกส่ง
│   │   └── sales.ts           query ยอดขาย + ตรวจ anomaly 4 เกณฑ์
│   └── views/                 EJS + partials (head/nav/foot)
├── scripts/                   ทางเข้าแบบ CLI (บาง ๆ เรียก src/jobs/ ต่อ)
│   ├── db-setup.ts            รันไฟล์ sql/ ตามลำดับ (แทน psql)
│   ├── copy-views.mjs         คัดลอก .ejs ไป dist ตอน build (tsc ไม่คัดลอกให้)
│   ├── hash-password.ts       สร้าง bcrypt hash ของรหัส admin
│   ├── seed-media.ts          สร้างไฟล์ตัวอย่างในแกลเลอรี (ไม่ต้องมี LINE OA)
│   ├── media-cleanup.ts       ลบไฟล์เก่าตามนโยบายเก็บข้อมูล
│   ├── daily-summary.ts       CLI ของ jobs/dailySummary.ts
│   └── daily-report.ts        CLI ของ jobs/dailyReport.ts
├── render.yaml                Blueprint สำหรับ deploy ขึ้น Render แผน Starter
└── sql/
    ├── 01_schema.sql          7 ตาราง + 3 view
    ├── 02_seed_sales.sql      ยอดขาย 30 วัน + anomaly 4 แบบ
    └── 03_seed_demo_chat.sql  บทสนทนากลุ่มจำลอง 164 ข้อความ ใน 3 กลุ่ม
```

**หลักที่ใช้จัดโครงสร้าง:** `services/` และ `jobs/` ไม่ import อะไรจาก `express` เลย
ทำให้งานเดียวกันมี 3 ทางเข้าโดยไม่ต้องเขียนตรรกะซ้ำ

```
                    src/jobs/dailyReport.ts   (ตรรกะอยู่ที่นี่ที่เดียว)
                              ▲
          ┌───────────────────┼───────────────────┐
          │                   │                   │
   scripts/daily-report.ts  src/scheduler.ts   routes/admin.ts
   (CLI + Task Scheduler)   (cron ในโปรเซส)     (ปุ่มในหน้า /sales)
```

นี่คือเหตุผลที่ย้ายจาก Windows Task Scheduler (ในคลาส) ไป cloud (Render) ได้โดยไม่ต้องแก้ตรรกะเลย
เปลี่ยนแค่ "ใครเป็นคนเรียก"

### ตารางฐานข้อมูลและความสัมพันธ์

```
line_groups (group_id PK)
     │ 1
     │
     ├──── * line_messages   (group_id, line_message_id UNIQUE, sent_at, unsent_at)
     ├──── * media_files     (line_message_id UNIQUE, storage_key, size_bytes, status)
     ├──── * group_tasks     (group_id, assignee, task_text, status, source)
     └──── * group_summaries (group_id, summary_date, summary_text, topics jsonb)

message_logs  (ขาส่งทั้งหมด: target_type/target_id, message_kind, status, sent_by)
sales_orders  (ข้อมูลธุรกิจจำลองสำหรับ Capstone)

view v_messages_today   ข้อความของวันนี้พร้อมชื่อกลุ่ม (ให้ AI query ง่าย)
view v_daily_sales      สรุปยอดขายรายวัน/สาขา/ช่องทาง
```

> **เคล็ดลับสำหรับ MCP:** การสร้าง `VIEW` ที่ join และ filter ไว้ให้แล้ว
> ช่วยให้ AI เขียน SQL ถูกตั้งแต่ครั้งแรกมากขึ้น และยังใช้จำกัดขอบเขตข้อมูลที่ AI มองเห็นได้ด้วย

---

## ส่วนที่ 3: สิ่งที่ต้องแก้ก่อนนำไปใช้ในองค์กรจริง

ชุดนี้ออกแบบเพื่อ **การเรียนการสอน** ถ้าจะขึ้น production ต้องเพิ่มอย่างน้อย

| ประเด็น | สถานะในชุดนี้ | ต้องทำอะไรเพิ่ม |
| --- | --- | --- |
| Session | **พร้อม** เก็บใน PostgreSQL เมื่อ `NODE_ENV=production` (`connect-pg-simple`) | - |
| HTTPS / cookie | **พร้อม** `trust proxy` + `cookie.secure` เปิดอัตโนมัติบน production | ถ้ารันเองต้องมี Nginx/Caddy หน้า |
| SSL ของฐานข้อมูล | **พร้อม** เปิดอัตโนมัติเมื่อเจอ `sslmode=` ใน `DATABASE_URL` | - |
| ตัวตั้งเวลา | **พร้อม** `ENABLE_SCHEDULER=true` (node-cron ในโปรเซส) | ถ้า scale เกิน 1 instance ต้องย้ายไป cron ภายนอก |
| Production build | **พร้อม** `npm run build` คัดลอก view ไป `dist` ให้ด้วย | - |
| ระบบผู้ใช้ | บัญชีเดียวใน env | ตาราง users + role + audit log การล็อกอิน |
| Rate limiting | ไม่มี | `express-rate-limit` ที่หน้า login เป็นอย่างน้อย |
| CSRF | ไม่มี | csrf token ในฟอร์ม POST ทุกฟอร์ม |
| Secret | ไฟล์ `.env` / env ของ Render | secret manager ของ cloud หรือ vault |
| Backup | ไม่มี | ใช้ backup ของ Neon (แผนฟรีไม่มี PITR) หรือ `pg_dump` ตั้งเวลา + ทดสอบ restore จริง |
| Monitoring | log ลง console | ส่ง log ออกที่ระบบกลาง + alert เมื่อ webhook เงียบเกิน N ชั่วโมง |
| ระยะเวลาเก็บข้อมูล | เก็บถาวร | สคริปต์ลบข้อมูลเก่าตามนโยบาย (prompt ข้อ 5.1 ใน Prompt Library) |
| การทดสอบ | ทดสอบด้วยมือ | unit test ของ `services/` + integration test ของ webhook |

> เส้นทาง deploy ที่หลักสูตรแนะนำคือ **Render Starter + Neon** ดูขั้นตอนใน `10-Deployment-Render-Neon.md`

---

## เอกสารอ้างอิง

- LINE Bot MCP Server (official): https://github.com/line/line-bot-mcp-server
- LINE Messaging API - Getting started: https://developers.line.biz/en/docs/messaging-api/getting-started/
- LINE Messaging API - Receiving messages (Webhook): https://developers.line.biz/en/docs/messaging-api/receiving-messages/
- LINE Messaging API - Group chats: https://developers.line.biz/en/docs/messaging-api/group-chats/
- LINE Messaging API - Channel access token: https://developers.line.biz/en/docs/basics/channel-access-token/
- Flex Message Simulator: https://developers.line.biz/flex-simulator/
- @line/bot-sdk (Node.js): https://github.com/line/line-bot-sdk-nodejs
- Model Context Protocol: https://modelcontextprotocol.io/
- Claude Code - MCP: https://docs.claude.com/en/docs/claude-code/mcp
- OpenAI Codex CLI: https://developers.openai.com/codex/cli/
- PostgreSQL 16 documentation: https://www.postgresql.org/docs/16/
- repo อ้างอิงของหลักสูตร: https://github.com/iamsamitdev/line-chat-recorder
