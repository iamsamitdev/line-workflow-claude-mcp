# Deploy ขึ้นใช้งานจริง: Render Starter + Neon

เอกสารนี้เป็นภาคต่อของ Workshop 5 สำหรับผู้เรียนที่อยากเอาระบบไปใช้จริงในองค์กร
ไม่ใช่แค่รันบนเครื่องตัวเองตอนอบรม

---

## เลือกอะไรและทำไม

| ส่วน | ที่แนะนำ | ค่าใช้จ่าย |
| --- | --- | --- |
| เว็บ (webhook + dashboard) | **Render** แผน **Starter** | ประมาณ 7 USD/เดือน |
| ฐานข้อมูล | **Neon** แผนฟรี | 0 บาท |
| ตัวตั้งเวลา | ตัวตั้งเวลาในตัวโปรแกรม (`ENABLE_SCHEDULER=true`) | 0 บาท |
| tunnel | ไม่ต้องใช้แล้ว (มี URL จริงจาก Render) | 0 บาท |
| **รวม** | | **ประมาณ 7 USD/เดือน (ราว 250 บาท)** |

### ทำไมต้องเสียเงิน 7 USD ทั้งที่ Render มีแผนฟรี

เพราะข้อจำกัดข้อเดียวของ LINE

> LINE ต้องได้รับ HTTP 2xx กลับจาก webhook **ภายในราว 2 วินาที**
> ถ้าเกิน จะขึ้น error `request_timeout` และ event นั้นหลุดไป

แผนฟรีของ Render จะ **sleep หลังไม่มี traffic 15 นาที** และตอนตื่นใช้เวลา **30-60 วินาที**
ช่วงนั้นข้อความในกลุ่มจะหายทั้งหมด ซึ่งยอมรับไม่ได้สำหรับระบบที่องค์กรใช้จริง

การเปิด webhook redelivery ใน LINE ช่วยได้บางส่วน แต่เอกสารของ LINE เองระบุว่า
**ไม่รับประกันว่าจะส่งซ้ำสำเร็จ** จึงไม่ควรพึ่งเป็นทางแก้หลัก

แผน Starter รันค้างตลอด ไม่มี cold start และทำให้ `ENABLE_SCHEDULER=true` ทำงานได้จริง
โดยไม่ต้องซื้อ Render Cron Job แยกอีกก้อน

### ทำไมฐานข้อมูลไม่ใช้ของ Render

Render มี PostgreSQL ฟรี แต่ **หมดอายุ 30 วันหลังสร้าง** แล้วข้อมูลถูกลบ (มีเวลาผ่อนผัน 14 วันให้อัปเกรด)
ส่วน Neon แผนฟรี **ไม่มีวันหมดอายุ** และมี auto-suspend/resume อัตโนมัติ เหมาะกว่าชัดเจน

> ถ้าองค์กรมีงบเพิ่ม การใช้ Render Postgres แผนจ่ายเงินก็สะดวกกว่าเพราะอยู่ในระบบเดียวกัน
> และมี backup ให้ แต่สำหรับ "เริ่มต้นให้ถูกที่สุด" Neon ฟรีคือคำตอบ

---

## ขั้นที่ 1: สร้างฐานข้อมูลบน Neon (10 นาที)

1. สมัครที่ https://neon.com (ล็อกอินด้วย GitHub ได้)
2. **Create project**
   - ชื่อ: `line-workflow`
   - Region: **Asia Pacific (Singapore)** เพื่อให้ latency ต่ำสุดจากไทย
   - Postgres version: 16 ขึ้นไป
3. หน้า **Connection Details** เลือกให้ถูก 2 อย่าง
   - Database: `neondb` (หรือสร้างใหม่ชื่อ `linechat`)
   - **ติ๊ก "Pooled connection"** ← สำคัญมาก
4. คัดลอก connection string เก็บไว้ หน้าตาประมาณนี้

