# ปัญหาที่พบบ่อยและวิธีแก้ (Troubleshooting)

เรียงตามลำดับที่มักเจอในคลาส ค้นด้วย Ctrl+F ตามข้อความ error ได้เลย

---

## กลุ่ม 1: ตั้งค่า MCP

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| `/mcp` ไม่แสดง line-bot หรือขึ้น failed | 1) `node -v` ต้อง **v22 ขึ้นไป** นี่คือสาเหตุอันดับ 1 <br> 2) token คัดลอกไม่ครบ (มักตกอักขระท้าย) ให้ลบและวางใหม่ <br> 3) มีเครื่องหมายคำพูดครอบ token เกินมา ให้เอาออก |
| `npx` ค้างนานมากตอนเพิ่ม MCP | ครั้งแรกต้องดาวน์โหลด package รอ 1-2 นาที ถ้านานกว่านั้นลอง `npm cache clean --force` |
| เพิ่ม MCP แล้วหาย ต้องเพิ่มใหม่ทุกครั้ง | MCP ที่เพิ่มแบบ local ผูกกับโฟลเดอร์ ให้เพิ่มด้วย `-s user` เพื่อใช้ได้ทุกโฟลเดอร์ |
| Codex ไม่เห็น MCP | ตรวจว่าแก้ไฟล์ถูกที่ (`~/.codex/config.toml`) และ syntax TOML ถูก (ต้องมี `[mcp_servers.line-bot]`) แล้วเปิด codex ใหม่ |
| MCP ต่อได้แต่ส่งข้อความไม่ถึง | `DESTINATION_USER_ID` ผิด หรือยังไม่ได้เพิ่มบอทเป็นเพื่อน (บอทส่งหาคนที่ไม่ได้เป็นเพื่อนไม่ได้) |

---

## กลุ่ม 2: LINE Official Account

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| เชิญบอทเข้ากลุ่มไม่ได้ / ไม่เจอบอทตอนค้นหา | ยังไม่เปิด **"Allow bot to join group chats"** ใน OA Manager > Settings > Account settings > Chats |
| บอทตอบข้อความอัตโนมัติกวน | ปิด **Auto-response messages** ใน Response settings |
| บอทไม่ได้รับข้อความในกลุ่มเลย | Webhook ยังไม่เปิด (ต้องเปิดทั้งใน Developers Console และ OA Manager) |
| `The property, 'messages[0].text', is required` | ข้อความว่าง มักเกิดตอน AI ส่ง text ที่เป็น empty string |
| `Invalid reply token` | replyToken ใช้ได้ครั้งเดียวและหมดอายุใน ~1 นาที งานที่ช้าให้ใช้ push แทน reply |
| `You have reached your monthly limit` | โควต้าหมด (Free plan 200 ข้อความ/เดือน) ตรวจด้วย `get_message_quota` รอเดือนใหม่หรืออัปเกรดแพลน |
| ปุ่ม uri ใน Flex กดไม่ได้ | URL ต้องเป็น **https** เท่านั้น (http จะถูกปฏิเสธ) |
| Flex แสดงผลเพี้ยน / ไม่ขึ้นเลย | วาง JSON ใน https://developers.line.biz/flex-simulator/ เพื่อหาจุดผิด มักเป็น property ที่ไม่มีจริงหรือ nesting ผิด |
| ข้อความ text แสดงดาว `**` ให้เห็น | LINE ไม่รองรับ markdown ต้องบอก AI ว่า "ห้ามใช้ markdown" |

---

