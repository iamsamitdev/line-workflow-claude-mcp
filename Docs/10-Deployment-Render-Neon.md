# Deploy ขึ้นใช้งานจริง: Render Starter + Neon

เอกสารนี้เป็นภาคต่อของ Workshop 5 สำหรับผู้เรียนที่อยากเอาระบบไปใช้จริงในองค์กร
ไม่ใช่แค่รันบนเครื่องตัวเองตอนอบรม

---

## เลือกอะไรและทำไม

| ส่วน | ที่แนะนำ | ค่าใช้จ่าย |
| --- | --- | --- |
| เว็บ (webhook + dashboard) | **Render** แผน **Starter** | ประมาณ 7 USD/เดือน |
| ฐานข้อมูล | **Neon** แผนฟรี | 0 บาท |
| ที่เก็บไฟล์ (รูป/เอกสารจากกลุ่ม) | **Cloudflare R2** แผนฟรี 10 GB | 0 บาท (ถ้าไม่เกิน 10 GB) |
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

### ทำไมไฟล์ต้องไม่อยู่บนดิสก์ของ Render

ถ้าเปิด Workshop 6 (เก็บรูปและไฟล์เอกสารจากกลุ่ม) ค่าเริ่มต้นคือ `MEDIA_STORAGE_DRIVER=local`
ซึ่งเขียนไฟล์ลงโฟลเดอร์ `storage/media` ของเครื่องที่รันอยู่ **บน Render ใช้แบบนี้ไม่ได้**

> ดิสก์ของ Render เป็นแบบ **ephemeral** คือทุกครั้งที่ deploy ใหม่ หรือ restart
> ระบบจะสร้าง container ใหม่จาก image ที่ build มา **ไฟล์ที่เขียนเพิ่มหลัง build จะหายทั้งหมด**

แถวใน `media_files` จะยังอยู่ (เพราะอยู่ใน Neon) แต่ `storage_key` จะชี้ไปยังไฟล์ที่ไม่มีแล้ว
เปิดหน้าแกลเลอรีจะขึ้น `อ่านไฟล์จาก storage ไม่ได้` ทุกไฟล์ที่เก็บก่อน deploy รอบล่าสุด

ทางเลือกและเหตุผลที่เลือก R2

| ทางเลือก | ข้อดี | ข้อเสีย |
| --- | --- | --- |
| Render Persistent Disk | ตั้งค่าง่าย โค้ดเดิมใช้ได้เลย | จ่ายเพิ่มตาม GB, **บังคับให้เหลือ 1 instance**, deploy แบบ zero-downtime ไม่ได้ (ต้องดับตัวเก่าก่อนถึงจะปล่อยดิสก์) และย้ายผู้ให้บริการทีหลังลำบาก |
| AWS S3 | มาตรฐานอุตสาหกรรม เครื่องมือครบที่สุด | **คิดค่า egress** ทุกครั้งที่ดาวน์โหลดไฟล์ออก ซึ่งหน้าแกลเลอรีทำบ่อย |
| **Cloudflare R2** ← ที่เลือก | **ไม่คิดค่า egress เลย**, ฟรี 10 GB/เดือน, ใช้ S3 API ได้ตรง ๆ, โค้ดฝั่งเราพร้อมแล้ว | ต้องสมัคร Cloudflare และผูกบัตรเพื่อยืนยันตัวตน แม้จะใช้แค่โควตาฟรี |

หน้าแกลเลอรีของ dashboard คือ **งานอ่านไฟล์ซ้ำ ๆ** ค่า egress จึงเป็นต้นทุนที่โตตามการใช้งาน
R2 ตัดค่าใช้จ่ายก้อนนี้ทิ้งทั้งหมด และยังพูด S3 API ภาษาเดียวกัน ถ้าวันหลังจะย้ายไป S3 จริงก็แค่เปลี่ยน env

**โควตาแผนฟรีของ R2 (ต่อเดือน)**

| รายการ | โควตาฟรี | ระบบเราใช้ตอนไหน |
| --- | --- | --- |
| พื้นที่เก็บ | 10 GB | ไฟล์สะสมทั้งหมด (ตั้ง `MEDIA_MAX_SIZE_MB` กันไฟล์ใหญ่ผิดปกติ) |
| Class A (เขียน/list) | 1,000,000 ครั้ง | `PutObject` ตอนมีคนส่งไฟล์เข้ากลุ่ม + `ListObjectsV2` ตอนเปิดหน้าแกลเลอรี |
| Class B (อ่าน) | 10,000,000 ครั้ง | `GetObject` ตอน admin เปิดดูไฟล์ |
| **egress (ดาวน์โหลดออก)** | **ไม่จำกัด ไม่คิดเงิน** | ทุกครั้งที่เปิดรูปใน dashboard |

> ประเมินคร่าว ๆ: รูปจากไลน์กลุ่มเฉลี่ยราว 300 KB ต่อไฟล์ 10 GB คือประมาณ **30,000 ไฟล์**
> ทีมขนาด 20-30 คนที่ส่งรูปวันละ 20-30 รูป ใช้เวลาราว 3-4 ปีกว่าจะเต็ม
> และถ้าตั้ง retention 90 วันตาม Workshop 6 จะไม่มีวันเต็มเลย

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
| `MEDIA_ARCHIVE_ENABLED` | `false` ไปก่อน | ค่ากลุ่ม `MEDIA_*` และ `S3_*` ทั้งหมดอยู่ใน **ขั้นที่ 7** ถ้าจะเก็บไฟล์จากกลุ่มด้วย |