```
postgres://user:password@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**ทำไมต้อง pooled:** connection string ธรรมดาจำกัดจำนวน connection ต่ำ
ถ้าเว็บเปิดหลาย connection พร้อมกันจะเจอ error `too many connections`
ตัวที่มีคำว่า `-pooler` ผ่าน PgBouncer ให้แล้ว รองรับได้มากกว่า

---

## ขั้นที่ 2: เตรียมตารางในฐานข้อมูล (5 นาที)

ทำจาก **เครื่องตัวเอง** ครั้งเดียว ง่ายและตรวจผลได้ทันที

Windows (Command Prompt):

```cmd
cd app
set DATABASE_URL=postgres://user:pass@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
npm run db:setup
```

macOS / Linux:

```bash
cd app
DATABASE_URL="postgres://user:pass@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" npm run db:setup
```

ต้องขึ้น "พร้อมใช้งาน" พร้อมจำนวนแถว ถ้าติด error ให้ตรวจว่า

- ต่อท้าย `?sslmode=require` แล้วหรือยัง (Neon บังคับ SSL)
- copy connection string มาครบไม่ตกอักขระ
- รหัสผ่านมีอักขระพิเศษที่ต้อง encode หรือไม่ (เช่น `@` ต้องเป็น `%40`)

> **ถ้าเป็นระบบขององค์กรจริง** ให้รัน `npm run db:setup` แบบไม่ใส่ข้อมูลจำลอง
> คือรันแค่ schema: `npm run db:setup -- --only=01`
> ข้อมูล seed ทั้งหมดเป็นข้อมูลสมมติเพื่อการอบรมเท่านั้น

---

## ขั้นที่ 3: เอาโค้ดขึ้น GitHub (10 นาที)

```bash
cd app
git init
git add .
git commit -m "LINE workflow automation"
git branch -M main
git remote add origin https://github.com/<ชื่อคุณ>/line-workflow.git
git push -u origin main
```

**ตรวจก่อน push ให้แน่ใจ**

```bash
git status --short          # ต้องไม่เห็น .env
cat .gitignore | grep .env  # ต้องมี .env อยู่ในนั้น
```

> ถ้าเผลอ push `.env` ที่มี token ขึ้นไปแล้ว **ต้องออก Channel access token ใหม่ทันที**
> การลบ commit ทีหลังไม่ช่วย เพราะ token ถูกเห็นไปแล้ว

repo ควรตั้งเป็น **private** สำหรับระบบขององค์กร

---

## ขั้นที่ 4: สร้าง Web Service บน Render (15 นาที)

ในโปรเจกต์มีไฟล์ `render.yaml` เตรียมไว้แล้ว จะใช้แบบ Blueprint หรือสร้างมือก็ได้

### แบบ Blueprint (เร็วกว่า)

1. สมัคร/ล็อกอิน https://render.com
2. **New > Blueprint** เลือก repo ที่เพิ่ง push
3. Render จะอ่าน `render.yaml` แล้วขอให้กรอกค่า env ที่ทำเครื่องหมาย `sync: false`

### แบบสร้างมือ

**New > Web Service** แล้วตั้งค่า

| ช่อง | ค่า |
| --- | --- |
| Language / Runtime | Node |
| Region | Singapore |
| Branch | main |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Instance Type | **Starter** (ไม่ใช่ Free) |
| Health Check Path | `/health` |

### Environment Variables ที่ต้องกรอก

| ตัวแปร | ค่า | หมายเหตุ |
| --- | --- | --- |
| `NODE_ENV` | `production` | เปิด session ใน DB, secure cookie, trust proxy อัตโนมัติ |
| `TZ` | `Asia/Bangkok` | ให้เวลาในรายงานและ cron ตรงกับเวลาไทย |
| `DATABASE_URL` | connection string แบบ pooled จาก Neon | ต้องมี `?sslmode=require` |
| `PG_POOL_MAX` | `5` | ฐานข้อมูลฟรีจำกัด connection |
| `CHANNEL_ACCESS_TOKEN` | จาก LINE Developers Console | |
| `CHANNEL_SECRET` | จาก tab Basic settings | ต้องใส่ ไม่งั้น webhook จะข้ามการตรวจ signature |
| `MOCK_LINE` | `false` | ส่งเข้า LINE จริง |
| `DEFAULT_GROUP_ID` | groupId ของกลุ่มผู้บริหาร | ให้ตัวตั้งเวลารู้ว่าจะส่งไปไหน |
| `SESSION_SECRET` | ข้อความสุ่มยาว | Render กด Generate ให้ได้ |
| `ADMIN_USERNAME` | ชื่อผู้ใช้ของ admin | |
| `ADMIN_PASSWORD_HASH` | ผลลัพธ์จาก `npm run hash-password -- <รหัส>` | **อย่าใช้ `ADMIN_PASSWORD` แบบข้อความธรรมดาบน production** |
| `ENABLE_SCHEDULER` | `true` | ให้โปรแกรมตั้งเวลารันงานเอง |
| `SUMMARY_CRON` | `0 18 * * *` | สรุปแชททุกเย็น 18:00 |
| `REPORT_CRON` | `0 8 * * *` | รายงานผู้บริหารทุกเช้า 08:00 |
| `ANTHROPIC_API_KEY` | (ถ้ามี) | ไม่ใส่ก็ได้ ระบบจะใช้ตัวสรุป rule-based |

สร้าง hash ของรหัสผ่านจากเครื่องตัวเองก่อน

```bash
npm run hash-password -- รหัสผ่านที่ต้องการ
```

แล้วคัดลอกค่า `$2b$10$...` ไปใส่ `ADMIN_PASSWORD_HASH`

กด **Create Web Service** แล้วรอ build ประมาณ 2-4 นาที
เมื่อขึ้น **Live** จะได้ URL แบบ `https://line-workflow-xxxx.onrender.com`

