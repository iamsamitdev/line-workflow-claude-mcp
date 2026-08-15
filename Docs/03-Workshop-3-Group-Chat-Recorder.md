# Workshop 3: Group Chat Recorder - เก็บแชทกลุ่มลงฐานข้อมูล

**Day 2 · 20:45 - 21:35 (50 นาที)**
**บทบาทที่สวม:** เจ้าหน้าที่ IT ที่สร้างระบบให้ทีมปฏิบัติการ

---

## ปัญหาที่เราจะแก้

Workshop 1-2 เราสั่ง AI **ส่ง** ข้อความได้แล้ว แต่ถ้าอยากให้ AI **สรุปประชุมในไลน์กลุ่ม** จะติดกำแพงทันที

> LINE Messaging API ไม่มี endpoint ใดที่อ่านประวัติแชทได้เลย
> บอทได้รับข้อความผ่าน Webhook เฉพาะข้อความที่เกิด **หลังจาก** บอทเข้ากลุ่มแล้วเท่านั้น

คำตอบเชิงสถาปัตยกรรมคือสร้าง "หน่วยความจำ" ของเราเอง

```
สมาชิกในกลุ่มพิมพ์ข้อความ
        │
        ▼
LINE Platform ──POST──► Webhook Server (Express + @line/bot-sdk)
   ผ่าน HTTPS (cloudflared)     │ ตรวจ signature แล้วบันทึก
                               ▼
                        PostgreSQL: ตาราง line_messages
                               │
                               ▼ (Workshop 4)
                     Postgres MCP ──► Claude Code สรุป/วิเคราะห์
                                             │
                                             ▼ LINE Bot MCP ส่งกลับเข้ากลุ่ม
```

**หลักคิดที่เอาไปใช้ได้ทุกงาน:** เมื่อ API ปลายทางไม่ให้สิ่งที่เราต้องการ
ให้เปลี่ยนจาก "ดึงเมื่อต้องใช้" (pull) เป็น "รับไว้ตั้งแต่ต้น" (push + เก็บ)

---

## Part A: เตรียมกลุ่มทดสอบและเปิดสิทธิ์ให้บอท (7 นาที)

### A1. เปิดให้บอทเข้ากลุ่มได้ (ค่าเริ่มต้นปิดอยู่)

1. เข้า https://manager.line.biz/ เลือก OA ของคุณ
2. **Settings > Account settings > Chats**
3. เปิด **"Allow bot to join group chats"** (ถ้าไม่เปิด จะเชิญบอทเข้ากลุ่มไม่ได้เลย)
4. **Settings > Response settings** ตรวจว่า
   - Auto-response messages: **ปิด**
   - Webhook: **เปิด**
   - Greeting message: ปิดหรือเปิดก็ได้

### A2. สร้างไลน์กลุ่มทดสอบ

จับกลุ่ม 3-4 คน ตั้งกลุ่มชื่อ เช่น `ทดสอบ LINE Workflow - กลุ่ม 1`
เชิญบอทเข้ากลุ่มด้วย **Bot basic ID** (เช่น `@123abcd` ดูได้จาก tab Messaging API)

> **ยังไม่ต้องพิมพ์อะไรในกลุ่ม** รอ webhook พร้อมก่อน เพราะข้อความที่พิมพ์ตอนนี้จะหายไปเปล่า ๆ

### A3. แจ้งความยินยอม (ทำจริงทุกครั้ง)

พิมพ์ในกลุ่มว่า *"กลุ่มนี้ใช้ทดสอบระบบบันทึกบทสนทนาสำหรับการอบรม ข้อความจะถูกเก็บลงฐานข้อมูลของผู้เรียน"*
ในระบบจริงต้องได้รับความยินยอมก่อนเสมอ ระบบที่เราสร้างจะให้บอทประกาศตัวเองตอนเข้ากลุ่มอยู่แล้ว

---

## Part B: สร้างตารางในฐานข้อมูล (5 นาที)

```bash
psql -U postgres -c "CREATE DATABASE linechat;"
```