> ⚠️ **อย่าเพิ่งตั้ง `MEDIA_ARCHIVE_ENABLED=true` ในขั้นนี้** ถ้าเปิดโดยที่ยังไม่ได้ต่อ object storage
> ระบบจะเขียนไฟล์ลงดิสก์ของ Render ซึ่งเป็นแบบ ephemeral แล้วไฟล์หายทุกครั้งที่ deploy
> ให้ทำขั้นที่ 7 ให้จบก่อนแล้วค่อยเปิด

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

## ขั้นที่ 7: ย้ายที่เก็บไฟล์ขึ้น Cloudflare R2 (30-40 นาที)

> **ทำขั้นนี้เมื่อ:** เปิด `MEDIA_ARCHIVE_ENABLED=true` คือใช้ Workshop 6 เก็บรูปและไฟล์จากกลุ่ม
> **ถ้าไม่เก็บไฟล์:** ตั้ง `MEDIA_ARCHIVE_ENABLED=false` บน Render แล้วข้ามทั้งขั้นนี้ไปได้เลย

โครงสร้างโค้ดเตรียมไว้ให้แล้ว โค้ดส่วนอื่นของระบบเรียกที่เก็บไฟล์ผ่าน `getStorage()` เท่านั้น
(ดู `src/services/storage.ts`) จึงย้ายจากดิสก์ขึ้น R2 ได้โดย **แก้ไฟล์เดียว** ไม่ต้องแตะ webhook,
`services/media.ts` หรือ dashboard เลยแม้แต่บรรทัดเดียว

```
webhook.ts ─┐
media.ts   ─┼──► getStorage() ──► LocalDiskStorage  (MEDIA_STORAGE_DRIVER=local)
admin.ts   ─┘         │
seed-media ───────────┘         └► S3Storage        (MEDIA_STORAGE_DRIVER=s3)  ← ขั้นนี้เปิดตัวนี้
```

---

### 7.1 สร้าง bucket บน Cloudflare R2

1. สมัคร/ล็อกอิน https://dash.cloudflare.com (บัญชีฟรีพอ)
2. เมนูซ้าย **R2 Object Storage** > **Create bucket**
   - ถ้าเป็นการใช้ R2 ครั้งแรก จะขอให้ผูกบัตรเครดิตเพื่อยืนยันตัวตนก่อน
     **ยังไม่ถูกเรียกเก็บเงินถ้าใช้ไม่เกินโควตาฟรี** แต่ควรตั้ง budget alert ไว้ด้วย
3. ตั้งค่า bucket
   - **Bucket name**: `line-workflow-media` (ชื่อนี้จะเป็นค่า `S3_BUCKET`)
   - **Location**: เลือก **Automatic** พร้อม **Location hint: Asia-Pacific (APAC)**
     เพื่อให้ข้อมูลอยู่ใกล้ทั้ง Render Singapore และผู้ใช้ในไทย
   - **Default storage class**: **Standard** (อย่าเลือก Infrequent Access เพราะหน้าแกลเลอรีอ่านบ่อย
     และคลาสนั้นคิดค่า retrieval เพิ่มต่างหาก)
4. กด **Create bucket**

> ⚠️ **ห้ามกด "Allow Access" / เปิด public r2.dev URL หรือผูก custom domain แบบสาธารณะ**
> ไฟล์จากไลน์กลุ่มมีทั้งสลิปโอนเงิน บัตรประชาชน และเอกสารสัญญา
> ระบบเราตั้งใจให้ไฟล์ออกทาง `GET /media/:id/file` ซึ่ง **ตรวจ session ก่อนเสมอ**
> ถ้าเปิด public URL เท่ากับยกเลิกการป้องกันนั้นทั้งหมด ใครเดา key ถูกก็เปิดดูได้

---

### 7.2 ออก API token สำหรับ bucket นี้

R2 ใช้ credential คนละชุดกับ Cloudflare API token ปกติ ต้องออกจากหน้า R2 เท่านั้น

1. หน้า **R2 Object Storage** > เมนู **API** (มุมขวาบน) > **Manage API tokens**
2. **Create Account API token**
3. ตั้งค่า
   | ช่อง | ค่าที่ควรใส่ |
   | --- | --- |
   | Token name | `line-workflow-render` (ตั้งชื่อให้รู้ว่าใครใช้ เวลาจะเพิกถอนจะได้ไม่งง) |
   | Permissions | **Object Read & Write** (ไม่ใช่ Admin Read & Write) |
   | Specify bucket(s) | **Apply to specific buckets only** > เลือก `line-workflow-media` |
   | TTL | ตั้งวันหมดอายุตามนโยบายองค์กร หรือ Forever ถ้ายังไม่มีนโยบาย |
4. กด **Create Account API Token** แล้ว **คัดลอกค่า 3 อย่างทันที** (ปิดหน้าแล้วดูซ้ำไม่ได้)

```
Access Key ID        -> S3_ACCESS_KEY_ID
Secret Access Key    -> S3_SECRET_ACCESS_KEY
Endpoint for S3 API  -> S3_ENDPOINT   เช่น https://a1b2c3d4e5f6.r2.cloudflarestorage.com
```