## กลุ่ม 3: Webhook และ tunnel (cloudflared / ngrok)

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| กด Verify ใน Console ไม่ผ่าน | 1) server ยังไม่รัน <br> 2) URL ไม่ได้ต่อท้ายด้วย `/webhook` <br> 3) tunnel ปิดไปแล้วหรือรันใหม่ (URL แบบฟรีของทั้ง cloudflared และ ngrok เปลี่ยนทุกครั้งที่รันใหม่ ต้องอัปเดตใน Console) |
| `signature validation failed` | `CHANNEL_SECRET` ไม่ตรง **อย่าสับสนกับ access token** secret อยู่ที่ tab Basic settings |
| Verify ผ่าน แต่พิมพ์ในกลุ่มไม่มี log | 1) ยังไม่เปิด "Use webhook" <br> 2) บอทถูกเตะออกจากกลุ่ม <br> 3) พิมพ์ในแชท 1:1 ไม่ใช่กลุ่ม (โค้ดกรองเฉพาะ `source.type === 'group'`) |
| ได้ log แต่ไม่เข้าฐานข้อมูล | ดู log ฝั่ง server มักเป็น `DATABASE_URL` ผิดหรือยังไม่ได้รัน `npm run db:setup` |
| ข้อความเข้าซ้ำในตาราง | LINE retry ได้เป็นปกติ ตรวจว่ามี `ON CONFLICT (line_message_id) DO NOTHING` แล้ว |
| LINE หยุดส่ง event มาให้เอง | เกิดจาก webhook ตอบ error ซ้ำ ๆ ต้องแก้ให้ตอบ 200 เสมอ แล้วกด Verify ใหม่ |
| `cloudflared` ไม่ใช่คำสั่งที่รู้จัก | ยังไม่ได้ใส่ไว้ใน PATH หรือดาวน์โหลดมาแล้วไม่ได้เปลี่ยนชื่อไฟล์เป็น `cloudflared.exe` |
| cloudflared ขึ้น `failed to sufficiently increase receive buffer size` | เป็นแค่คำเตือน ไม่ใช่ error ใช้งานต่อได้ตามปกติ |
| cloudflared ต่อไม่ได้เลย (เครือข่ายบริษัท/มหาวิทยาลัยบล็อก) | ลองสำรองตามลำดับ: `ngrok http 3000` > `npx localtunnel --port 3000` > `ssh -R 80:localhost:3000 nokey@localhost.run` |
| ngrok หลุดทุก 2 ชั่วโมง | เป็นข้อจำกัดของแพลนฟรีปี 2026 (session ละ 2 ชม.) แนะนำย้ายไปใช้ cloudflared |
| ngrok ขึ้น `ERR_NGROK_108` | มี session เดิมค้างอยู่ (บัญชีฟรีได้ 1 session) ปิด terminal เดิมหรือ kill process ngrok |
| ข้อความเก่าก่อนบอทเข้ากลุ่มไม่เข้าระบบ | **ไม่ใช่บั๊ก** Messaging API ออกแบบมาอย่างนี้ บอทเห็นเฉพาะข้อความหลังเข้ากลุ่ม |

---

## กลุ่ม 4: PostgreSQL

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL ไม่ได้รัน <br> Windows: เปิด services.msc หา postgresql แล้ว Start <br> Docker: `docker compose up -d` |
| `password authentication failed for user "postgres"` | รหัสผ่านใน `DATABASE_URL` ผิด แก้ในไฟล์ `.env` (จำไม่ได้ต้อง reset ผ่าน pgAdmin) |
| `database "linechat" does not exist` | `psql -U postgres -c "CREATE DATABASE linechat;"` แล้วรัน `npm run db:setup` |
| `relation "line_messages" does not exist` | ยังไม่ได้สร้างตาราง รัน `npm run db:setup` |
| `psql` ไม่ใช่คำสั่งที่รู้จัก (Windows) | เพิ่ม `C:\Program Files\PostgreSQL\16\bin` เข้า PATH แล้วเปิด terminal ใหม่ |
| `could not determine data type of parameter $N` | พารามิเตอร์ที่อยู่ใน `COALESCE`/`CASE` ต้องระบุชนิดให้ชัด เช่น `$4::boolean` |
| เวลาใน dashboard เพี้ยนไป 7 ชั่วโมง | คอลัมน์ต้องเป็น `TIMESTAMPTZ` และ query ต้องแปลง `AT TIME ZONE 'Asia/Bangkok'` |
| ต้องการล้างข้อมูลเริ่มใหม่ | `npm run db:reset` (ลบทุกตารางแล้วสร้างใหม่พร้อมข้อมูลจำลอง) |