---

## ขั้นที่ 5: เชื่อม LINE เข้ากับ URL จริง (5 นาที)

1. ทดสอบก่อน: เปิด `https://<ของคุณ>.onrender.com/health`
   ต้องได้ `{"status":"ok","messagesStored":...,"lineMode":"live"}`
2. LINE Developers Console > tab **Messaging API** > **Webhook URL**
   ใส่ `https://<ของคุณ>.onrender.com/webhook` > กด **Verify** ต้องขึ้น Success
3. เปิด **Use webhook**
4. เปิด **Webhook redelivery** ด้วย (เป็นตาข่ายสำรอง ไม่ใช่ทางแก้หลัก)
5. เปิด dashboard `https://<ของคุณ>.onrender.com/` ล็อกอินด้วยบัญชี admin ที่ตั้งไว้
6. พิมพ์ข้อความในไลน์กลุ่ม แล้วดูว่าเข้าหน้า **ประวัติแชท** จริง

**ตั้งแต่นี้ไม่ต้องใช้ cloudflared อีก** เพราะมี URL สาธารณะแบบถาวรแล้ว

---

## ขั้นที่ 6: ตรวจว่าตัวตั้งเวลาทำงาน

ดู **Logs** ใน Render ตอนเซิร์ฟเวอร์เพิ่งเริ่ม ต้องเห็นบรรทัดนี้

```
[scheduler] ตั้งงานสรุปแชทไว้ที่ "0 18 * * *" (Asia/Bangkok)
[scheduler] ตั้งงานรายงานผู้บริหารไว้ที่ "0 8 * * *" (Asia/Bangkok)
```

ถ้าไม่อยากรอถึงเวลาจริง ทดสอบได้ 2 ทาง

1. ตั้ง `REPORT_CRON` เป็นเวลาอีก 2-3 นาทีข้างหน้าชั่วคราว แล้วดู log
2. กดปุ่มในหน้า `/sales` ของ dashboard ซึ่งเรียกตรรกะเดียวกัน

---

## ตารางเทียบ: รันในเครื่อง vs ขึ้น Render

| หัวข้อ | ในเครื่อง (ในคลาส) | บน Render Starter |
| --- | --- | --- |
| URL ของ webhook | cloudflared (เปลี่ยนทุกครั้งที่รันใหม่) | `https://xxx.onrender.com` ถาวร |
| ฐานข้อมูล | PostgreSQL ในเครื่อง หรือ Docker | Neon (ฟรี) |
| `NODE_ENV` | `development` | `production` |
| Session | ใน memory | ใน PostgreSQL (`user_sessions`) |
| Cookie | ธรรมดา | `Secure` + trust proxy |
| ตั้งเวลา | Windows Task Scheduler | `ENABLE_SCHEDULER=true` |
| ปิดเครื่องแล้ว | ระบบหยุด | ยังทำงานอยู่ |
| ค่าใช้จ่าย | 0 บาท | ประมาณ 7 USD/เดือน |

---

## Checklist ความปลอดภัยก่อนใช้จริงกับองค์กร

- [ ] `.env` **ไม่ได้** อยู่ใน git (`git log --all --oneline -- .env` ต้องว่าง)
- [ ] `SESSION_SECRET` ไม่ใช่ค่าเริ่มต้น และยาวอย่างน้อย 32 ตัวอักษร
- [ ] ใช้ `ADMIN_PASSWORD_HASH` ไม่ใช่ `ADMIN_PASSWORD`
- [ ] `CHANNEL_SECRET` ถูกตั้งค่าแล้ว (webhook ตรวจ signature จริง)
- [ ] repo เป็น private
- [ ] แจ้งสมาชิกทุกคนในไลน์กลุ่มก่อนเก็บบทสนทนา และติ๊กยืนยันในหน้า `/groups`
- [ ] กำหนดนโยบายระยะเวลาเก็บข้อมูล (เช่น 90 วัน) และมีสคริปต์ลบจริง
- [ ] MCP ที่ต่อฐานข้อมูล production ใช้ user แบบ **read-only** เท่านั้น
- [ ] ตั้งการแจ้งเตือนของ Render (Notifications) ให้ส่งอีเมลเมื่อ deploy fail หรือ service down
- [ ] ทดสอบ restore ฐานข้อมูลจาก backup ได้จริง (แผนฟรีของ Neon ไม่มี point-in-time restore)

สร้าง read-only user บน Neon สำหรับให้ AI ต่อผ่าน MCP

```sql
CREATE USER ai_reader WITH PASSWORD 'ตั้งรหัสยาว ๆ';
GRANT CONNECT ON DATABASE neondb TO ai_reader;
GRANT USAGE ON SCHEMA public TO ai_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ai_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ai_reader;
```