> 🎓 **จุดสอนเรื่องสิทธิ์:** เลือก **Object Read & Write** ไม่ใช่ **Admin Read & Write**
> เพราะระบบเราต้องการแค่ put / get / delete / list ของใน bucket เดียวเท่านั้น
> ไม่ต้องมีสิทธิ์สร้างหรือลบ bucket หลักคิดเดียวกับ read-only user ของ Postgres MCP
> คือ **ให้สิทธิ์น้อยที่สุดเท่าที่ทำงานได้** เพื่อจำกัดความเสียหายเมื่อ key รั่ว

**ค่า `S3_ENDPOINT` เอามาจากไหนได้อีก** — หน้ารายละเอียด bucket > tab **Settings** > หัวข้อ
**S3 API** จะแสดง URL เต็มแบบมี bucket ต่อท้าย เช่น

```
https://a1b2c3d4e5f6.r2.cloudflarestorage.com/line-workflow-media
        └──────── account id ────────┘        └──── ตัดส่วนนี้ทิ้ง ────┘
```

> ⚠️ **ใส่เฉพาะส่วนโดเมน อย่าใส่ชื่อ bucket ต่อท้ายใน `S3_ENDPOINT`**
> เพราะ SDK จะเติมชื่อ bucket ให้เองจาก `S3_BUCKET` ถ้าใส่ซ้ำจะกลายเป็น
> `line-workflow-media.r2.../line-workflow-media/...` แล้วขึ้น `NoSuchBucket`

---

### 7.3 ฝั่งโค้ด: เตรียมไว้ให้แล้ว

**ไม่ต้องเขียนโค้ดเพิ่มในขั้นนี้** ชุดไฟล์ในโปรเจกต์มีของครบแล้วทั้ง 3 อย่าง

| ของที่มีให้แล้ว | อยู่ที่ไหน |
| --- | --- |
| `@aws-sdk/client-s3` ใน dependencies | `package.json` |
| `class S3Storage` ที่ทำงานได้จริง (put / get / delete / exists / usage) | `src/services/storage.ts` |
| คำสั่งตรวจการเชื่อมต่อ และคำสั่งย้ายไฟล์เดิม | `npm run storage:check` / `npm run media:migrate` |

ตรวจว่าติดตั้งครบจริง

```bash
cd line-workflow-app
npm install          # ถ้าเพิ่ง clone หรือเพิ่ง pull มาใหม่
npm run typecheck    # ต้องผ่านโดยไม่มี error
```

> ⚠️ **ถ้าแก้ `package.json` เอง อย่าลืม commit `package-lock.json` ด้วย**
> ไม่งั้น `npm ci` บน Render จะไม่ติดตั้งให้ แล้ว build พังด้วย `Cannot find module '@aws-sdk/client-s3'`

---

### 7.4 โค้ดฝั่ง S3 driver ทำงานอย่างไร

อ่านเพื่อให้อธิบายได้ ไม่ต้องแก้ ตัวที่ทำงานจริงอยู่ใน `src/services/storage.ts`

```typescript
class S3Storage implements Storage {
  readonly driver = 's3' as const
  private client: S3Client
  private bucket: string

  constructor() {
    const s3 = config.media.s3
    // ตรวจค่าที่ขาดตั้งแต่ตอนสร้าง จะได้รู้สาเหตุทันทีแทนที่จะไปพังตอนอัปโหลดไฟล์จริง
    if (!s3.bucket) {
      throw new Error('ตั้ง MEDIA_STORAGE_DRIVER=s3 แล้วแต่ยังไม่ได้ใส่ S3_BUCKET ใน .env')
    }
    if (!s3.accessKeyId || !s3.secretAccessKey) {
      throw new Error(
        'ตั้ง MEDIA_STORAGE_DRIVER=s3 แล้วแต่ยังไม่ได้ใส่ S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY ใน .env'
      )
    }

    this.bucket = s3.bucket
    this.client = new S3Client({
      region: s3.region || 'auto',
      // ว่างไว้ = ใช้ AWS S3 จริง / ใส่ = Cloudflare R2 หรือ MinIO
      endpoint: s3.endpoint || undefined,
      credentials: {
        accessKeyId: s3.accessKeyId,
        secretAccessKey: s3.secretAccessKey
      },
      // SDK รุ่นใหม่แนบ checksum header มาให้ทุก request ซึ่งบริการที่เข้ากันได้กับ S3
      // บางเจ้ายังไม่รองรับ ตั้งเป็น WHEN_REQUIRED เพื่อความเข้ากันได้สูงสุด
      // ความถูกต้องของข้อมูลยังตรวจได้อยู่ เพราะเราเก็บ sha256 ของทุกไฟล์ไว้ในฐานข้อมูลเอง
      requestChecksumCalculation: 'WHEN_REQUIRED'
    })
  }

  async put(key: string, data: Buffer): Promise<PutResult> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: data }))
    return { key, size: data.length, checksum: sha256(data) }
  }

  async get(key: string): Promise<Buffer> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
    if (!res.Body) throw new Error(`อ่านไฟล์จาก object storage ไม่ได้: ${key}`)
    return Buffer.from(await res.Body.transformToByteArray())
  }

  // delete / exists / usage เขียนด้วยแนวเดียวกัน ดูโค้ดเต็มในไฟล์จริง
}
```