---

## กลุ่ม 5: Dashboard และโปรเจกต์

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| `npm run dev` แล้ว `EADDRINUSE :3000` | มีอะไรใช้พอร์ต 3000 อยู่ <br> Windows: `netstat -ano \| findstr :3000` แล้ว `taskkill /PID <pid> /F` <br> หรือแก้ `PORT=3001` ใน `.env` |
| ล็อกอินไม่ได้ | ตรวจ `ADMIN_USERNAME` / `ADMIN_PASSWORD` ในไฟล์ `.env` (ค่าเริ่มต้น admin / admin1234) ถ้าตั้ง `ADMIN_PASSWORD_HASH` ไว้ ระบบจะใช้ hash เป็นหลัก |
| หน้าเว็บขึ้น "ต่อฐานข้อมูลไม่ได้" | ดูกลุ่ม 4 ข้างบน |
| กราฟไม่ขึ้น หน้าขาว | Tailwind และ Chart.js โหลดจาก CDN ต้องมีอินเทอร์เน็ต ถ้าอบรมในที่ที่บล็อก CDN ให้ดาวน์โหลดไฟล์มาไว้ในเครื่อง |
| ส่งข้อความแล้วขึ้นสถานะ `mock` | ระบบอยู่ในโหมด MOCK ตั้ง `MOCK_LINE=false` และใส่ `CHANNEL_ACCESS_TOKEN` เพื่อส่งจริง |
| กด "สรุปด้วย AI" ได้ผลลัพธ์แบบสถิติ ไม่ฉลาด | ยังไม่ได้ใส่ `ANTHROPIC_API_KEY` ระบบจึงใช้ตัวสรุป rule-based ในเครื่อง |
| ภาษาไทยใน CSV เปิดใน Excel เป็นตัวยึกยือ | ไฟล์มี BOM ให้แล้ว ถ้ายังเพี้ยน ให้เปิดด้วย Data > From Text/CSV แล้วเลือก UTF-8 |
| `npm run typecheck` ขึ้น error หลังแก้โค้ด | อ่านบรรทัดที่ระบุ แล้วให้ AI แก้: *"ช่วยแก้ TypeScript error นี้ให้ พร้อมอธิบายว่าเกิดจากอะไร"* |
| เซิร์ฟเวอร์ดับเองเมื่อเกิด error | โปรเจกต์นี้ใช้ `asyncRouter` ห่อ handler ไว้แล้ว ถ้าเขียน route เพิ่มเอง ต้องใช้ `asyncRouter()` ด้วย ไม่ใช่ `express.Router()` |

---