---

## ปัญหาที่พบบ่อยตอน deploy

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| Build ผ่านแต่เปิดเว็บขึ้น error หา view ไม่เจอ | `npm run build` ต้องรัน `copy-views.mjs` ต่อท้ายด้วย ตรวจว่า Build Command เป็น `npm ci && npm run build` |
| ล็อกอินแล้วเด้งกลับหน้า login ทุกครั้ง | cookie เป็น `Secure` แต่เข้าผ่าน http หรือยังไม่ได้ตั้ง `NODE_ENV=production` (ทำให้ `TRUST_PROXY` ไม่เปิด) |
| `no pg_hba.conf entry ... no encryption` | ลืมใส่ `?sslmode=require` ใน `DATABASE_URL` |
| `too many connections` | ใช้ connection string ที่ไม่ใช่ pooled หรือ `PG_POOL_MAX` สูงเกิน ให้ลดเป็น 5 |
| `relation "line_messages" does not exist` | ยังไม่ได้รัน `npm run db:setup` ชี้ไปที่ Neon (ขั้นที่ 2) |
| Verify webhook ไม่ผ่าน | URL ต้องต่อท้าย `/webhook` และ service ต้องขึ้นสถานะ Live แล้ว |
| ข้อความในกลุ่มไม่เข้าระบบ แต่ `/health` ปกติ | ตรวจว่า `MOCK_LINE=false` และ `CHANNEL_SECRET` ถูกต้อง แล้วดู Logs ของ Render |
| ตัวตั้งเวลาไม่ยิงตามเวลา | ตรวจ `TZ=Asia/Bangkok` และ `ENABLE_SCHEDULER=true` แล้วดู log ตอน start |
| งานถูกส่งซ้ำ 2-3 ครั้ง | มีหลาย instance (scale > 1) ตัวตั้งเวลาในโปรเซสจะยิงทุก instance ให้ลดเหลือ 1 หรือย้ายไป cron ภายนอก |
| ล็อกอินหลุดทุกครั้งที่ deploy | `SESSION_IN_DATABASE` ไม่ได้เปิด (ปกติเปิดเองเมื่อ `NODE_ENV=production`) |

---

## ถ้างบเป็นศูนย์จริง ๆ ทำอย่างไร

เรียงตามความคุ้มค่าสำหรับกรณี "ต้องฟรีล้วน"

1. **รันบนเครื่ององค์กรที่เปิดตลอด + cloudflared named tunnel**
   ฟรีทั้งหมด ไม่มี cold start ใช้ Task Scheduler ได้ตามที่เรียนใน Workshop 5 เลย
   เหมาะกับองค์กรที่มีเครื่องเปิดค้างอยู่แล้ว
2. **Oracle Cloud Always Free** (ARM 2 OCPU / 12 GB) รัน Docker Compose ทั้ง app + Postgres + Caddy
   ฟรีถาวรและ always on แต่ขั้นตอนสมัครยุ่งและต้องมีทักษะ Linux
3. **Google Cloud Run + Neon** ฟรี 2 ล้าน request/เดือน แต่ scale-to-zero ทำให้มี cold start
   ประมาณ 1-3 วินาที ซึ่ง**เสี่ยงชนกำหนด 2 วินาทีของ LINE**

ทั้ง 3 ทางนี้ยังต้องดูแลเองมากกว่า Render Starter อย่างชัดเจน
สำหรับองค์กรที่จ่ายได้ 250 บาทต่อเดือน Render Starter คุ้มค่าเวลาที่ประหยัดไปมาก

---

## เอกสารอ้างอิง

- Render - Free tier และ instance types: https://render.com/docs/free
- Render - Deploy a Node.js app: https://render.com/docs/deploy-node-express-app
- Render - Blueprint (`render.yaml`): https://render.com/docs/infrastructure-as-code
- Neon - Connection pooling: https://neon.com/docs/connect/connection-pooling
- Neon - Free plan: https://neon.com/docs/introduction/plans
- LINE - Webhook redelivery: https://developers.line.biz/en/docs/messaging-api/receiving-messages/#webhook-redelivery
- LINE - ตรวจสาเหตุ webhook error: https://developers.line.biz/en/docs/messaging-api/check-webhook-error-statistics/
- Cloudflare Tunnel - Named tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-remote-tunnel/
- node-cron: https://github.com/node-cron/node-cron

> **หมายเหตุ:** ราคาและเงื่อนไขของ free tier เปลี่ยนบ่อยมาก
> ข้อมูลในเอกสารนี้อ้างอิงสถานะเดือนกรกฎาคม 2026 ควรตรวจหน้า pricing ก่อนตัดสินใจทุกครั้ง