**สามจุดที่ควรอธิบายได้**

| จุด | เหตุผล |
| --- | --- |
| ตรวจ env ให้ครบใน `constructor` | ถ้าปล่อยไปพังตอน `put()` จะเจอ error ตอนมีคนส่งรูปเข้ากลุ่มจริง ซึ่งเป็นเวลาที่แย่ที่สุด |
| `region: 'auto'` | R2 ไม่ได้ใช้ค่านี้ แต่ SDK บังคับให้มี ถ้าไม่ใส่จะขึ้น `Region is missing` |
| `requestChecksumCalculation: 'WHEN_REQUIRED'` | AWS SDK รุ่นใหม่แนบ checksum header ให้ทุก request ซึ่งบริการที่เข้ากันได้กับ S3 บางเจ้ายังไม่รองรับ ตั้งค่านี้เพื่อความเข้ากันได้ ส่วนความถูกต้องของไฟล์เราตรวจเองด้วย sha256 ที่เก็บในคอลัมน์ `checksum` อยู่แล้ว |

**สิ่งที่ไม่ต้องแก้เลย** (ยืนยันว่าชั้น abstraction ทำงานจริง)

| ไฟล์ | ทำไมไม่ต้องแก้ |
| --- | --- |
| `src/services/media.ts` | เรียก `getStorage().put()` / `.get()` / `.delete()` ผ่าน interface เดิม |
| `src/routes/webhook.ts` | ไม่รู้จักที่เก็บไฟล์เลย เรียก `archiveMedia()` อย่างเดียว |
| `src/routes/admin.ts` | `/media/:id/file` ยังอ่านผ่าน `readMediaBuffer()` เหมือนเดิม |
| `sql/01_schema.sql` | คอลัมน์ `storage_key` เก็บ path สัมพัทธ์อยู่แล้ว ใช้เป็น object key ได้ตรง ๆ |
| `scripts/media-cleanup.ts` | เรียก `deleteMediaOlderThan()` ซึ่งเรียก `storage.delete()` ต่อ |

> 🎓 **จุดสอนที่คุ้มที่สุดของหัวข้อนี้:** ตอนออกแบบ Workshop 6 เราเลือกเก็บ `storage_key`
> เป็น **path สัมพัทธ์** (`Cxxxx/2026/08/5551....jpg`) ไม่ใช่ absolute path ของเครื่อง
> การตัดสินใจบรรทัดเดียวนั้นทำให้วันนี้ย้ายขึ้น cloud ได้โดยไม่ต้องแก้ข้อมูลเดิมในฐานข้อมูลเลย
> **ค่าใช้จ่ายของการออกแบบผิดจะมาเก็บทีหลังเสมอ ตอนที่แก้ยากที่สุด**

---

### 7.5 ตั้งค่า `.env` ในเครื่องเพื่อทดสอบก่อน

**อย่าเพิ่งไปตั้งบน Render** ทดสอบจากเครื่องตัวเองก่อนเสมอ เพราะเห็น error เต็ม ๆ และแก้ได้เร็วกว่ามาก

ไฟล์ `line-workflow-app/.env` มีคีย์ครบทุกตัวรออยู่แล้ว (หัวข้อที่ 7) เหลือแค่ **2 อย่าง**
คือเปลี่ยน `MEDIA_STORAGE_DRIVER` เป็น `s3` แล้วกรอกค่าที่ได้จากขั้นที่ 7.2

```dotenv
# ---------- 7) เก็บไฟล์จากไลน์กลุ่มถาวร (Workshop 6) ----------
MEDIA_ARCHIVE_ENABLED=true

# ← เปลี่ยนบรรทัดนี้จาก local เป็น s3
MEDIA_STORAGE_DRIVER=s3
MEDIA_LOCAL_DIR=storage/media

MEDIA_MAX_SIZE_MB=25
MEDIA_TYPES=image,video,audio,file
MEDIA_SAVE_PREVIEW=true

# ---- Object storage: Cloudflare R2 / AWS S3 / MinIO ----
S3_BUCKET=line-workflow-media
S3_REGION=auto
S3_ENDPOINT=https://a1b2c3d4e5f6.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=<Access Key ID จากขั้นที่ 7.2>
S3_SECRET_ACCESS_KEY=<Secret Access Key จากขั้นที่ 7.2>
```

**ความหมายของแต่ละตัว**