## กลุ่ม 6: เก็บภาพและไฟล์ (Media Archiver)

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| ส่งรูปเข้ากลุ่มแล้วไม่มีใน `/media` | 1) `MEDIA_ARCHIVE_ENABLED=true` หรือยัง <br> 2) ยังอยู่โหมด `MOCK_LINE=true` จะดึงไฟล์จริงไม่ได้ <br> 3) ดู log หาบรรทัด `[สื่อ] เก็บไม่สำเร็จ` |
| log ขึ้น `เก็บไม่สำเร็จ ... 404` | ไฟล์หมดอายุบนเซิร์ฟเวอร์ LINE ไปแล้วก่อนที่ระบบจะโหลดทัน แปลว่า webhook ล่มอยู่ช่วงหนึ่ง ให้ตรวจว่า tunnel และ server ทำงานต่อเนื่อง |
| log ขึ้น `ข้าม ... contentProvider = external` | ไฟล์นั้นไม่ได้อยู่บนเซิร์ฟเวอร์ LINE (ผู้ส่งแชร์มาจากบริการภายนอก) ดึงไม่ได้ตามสเปก ไม่ใช่บั๊ก |
| วิดีโอเก็บไม่ได้ ขึ้น transcoding failed | LINE แปลงไฟล์ไม่สำเร็จ ลองส่งไฟล์ใหม่หรือลดขนาดวิดีโอ |
| ไฟล์ใหญ่ถูกข้าม | เกิน `MEDIA_MAX_SIZE_MB` (ค่าเริ่มต้น 25 MB) ปรับเพิ่มได้แต่ต้องดูพื้นที่ดิสก์ด้วย |
| หน้า `/media` ขึ้นรูปไม่ได้ (ภาพแตก) | ไฟล์ถูกลบออกจาก storage แต่แถวในฐานข้อมูลยังอยู่ ตรวจ `storage/media` และดูสถานะในตาราง `media_files` |
| ดิสก์เต็ม | รัน `npm run media:cleanup -- --days=90` ดูปริมาณก่อน แล้วค่อยใส่ `--yes` หรือย้ายไป object storage |
| deploy บน Render แล้วไฟล์หายหลัง deploy ใหม่ | ดิสก์ของ instance ไม่ถาวร ต้องใช้ Persistent Disk หรือเปลี่ยนไป `MEDIA_STORAGE_DRIVER=s3` |
| กดยกเลิกส่งแล้วไฟล์ยังอยู่ | ตรวจว่า webhook ได้รับ `unsend` event จริง (ดู log `[ยกเลิกส่ง]`) และ LINE ส่ง event นี้เฉพาะการยกเลิกส่งภายในเวลาที่กำหนดเท่านั้น |

---

## กลุ่ม 7: Task Scheduler

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| Task รันแล้วขึ้น `0x1` | เกือบทุกครั้งเพราะไม่ได้ตั้ง **Start in** ให้เป็นโฟลเดอร์โปรเจกต์ ทำให้หา node_modules ไม่เจอ |
| Task รันแล้วไม่มีอะไรเกิดขึ้น | ดูไฟล์ log ที่กำหนดใน .bat และตรวจว่า path ในไฟล์ .bat ถูกต้อง (ห้ามมี path ที่มีวรรคโดยไม่ครอบ `"..."`) |
| ตั้งเวลาไว้แต่ไม่รันตอน notebook ปิดฝา | ปลดติ๊ก "Start the task only if the computer is on AC power" และ "Stop if the computer switches to battery power" |
| รันซ้ำหลายครั้ง | มี trigger ซ้ำ ตรวจ tab Triggers ว่ามีอันเดียว |
| `npm` ไม่ใช่คำสั่งที่รู้จักตอนรันผ่าน Task | Task Scheduler ไม่โหลด PATH ของผู้ใช้ ให้ใส่ path เต็มของ npm หรือใช้ `call npm` ในไฟล์ .bat |

---

## เมื่อจนปัญญา: prompt ขอความช่วยเหลือจาก AI

```
ผมเจอปัญหานี้ตอน <กำลังทำอะไร>
ข้อความ error ที่ได้คือ
<วาง error ทั้งหมด>

สภาพแวดล้อม: <Windows/macOS>, Node <เวอร์ชัน>, PostgreSQL <เวอร์ชัน>
สิ่งที่ผมลองแล้ว: <ลองอะไรไปบ้าง>

ช่วยวิเคราะห์ว่าสาเหตุน่าจะเกิดจากอะไร เรียงจากที่เป็นไปได้มากที่สุด
แล้วบอกวิธีตรวจสอบทีละขั้นว่าใช่สาเหตุนั้นจริงไหม ก่อนจะแก้
```

**เคล็ดลับ:** อย่าเพิ่งให้ AI แก้โค้ดทันที ให้มันช่วย **วินิจฉัย** ก่อน
ไม่อย่างนั้นจะได้โค้ดที่เปลี่ยนไปเรื่อยโดยไม่รู้ว่าปัญหาจริงอยู่ที่ไหน