Schema ที่ใช้ (มีให้แล้วใน `app/sql/01_schema.sql`)

```sql
CREATE TABLE line_messages (
    id              SERIAL PRIMARY KEY,
    line_message_id VARCHAR(64) UNIQUE,      -- กัน insert ซ้ำเมื่อ LINE retry webhook
    group_id        VARCHAR(64),             -- ID ของกลุ่ม (ขึ้นต้นด้วย C)
    user_id         VARCHAR(64),             -- ID ของผู้ส่ง (ขึ้นต้นด้วย U)
    display_name    VARCHAR(255),            -- ชื่อผู้ส่ง ณ เวลาที่ส่ง
    message_type    VARCHAR(20) NOT NULL,    -- text / sticker / image / ...
    message_text    TEXT,                    -- เนื้อความ (เฉพาะ type = text)
    sent_at         TIMESTAMPTZ NOT NULL,    -- เวลาส่งจริงจาก LINE
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_msg_group_time ON line_messages (group_id, sent_at DESC);
```

**อธิบาย 4 จุดออกแบบสำคัญให้ผู้เรียน**

| จุด | เหตุผล |
| --- | --- |
| `line_message_id UNIQUE` | LINE ส่ง event ซ้ำได้เมื่อไม่ได้รับ 200 ทันเวลา ต้องกันซ้ำที่ระดับฐานข้อมูล |
| เก็บ `display_name` ไว้ในแถว | ชื่อคนเปลี่ยนได้ ต้องเก็บชื่อ ณ เวลาที่พูด ไม่ใช่ join จากตารางอื่นทีหลัง |
| `sent_at` แยกจาก `created_at` | เวลาที่พูด vs เวลาที่เราบันทึก ต่างกันได้ (เช่นตอนระบบล่มแล้ว LINE retry) |
| `TIMESTAMPTZ` ไม่ใช่ `TIMESTAMP` | LINE ส่ง epoch เป็น UTC ถ้าเก็บผิดชนิด รายงาน "ของวันนี้" จะเพี้ยน |

รันจริง:

```bash
cd app
npm run db:setup
```

---

## Part C: ให้ Claude Code เขียน Webhook Server (25 นาที)

### C1. เตรียมโปรเจกต์

```bash
mkdir line-chat-recorder
cd line-chat-recorder
claude
```

### C2. Prompt สร้าง Webhook Server (copy ใช้ได้ทันที)

```
สร้าง webhook server สำหรับ LINE Messaging API ด้วย Node.js + Express + TypeScript
ไม่ใส่ semicolon ท้ายบรรทัด และเขียน comment ภาษาไทยอธิบายจุดสำคัญ

หน้าที่หลัก
1. POST /webhook รับ event จาก LINE
   - ตรวจ signature ด้วย channel secret ผ่าน middleware ของ @line/bot-sdk
   - สนใจเฉพาะ event type "message" ที่มาจากกลุ่ม (source.type === "group")
   - ถ้าเป็นข้อความ text ให้ดึงชื่อผู้ส่งด้วย getGroupMemberProfile
     แล้วบันทึกลง PostgreSQL ตาราง line_messages (ฐานข้อมูล linechat)
     ตาม schema ในไฟล์ sql/01_schema.sql ที่ผมจะวางให้
   - ถ้าเป็น type อื่น (sticker, image) ให้บันทึกเฉพาะ metadata ไม่มี message_text
   - ใช้ ON CONFLICT (line_message_id) DO NOTHING กันข้อมูลซ้ำ
2. GET /health ตอบ { status: "ok", messagesStored: จำนวนแถวในตาราง }
3. event type "join" (บอทถูกเชิญเข้ากลุ่ม) ให้ reply ข้อความแนะนำตัวและแจ้งว่า
   จะเริ่มบันทึกบทสนทนาตั้งแต่นี้ไป และมองข้อความก่อนหน้าไม่เห็น
4. event type "leave" ให้ log ว่าออกจากกลุ่มแล้ว

ข้อกำหนดทางเทคนิค
- ใช้ @line/bot-sdk เวอร์ชันล่าสุด และ pg
- อ่าน config จาก .env: CHANNEL_ACCESS_TOKEN, CHANNEL_SECRET, DATABASE_URL, PORT (default 3000)
- สร้าง .env.example และเพิ่ม .env ลง .gitignore
- webhook ต้องตอบ 200 เสมอแม้ฐานข้อมูลจะพัง (log error ไว้)
  เพราะถ้าตอบ error ซ้ำ ๆ LINE จะหยุดส่ง event มาให้
- ห้ามใช้ express.json() ครอบ route /webhook เพราะ middleware ต้องอ่าน raw body
- แยกไฟล์เป็น src/index.ts, src/config.ts, src/db.ts ให้อ่านง่าย
- log ทุกข้อความที่บันทึกลง console แบบอ่านง่าย

ติดตั้ง dependencies ให้เรียบร้อยและบอกวิธีรัน
```