| ตัวแปร | ค่าสำหรับ R2 | ถ้าใช้ AWS S3 | หมายเหตุ |
| --- | --- | --- | --- |
| `MEDIA_ARCHIVE_ENABLED` | `true` | `true` | `false` = ไม่ดาวน์โหลดไฟล์เลย เก็บแค่ metadata (ปลอดภัยที่สุด) |
| `MEDIA_STORAGE_DRIVER` | `s3` | `s3` | ตัวสวิตช์หลัก อ่านใน `config.media.driver` |
| `MEDIA_LOCAL_DIR` | ปล่อยไว้ได้ | ปล่อยไว้ได้ | ใช้เฉพาะตอน driver เป็น `local` ไม่ต้องลบทิ้ง |
| `MEDIA_MAX_SIZE_MB` | `25` | `25` | กันไฟล์ใหญ่ผิดปกติ ตัดสินใจ **ก่อน** ดาวน์โหลด ไม่เปลืองแบนด์วิดท์ |
| `MEDIA_TYPES` | `image,video,audio,file` | เหมือนกัน | ตัดเหลือ `image,file` ได้ถ้าไม่อยากเก็บวิดีโอ (ประหยัดพื้นที่มาก) |
| `MEDIA_SAVE_PREVIEW` | `true` | `true` | เก็บภาพย่อไว้แสดงในแกลเลอรี ทำให้หน้าโหลดเร็วและ Class B ops ถูกลง |
| `S3_BUCKET` | ชื่อ bucket | ชื่อ bucket | ต้องตรงเป๊ะ ตัวพิมพ์เล็กทั้งหมด |
| `S3_REGION` | **`auto`** | `ap-southeast-1` | R2 ไม่ใช้ค่านี้จริง แต่ SDK บังคับให้มี |
| `S3_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` | **เว้นว่าง** | เว้นว่าง = SDK ไปที่ AWS จริง |
| `S3_ACCESS_KEY_ID` | จาก R2 API token | จาก IAM | |
| `S3_SECRET_ACCESS_KEY` | จาก R2 API token | จาก IAM | **ดูได้ครั้งเดียวตอนสร้าง** |

> ⚠️ **`.env` ห้ามขึ้น git เด็ดขาด** ตรวจซ้ำด้วย `git status --short` ต้องไม่เห็นชื่อไฟล์นี้
> ถ้าเผลอ push key ของ R2 ขึ้นไปแล้ว ให้เข้า **Manage API tokens > Revoke** ทันทีแล้วออกใหม่
> การลบ commit ทีหลังไม่ช่วย เพราะ key ถูกเห็นไปแล้ว

**ทดสอบว่าต่อ R2 ติดจริง — ทำก่อนอย่างอื่นเสมอ**

```bash
npm run storage:check
```

คำสั่งนี้ทดสอบครบวงจร **เขียน → อ่านกลับมาเทียบทีละไบต์ → นับขนาดที่ใช้ → ลบทิ้ง**
โดยไม่ยุ่งกับฐานข้อมูลเลย จึงแยกได้ชัดว่าปัญหาอยู่ที่ credential/เครือข่าย ไม่ใช่ตรรกะของโปรแกรม

ผลที่ต้องได้

```
=== ตรวจการเชื่อมต่อที่เก็บไฟล์ ===

driver          : s3
S3_BUCKET       : line-workflow-media
S3_REGION       : auto
S3_ENDPOINT     : https://a1b2c3d4e5f6.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID: a1b2****9xyz
S3_SECRET...KEY : 7f3a****c2d1

[1/4] เขียนไฟล์ทดสอบ  : _healthcheck/storage-check.txt
      ขนาด 39 ไบต์ / sha256 7fa9e7619550439f...
[2/4] อ่านกลับมาเทียบ
      เนื้อหาตรงกันทุกไบต์
[3/4] ดูขนาดที่ใช้ไปทั้งหมด
      0 ไฟล์ / 0 B
[4/4] ลบไฟล์ทดสอบทิ้ง

✅ ที่เก็บไฟล์พร้อมใช้งาน
```

ถ้าไม่ผ่าน สคริปต์จะพิมพ์รายการที่ต้องตรวจให้เอง (ดูตารางในหัวข้อ 7.11 ประกอบ)

**แล้วค่อยทดสอบทั้งเส้นทางจริง**

```bash
npm run seed:media       # สร้างไฟล์ตัวอย่างแล้วบันทึกลง media_files เหมือนที่ webhook ทำ
npm run dev
```

ตอนเริ่มระบบจะพิมพ์บรรทัดสรุป config ออกมา ต้องเห็นคำว่า `s3` แทนที่จะเป็นชื่อโฟลเดอร์

```
เก็บไฟล์สื่อ    : เปิด (s3, สูงสุด 25 MB/ไฟล์)
```

> `seed:media` ต้องมีกลุ่มในตาราง `line_groups` ก่อน ถ้าขึ้น `ไม่พบกลุ่มในระบบ`
> ให้รัน `npm run seed:chat` ก่อน หรือระบุเอง `npm run seed:media -- --group=Cxxxx`

จากนั้นเปิด `http://localhost:3000/media` ต้องเห็นรูปขึ้นในแกลเลอรี และกดเปิดไฟล์ได้
กลับไปดูใน Cloudflare Dashboard > bucket > tab **Objects** จะเห็น key ตามโครง `<groupId>/<ปี>/<เดือน>/<messageId>.<นามสกุล>`

---

### 7.6 ย้ายไฟล์เดิมที่เก็บไว้บนดิสก์ขึ้น R2

ข้ามข้อนี้ได้ถ้ายังไม่เคยเก็บไฟล์จริง แต่ถ้ามีไฟล์อยู่ใน `storage/media` แล้วต้องย้ายก่อน
ไม่งั้นแถวเก่าใน `media_files` จะเปิดไม่ได้ (เพราะคอลัมน์ `storage_driver` เดิมเป็น `local`)

สคริปต์ `scripts/media-migrate-s3.ts` เตรียมไว้ให้แล้ว รันแบบดูก่อน แล้วค่อยย้ายจริง

```bash
npm run media:migrate            # ดูว่าจะย้ายกี่ไฟล์ (ยังไม่ย้ายจริง)
npm run media:migrate -- --yes   # ย้ายจริง
```

**สิ่งที่สคริปต์ทำ**

1. อ่านแถวที่ `status = 'stored' AND storage_driver = 'local'` จาก `media_files`
2. อ่านไฟล์ต้นทางจากดิสก์ตรง ๆ (ไม่ผ่าน `getStorage()` เพราะตอนนี้ชี้ไป R2 แล้ว)
   พร้อมตรวจกัน path traversal แบบเดียวกับ `LocalDiskStorage`
3. อัปโหลดทั้งไฟล์หลักและภาพย่อขึ้น R2 ด้วย **key เดิมทุกตัวอักษร**
4. อัปเดต `storage_driver` ของแถวนั้นเป็น `s3`
5. ไฟล์ไหนหาไม่เจอบนดิสก์ จะ log ว่าข้ามและนับแยกไว้ ไม่ล้มทั้งงาน

> ⚠️ **สคริปต์จะหยุดทันทีถ้า `MEDIA_STORAGE_DRIVER` ยังเป็น `local`**
> เพราะถ้าปล่อยให้รันจะกลายเป็นการคัดลอกไฟล์ทับที่เดิมโดยไม่มีประโยชน์อะไร

> ⚠️ **อย่าเพิ่งลบโฟลเดอร์ `storage/media` ทันทีที่สคริปต์จบ**
> เปิดหน้า `/media` สุ่มกดดูไฟล์ให้ครบทุกประเภท (รูป / วิดีโอ / PDF) ว่าเปิดได้จริงก่อน
> แล้วค่อยลบ ถือเป็นการทดสอบ restore แบบย่อ ๆ ในตัว

---

### 7.7 ตั้งค่า env บน Render

ไปที่ Web Service > tab **Environment** > **Add Environment Variable** แล้วเพิ่มทีละตัว

| ตัวแปร | ค่า | ทำไม |
| --- | --- | --- |
| `MEDIA_ARCHIVE_ENABLED` | `true` | เปิดการเก็บไฟล์ |
| `MEDIA_STORAGE_DRIVER` | `s3` | **สำคัญที่สุด** ถ้าลืมตัวนี้ระบบจะเขียนลงดิสก์ ephemeral แล้วไฟล์หายทุก deploy |
| `MEDIA_MAX_SIZE_MB` | `25` | |
| `MEDIA_TYPES` | `image,video,audio,file` | |
| `MEDIA_SAVE_PREVIEW` | `true` | |
| `S3_BUCKET` | `line-workflow-media` | |
| `S3_REGION` | `auto` | |
| `S3_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` | ไม่ต้องมีชื่อ bucket ต่อท้าย |
| `S3_ACCESS_KEY_ID` | จาก R2 API token | |
| `S3_SECRET_ACCESS_KEY` | จาก R2 API token | Render ซ่อนค่าให้อัตโนมัติหลังบันทึก |

กด **Save Changes** แล้ว Render จะ deploy ใหม่ให้เอง

**ถ้าใช้ Blueprint** ค่าเหล่านี้อยู่ใน `render.yaml` ของโปรเจกต์แล้ว เหลือแค่กรอกตัวที่เป็น `sync: false`
ในหน้า Render ตอน apply blueprint

```yaml
      - key: MEDIA_ARCHIVE_ENABLED
        value: "true"
      - key: MEDIA_STORAGE_DRIVER
        value: s3
      - key: MEDIA_MAX_SIZE_MB
        value: "25"
      - key: MEDIA_TYPES
        value: image,video,audio,file
      - key: MEDIA_SAVE_PREVIEW
        value: "true"
      - key: S3_BUCKET
        value: line-workflow-media
      - key: S3_REGION
        value: auto
      # ค่าที่เป็นความลับ ต้องกรอกในหน้า Render เอง (sync: false = ไม่เก็บลง git)
      - key: S3_ENDPOINT
        sync: false
      - key: S3_ACCESS_KEY_ID
        sync: false
      - key: S3_SECRET_ACCESS_KEY
        sync: false
```

> 🎓 **จุดสอน:** `S3_ENDPOINT` ตั้งเป็น `sync: false` ด้วย ทั้งที่ไม่ใช่รหัสผ่าน
> เพราะมี **account ID ของ Cloudflare** อยู่ในนั้น ซึ่งเป็นข้อมูลที่ไม่ควรประกาศใน repo สาธารณะ
> ส่วน `S3_BUCKET` ใส่ตรง ๆ ได้ เพราะรู้ชื่อ bucket อย่างเดียวเข้าถึงอะไรไม่ได้

---

### 7.8 ตรวจว่าใช้งานได้จริงบน production

1. ดู **Logs** ตอน service เริ่มใหม่ ต้องเห็น
   ```
   เก็บไฟล์สื่อ    : เปิด (s3, สูงสุด 25 MB/ไฟล์)
   ```
   ถ้ายังขึ้น `เปิด (ดิสก์ storage/media, ...)` แปลว่า `MEDIA_STORAGE_DRIVER` ยังไม่ถึง service (ตรวจว่า deploy ใหม่แล้วหรือยัง)