จากนั้นวางไฟล์ `sql/01_schema.sql` ลงโปรเจกต์ และกรอกค่าจริงใน `.env`

> Channel secret อยู่ที่ tab **Basic settings** ไม่ใช่ tab Messaging API (คนละค่ากับ access token)

### C3. Prompt ตรวจงาน AI (ขั้นตอนที่คนมักข้าม)

```
ช่วยรีวิวโค้ดที่เพิ่งเขียนตามหัวข้อนี้ ตอบเป็นข้อ ๆ ว่าทำครบหรือไม่ ถ้าไม่ครบให้แก้ให้
1. ถ้าฐานข้อมูลล่ม /webhook ยังตอบ 200 หรือไม่
2. ถ้า signature ไม่ถูกต้อง จะตอบ status อะไร
3. express.json() ถูกวางไว้ครอบ /webhook หรือเปล่า
4. ถ้า getGroupMemberProfile ล้มเหลว ข้อความยังถูกบันทึกอยู่ไหม
5. ถ้า LINE ส่ง event เดิมซ้ำ จะเกิดข้อมูลซ้ำในตารางหรือไม่
6. มีการ log ค่า token หรือ secret ออก console ที่ไหนบ้าง (ถ้ามีต้องเอาออก)
```

### C4. เปิด Webhook สู่โลกภายนอกด้วย Cloudflare Tunnel

```bash
npm run dev                                      # terminal 1
cloudflared tunnel --url http://localhost:3000   # terminal 2
```

cloudflared จะพิมพ์ URL ออกมาในกรอบ เช่น `https://xxxx-yyyy-zzzz.trycloudflare.com`
คัดลอกไปที่ LINE Developers Console > tab **Messaging API** > **Webhook URL**
ใส่ `https://xxxx-yyyy-zzzz.trycloudflare.com/webhook` > กด **Verify** ต้องขึ้น Success > เปิด **Use webhook**

> **ข้อควรรู้ 2 ข้อ**
> 1. URL เปลี่ยนทุกครั้งที่ปิดแล้วเปิด cloudflared ใหม่ ต้องกลับมาแก้ใน Console ทุกครั้ง
>    ดังนั้น **เปิด tunnel ทิ้งไว้ตลอดคาบ อย่าปิด**
> 2. ถ้าใครถนัด ngrok อยู่แล้วใช้ได้ (`ngrok http 3000`) แต่แพลนฟรีปี 2026
>    จำกัด session ละ 2 ชั่วโมง ต้องต่อใหม่กลางคาบและ URL จะเปลี่ยนอีกครั้ง

**ทำให้ URL คงที่ (ทำครั้งเดียว ใช้ได้ตลอด - แนะนำสำหรับผู้ที่มีโดเมนอยู่บน Cloudflare)**

```bash
cloudflared tunnel login
cloudflared tunnel create line-workshop
cloudflared tunnel route dns line-workshop line.yourdomain.com
cloudflared tunnel run --url http://localhost:3000 line-workshop
```

จากนั้น Webhook URL จะเป็น `https://line.yourdomain.com/webhook` ตลอดไป ไม่ต้องแก้ใน Console อีก

### C5. ทดสอบเก็บข้อความจริง (10 นาที) - ช่วงที่สนุกที่สุด

ให้สมาชิกในกลุ่มคุยกันจริงในหัวข้อจำลอง **"วางแผนงานทีมปฏิบัติการสัปดาห์นี้"**
ให้ได้ 25-30 ข้อความ และต้องมีองค์ประกอบเหล่านี้ (จำเป็นสำหรับ Workshop 4)

- มีการ **มอบหมายงาน** ชัดเจน เช่น "ฝากนภาทำใบขอซื้อภายในวันนี้"
- มีการ **รับปาก** เช่น "รับทราบครับ ผมจะสรุปยอดส่งให้พรุ่งนี้"
- มีการ **นัดหมาย** เช่น "ประชุมจันทร์ 9 โมง"
- มีเรื่องที่ **ตกลงไม่ได้** เพื่อดูว่า AI สรุปประเด็นค้างเป็นไหม
- แทรก sticker 2-3 ตัว เพื่อดูว่าระบบเก็บ metadata ถูกไหม

ตรวจใน terminal ว่ามี log `[บันทึก] ...` ไหลเข้า และตรวจในฐานข้อมูล

```bash
psql -U postgres -d linechat -c "SELECT display_name, message_type, message_text, sent_at FROM line_messages ORDER BY sent_at DESC LIMIT 10;"
```

### C6. หา groupId เก็บไว้ใช้ส่งกลับ

```bash
psql -U postgres -d linechat -c "SELECT DISTINCT group_id FROM line_messages;"
```

จด groupId (ขึ้นต้นด้วย `C`) ไว้ ใช้ใน Workshop 4 และ 5

---

## Part D: ถ้าไม่มีกลุ่มจริง / เชิญบอทเข้ากลุ่มไม่สำเร็จ (แผนสำรอง)

ชุดไฟล์ workshop มีทางเลือกให้เรียนต่อได้ทันที ไม่ต้องรอแก้ปัญหา LINE

```bash
cd app
npm run seed:chat       # ใส่บทสนทนากลุ่มจำลอง 164 ข้อความ ใน 3 กลุ่ม
npm run dev
```

เปิด http://localhost:3000/simulator แล้วพิมพ์บทสนทนาเพิ่มเองได้ (บรรทัดละ 1 ข้อความ)
ข้อมูลจะลงตาราง `line_messages` เหมือนมาจาก LINE จริง ทำ Workshop 4-5 ต่อได้ครบ

---

## เกร็ดสำคัญที่ต้องย้ำในคลาส

1. **บอทมองข้อความก่อนเข้ากลุ่มไม่เห็น** - ผู้เรียนมักถามว่า "ทำไมข้อความเมื่อวานไม่เข้า" คำตอบอยู่ที่นี่
2. **ต้องตอบ 200 เสมอ** - ถ้าตอบ 500 ซ้ำ ๆ LINE จะปิด webhook ให้อัตโนมัติ
3. **signature ต้องคำนวณจาก raw body** - ถ้าใส่ `express.json()` ก่อน middleware จะพังทันที
4. **userId ไม่จำเป็นต้องมี** - ถ้าผู้ใช้ปิดการแชร์โปรไฟล์ `source.userId` จะเป็น undefined โค้ดต้องรับมือได้
5. **ห้าม commit .env** - Channel access token คือกุญแจของ OA ทั้งบัญชี

---

## Checkpoint

- [ ] `curl http://localhost:3000/health` ตอบ `{"status":"ok",...}`
- [ ] Verify webhook ใน Console ขึ้น Success
- [ ] พิมพ์ในกลุ่มแล้วเห็น log `[บันทึก]` ใน terminal
- [ ] `SELECT COUNT(*) FROM line_messages` ได้เลขที่เพิ่มขึ้นจริง
- [ ] จด groupId ไว้แล้ว
- [ ] อธิบายได้ว่าทำไม webhook ต้องตอบ 200 เสมอ