2. ส่งรูป 1 รูปเข้าไลน์กลุ่มทดสอบจริง
3. เปิด `https://<ของคุณ>.onrender.com/media` ต้องเห็นรูปนั้นในแกลเลอรี กดเปิดได้
4. เข้า Cloudflare Dashboard > bucket > **Objects** ต้องเห็น object ใหม่ตามโครง `<groupId>/<ปี>/<เดือน>/`
5. **บททดสอบที่สำคัญที่สุด** — กด **Manual Deploy** บน Render ให้ deploy ใหม่ 1 รอบ
   แล้วกลับมาเปิดรูปเดิม **ต้องยังเปิดได้** นี่คือข้อพิสูจน์ว่าย้ายออกจากดิสก์ ephemeral สำเร็จจริง
6. ทดสอบว่า **ไม่ล็อกอินแล้วเปิดไม่ได้** เปิด URL ของไฟล์ในหน้าต่าง incognito ต้องเด้งไปหน้า login

---

### 7.9 ตั้งนโยบายลบไฟล์อัตโนมัติ (retention)

ทำได้ 2 ชั้น ควรทำทั้งคู่

**ชั้นที่ 1: ลบจากในระบบเรา (ลบไฟล์ใน R2 พร้อมอัปเดตฐานข้อมูลให้ตรงกัน)**

```bash
npm run media:cleanup -- --days=90          # ดูว่าจะลบกี่ไฟล์
npm run media:cleanup -- --days=90 --yes    # ลบจริง
```

นี่คือตัวหลัก เพราะลบไฟล์ออกจาก R2 แล้ว **อัปเดตแถวใน `media_files` ให้เป็น `status='deleted'`
พร้อมล้าง `storage_key` ทิ้ง** จึงไม่เหลือแถวที่ชี้ไปยังไฟล์ที่ไม่มีแล้ว และยังคงเก็บ metadata
ไว้ตอบได้ว่าเคยมีไฟล์นี้และถูกลบเมื่อไรด้วยเหตุผลอะไร (คอลัมน์ `deleted_at` / `deleted_reason`)

บน Render ยังไม่มีตัวตั้งเวลาสำหรับสคริปต์นี้ ให้เลือกทางใดทางหนึ่ง

- รันจากเครื่องตัวเองเดือนละครั้ง (ชี้ `DATABASE_URL` และ credential ของ R2 ไปที่ production)
- เพิ่มงานใน `src/scheduler.ts` ให้เรียก `deleteMediaOlderThan(90)` เดือนละครั้ง
- ใช้ Render Cron Job แยก (จ่ายเพิ่ม)

**ชั้นที่ 2: Lifecycle rule ของ R2 (ตาข่ายสำรอง)**

Cloudflare Dashboard > bucket > **Settings** > **Object lifecycle rules** > **Add rule**
ตั้งให้ลบ object ที่อายุเกิน **120 วัน**

> 🎓 **ทำไมชั้นที่ 2 ต้องตั้งยาวกว่าชั้นที่ 1:** ให้สคริปต์ของเราเป็นคนลบก่อนเสมอ
> เพราะมันอัปเดตสถานะใน `media_files` ให้ตรงกันด้วย ส่วน lifecycle rule ของ R2 ลบแค่ไฟล์
> ถ้าตั้งเท่ากันหรือสั้นกว่า R2 จะลบไฟล์ตัดหน้า แล้วเหลือแถวในฐานข้อมูลที่เปิดไม่ได้
> ชั้นที่ 2 มีไว้รับกรณี "สคริปต์ไม่ได้รันมาสามเดือนแล้วไม่มีใครรู้" เท่านั้น

---

### 7.10 Checklist ก่อนถือว่าขั้นที่ 7 เสร็จ

- [ ] bucket **ไม่ได้** เปิด public access และ **ไม่ได้** เปิด r2.dev URL
- [ ] API token เป็น **Object Read & Write** และผูกกับ bucket เดียวเท่านั้น
- [ ] `npm run typecheck` ผ่าน และ `package-lock.json` commit ขึ้น git แล้ว
- [ ] `npm run storage:check` ขึ้น ✅ จากเครื่องตัวเอง
- [ ] `MEDIA_STORAGE_DRIVER=s3` ถูกตั้งบน Render แล้ว (ไม่ใช่แค่ในเครื่อง)
- [ ] `.env` ไม่ได้อยู่ใน git (`git log --all --oneline -- .env` ต้องว่าง)
- [ ] Manual Deploy 1 รอบแล้วรูปเดิมยังเปิดได้
- [ ] เปิด URL ไฟล์ใน incognito แล้วเปิดไม่ได้ (เด้งไป login)
- [ ] ตั้ง lifecycle rule ของ R2 และนโยบาย `media:cleanup` แล้ว
- [ ] แจ้งสมาชิกในไลน์กลุ่มแล้วว่า **"เก็บไฟล์ด้วย ไม่ใช่แค่ข้อความ"** (ข้อ 1 ของ Workshop 6.6)

---

### 7.11 ปัญหาที่พบบ่อยตอนต่อ R2

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
เจอปัญหาเมื่อไร ให้รัน `npm run storage:check` ก่อนเสมอ เพราะมันตัดฐานข้อมูลและ LINE ออกจากสมการไปเลย

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| `ตั้ง MEDIA_STORAGE_DRIVER=s3 แล้วแต่ยังไม่ได้ใส่ S3_ACCESS_KEY_ID...` | กรอก key ไม่ครบใน `.env` (หรือบน Render) |
| `Cannot find module '@aws-sdk/client-s3'` ตอน build บน Render | ลืม commit `package.json` / `package-lock.json` — รัน `npm install` แล้ว commit ทั้งสองไฟล์ |
| `NoSuchBucket` | ใส่ชื่อ bucket ต่อท้ายใน `S3_ENDPOINT` (ต้องใส่แค่โดเมน) หรือสะกดชื่อ bucket ผิด — `storage:check` เตือนกรณีนี้ให้อัตโนมัติ |
| `SignatureDoesNotMatch` | คัดลอก Secret Access Key มาไม่ครบ หรือใช้ token ของบัญชี Cloudflare ตัวอื่น |
| `InvalidAccessKeyId` | ใช้ Cloudflare API token ทั่วไปแทน **R2 API token** (คนละชุดกัน) |
| `AccessDenied` ตอนอัปโหลด แต่อ่านได้ | token เป็น Object **Read only** ต้องออกใหม่เป็น Object Read & Write |
| `[3/4] ข้าม (list ไม่ได้)` แต่ข้ออื่นผ่าน | token ไม่มีสิทธิ์ list ใช้งานปกติได้ แต่หน้าแกลเลอรีจะไม่โชว์ขนาดรวม |
| อัปโหลดขึ้นแล้ว แต่หน้าแกลเลอรีขึ้น `อ่านไฟล์จาก storage ไม่ได้` | แถวเก่ายังเป็น `storage_driver='local'` ต้องรัน `npm run media:migrate -- --yes` (ขั้นที่ 7.6) |
| ขึ้น error เกี่ยวกับ checksum ตอน `PutObject` | โค้ดตั้ง `requestChecksumCalculation: 'WHEN_REQUIRED'` ไว้ให้แล้ว ถ้ายังเจอ ให้ลองเพิ่ม `responseChecksumValidation: 'WHEN_REQUIRED'` ใน `new S3Client({...})` ด้วย |
| หน้า `/media` โหลดช้ามากเมื่อไฟล์เยอะ | `usage()` ไล่ list ทุก object ให้เปลี่ยนไปอ่านผลรวมจาก `SUM(size_bytes)` ในตาราง `media_files` แทน |
| ไฟล์หายหลัง deploy ทั้งที่ตั้ง R2 แล้ว | ตั้ง env ไว้แค่ในเครื่อง ยังไม่ได้ตั้งบน Render — ดู log ตอน start ว่าขึ้น `s3` หรือ `ดิสก์` |

---

## ตารางเทียบ: รันในเครื่อง vs ขึ้น Render

| หัวข้อ | ในเครื่อง (ในคลาส) | บน Render Starter |
| --- | --- | --- |
| URL ของ webhook | cloudflared (เปลี่ยนทุกครั้งที่รันใหม่) | `https://xxx.onrender.com` ถาวร |
| ฐานข้อมูล | PostgreSQL ในเครื่อง หรือ Docker | Neon (ฟรี) |
| ที่เก็บไฟล์จากกลุ่ม | ดิสก์ในเครื่อง `storage/media` | Cloudflare R2 (`MEDIA_STORAGE_DRIVER=s3`) |
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
- [ ] ถ้าเก็บไฟล์: bucket R2 ไม่ได้เปิด public และ API token เป็น **Object Read & Write** ผูก bucket เดียว
- [ ] ถ้าเก็บไฟล์: `MEDIA_STORAGE_DRIVER=s3` บน production (ไม่ใช่ `local` ซึ่งไฟล์จะหายทุก deploy)
- [ ] ถ้าเก็บไฟล์: มี lifecycle rule ของ R2 และตารางรัน `npm run media:cleanup` จริง
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
| รูปในหน้าแกลเลอรีหายหลัง deploy | ยังเก็บลงดิสก์ ephemeral ของ Render ต้องย้ายขึ้น object storage ตาม **ขั้นที่ 7** |

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
- Render - Persistent disks (และข้อจำกัดเรื่อง 1 instance): https://render.com/docs/disks
- Cloudflare R2 - เริ่มต้นใช้งาน: https://developers.cloudflare.com/r2/get-started/
- Cloudflare R2 - ใช้กับ AWS SDK for JavaScript v3: https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/
- Cloudflare R2 - API tokens: https://developers.cloudflare.com/r2/api/tokens/
- Cloudflare R2 - Object lifecycle rules: https://developers.cloudflare.com/r2/buckets/object-lifecycles/
- Cloudflare R2 - ราคาและโควตาแผนฟรี: https://developers.cloudflare.com/r2/pricing/
- LINE - Webhook redelivery: https://developers.line.biz/en/docs/messaging-api/receiving-messages/#webhook-redelivery
- LINE - ตรวจสาเหตุ webhook error: https://developers.line.biz/en/docs/messaging-api/check-webhook-error-statistics/
- Cloudflare Tunnel - Named tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-remote-tunnel/
- node-cron: https://github.com/node-cron/node-cron

> **หมายเหตุ:** ราคาและเงื่อนไขของ free tier เปลี่ยนบ่อยมาก
> ข้อมูลในเอกสารนี้อ้างอิงสถานะเดือนกรกฎาคม 2026 ควรตรวจหน้า pricing ก่อนตัดสินใจทุกครั้ง
