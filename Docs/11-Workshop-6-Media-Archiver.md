# Workshop 6 (โมดูลเสริม): Media Archiver - แก้ปัญหาภาพและไฟล์ในไลน์กลุ่มหมดอายุ

**ระยะเวลา:** 40-50 นาที
**สอนเมื่อไหร่:** ต่อท้าย Workshop 3 ได้ทันที (เพราะใช้ Webhook ตัวเดียวกัน) หรือแยกเป็นโมดูลเสริม/คลาสวันที่ 3

---

## ปัญหาที่ทุกออฟฟิศไทยเจอ

> "พี่ครับ รูปใบเสร็จที่ส่งในกลุ่มเมื่อเดือนที่แล้ว กดโหลดไม่ได้แล้วครับ"
> "ไฟล์ Excel ที่ส่งไว้หมดอายุแล้ว ขอใหม่ได้ไหมคะ"

ในแอป LINE ไฟล์และรูปที่ส่งในแชทมีอายุจำกัด พอเลยกำหนดก็กดโหลดไม่ได้อีก
ข้อมูลสำคัญขององค์กร เช่น สลิปโอนเงิน ใบเสร็จ ใบส่งของ ภาพหน้างาน จึงหายไปเรื่อย ๆ

**Workshop นี้แก้ปัญหานั้นให้จบ** ด้วยหลักการเดียวกับ Workshop 3
คือเปลี่ยนจาก "ไปดึงตอนที่ต้องใช้" เป็น "รับไว้ตั้งแต่วินาทีแรกที่เข้ากลุ่ม"

---

## ทำได้จริงไหม และทำได้แค่ไหน

**ทำได้** LINE เปิด API ให้ดึงไฟล์ที่ผู้ใช้ส่งออกมาได้ด้วย messageId ที่มากับ webhook

```
GET https://api-data.line.me/v2/bot/message/{messageId}/content
```

รองรับ **รูปภาพ วิดีโอ ไฟล์เสียง และไฟล์เอกสาร** และยังมี endpoint ดึงภาพย่อ
(`/content/preview`) สำหรับทำ thumbnail ในแกลเลอรี

พอเราดึงมาเก็บใน storage ของเราเองแล้ว ไฟล์นั้นเป็นของเราถาวร
ไม่ผูกกับอายุของ LINE อีกต่อไป เปิดดูย้อนหลังกี่ปีก็ได้

### แต่มี 4 เงื่อนไขที่ต้องบอกผู้เรียนให้ตรง

| # | เงื่อนไข | ผลต่อการออกแบบระบบ |
| --- | --- | --- |
| 1 | เอกสาร LINE ระบุว่า *"Content that users send is automatically deleted after a certain period of time"* และ **ไม่บอกว่ากี่วัน** | ต้องดาวน์โหลด **ทันทีที่ webhook เข้า** ห้ามเก็บแค่ messageId ไว้โหลดทีหลัง |
| 2 | ข้อความ text ดึงซ้ำไม่ได้เลย (*"There is no API available to get the text again"*) | ต้องบันทึกลงฐานข้อมูลตอนรับ webhook ซึ่ง Workshop 3 ทำไปแล้ว |
| 3 | บอทเห็นเฉพาะที่ส่ง **หลัง** เข้ากลุ่ม | ระบบนี้ไม่กู้ไฟล์เก่าที่หมดอายุไปแล้ว แต่แก้ปัญหาตั้งแต่วันที่ติดตั้งเป็นต้นไป |
| 4 | ไฟล์ที่ `contentProvider.type` เป็น `external` จะไม่ได้อยู่บนเซิร์ฟเวอร์ LINE | ต้องข้ามไฟล์ประเภทนี้ ดึงไม่ได้ |

**ข้อ 3 สำคัญมากในการสื่อสาร** ถ้าไปโฆษณาว่า "กู้ไฟล์เก่าที่หมดอายุได้" จะผิดทันที
สิ่งที่ระบบทำคือ **ตั้งแต่วันนี้เป็นต้นไปจะไม่มีไฟล์หายอีก**

---

## สถาปัตยกรรมที่เพิ่มจาก Workshop 3

```
สมาชิกส่งรูป/ไฟล์เข้ากลุ่ม
        │
        ▼
LINE Platform ──webhook──► POST /webhook
                              │ 1. บันทึก metadata ลง line_messages (ทันที)
                              │ 2. ตอบ 200 กลับ LINE
                              │ 3. ดาวน์โหลดไฟล์แบบไม่บล็อก (ไม่ await)
                              ▼
              GET api-data.line.me/v2/bot/message/{id}/content
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
             Storage layer         media_files
             (ดิสก์ หรือ S3)        (ตำแหน่งไฟล์ + checksum)
                    │
                    ▼
            หน้า /media ในแดชบอร์ด
            ค้นหา ดู thumbnail โหลดกลับได้ตลอด
```

**จุดออกแบบที่ต้องอธิบาย 3 ข้อ**

1. **ไม่ `await` ตอนโหลดไฟล์** - เราตอบ 200 ให้ LINE ไปแล้ว การโหลดวิดีโอ 20 MB
   ไม่ควรถ่วง event ถัดไป (จัดการ error ภายในฟังก์ชันเองทั้งหมด)
2. **แยก Storage layer ออกมา** (`src/services/storage.ts`) - โค้ดส่วนอื่นเรียกผ่าน
   `getStorage()` เท่านั้น จึงย้ายจากดิสก์ขึ้น Cloudflare R2 ได้โดยแก้ไฟล์เดียว
3. **วิดีโอและเสียงต้องรอ LINE แปลงไฟล์** - ระบบจะเช็ค `/content/transcoding`
   และ retry ให้อัตโนมัติสูงสุด 5 ครั้ง

---

## Part A: เปิดใช้งานและทดลองโดยยังไม่ต้องมี LINE OA (10 นาที)

ระบบเปิดใช้งานมาให้แล้วโดยค่าเริ่มต้น ตรวจค่าในไฟล์ `.env`

```env
MEDIA_ARCHIVE_ENABLED=true
MEDIA_STORAGE_DRIVER=local
MEDIA_LOCAL_DIR=storage/media
MEDIA_MAX_SIZE_MB=25
MEDIA_TYPES=image,video,audio,file
```

สร้างไฟล์ตัวอย่างเพื่อดูหน้าตาแกลเลอรีก่อน

```bash
npm run seed:media
npm run dev
```

เปิด http://localhost:3000/media จะเห็นภาพและไฟล์ตัวอย่าง 14 รายการ
ลองกดดูภาพ กดปุ่มโหลด และลองกรองตามชนิดไฟล์

> ไฟล์ตัวอย่างถูกสร้างขึ้นด้วยโปรแกรมเอง (SVG และ CSV) ไม่ได้ดึงมาจากที่ไหน
> จึงไม่มีข้อมูลของบุคคลจริงเลย

---

## Part B: ต่อของจริง (15 นาที)

1. ตั้ง `MOCK_LINE=false` และใส่ `CHANNEL_ACCESS_TOKEN` กับ `CHANNEL_SECRET`
2. เปิด tunnel แล้วตั้ง Webhook URL ตามที่ทำใน Workshop 3
3. ส่งรูปเข้าไลน์กลุ่มทดสอบ 3-4 รูป และส่งไฟล์ PDF หรือ Excel 1 ไฟล์
4. ดู log ใน terminal ต้องเห็นบรรทัดแบบนี้

```
[บันทึก] นภา (คลังสินค้า) (image): [image]
[สื่อ] เก็บ image 842.3 KB -> C8f3a91.../2026/08/5567890123.jpg
```

5. ตรวจว่าไฟล์ลงดิสก์จริง

```bash
find storage/media -type f | head
du -sh storage/media
```

6. เปิด http://localhost:3000/media จะเห็นรูปที่เพิ่งส่งพร้อม thumbnail

**โจทย์พิสูจน์ว่าแก้ปัญหาได้จริง**
ให้ผู้เรียนลอง **ลบรูปออกจากแชท LINE ของตัวเอง** (ลบเฉพาะฝั่งตัวเอง)
แล้วกลับมาเปิดหน้า `/media` จะเห็นว่ารูปยังอยู่ครบและโหลดได้ปกติ
นี่คือ moment ที่ผู้เรียนจะเข้าใจคุณค่าของระบบทันที

---

## Part C: unsend event - เก็บเป็นต้องลบเป็น (10 นาที)

**นี่คือส่วนที่ห้ามข้าม** ทั้งในเชิงจริยธรรมและเชิงข้อกำหนดของ LINE

เอกสาร LINE เขียนไว้ว่าเมื่อผู้ใช้ยกเลิกส่งข้อความ ผู้ให้บริการควร

> "respect the user's intent to unsend a sent message and handle the message
> appropriately with the utmost care so that the target message can't be seen
> or used in the future"

และให้ *"Delete the target message stored in a database or other storage device"*

ระบบของเราจึงจัดการ event นี้ให้แล้วใน `src/services/unsend.ts` โดยเมื่อได้รับ `unsend` event จะ

1. ลบเนื้อความออกจาก `line_messages` (เก็บแถวไว้พร้อม `unsent_at` เพื่อให้ตรวจสอบได้ว่ามีการยกเลิกเกิดขึ้น แต่ไม่เหลือเนื้อหา)
2. **ลบไฟล์จริงออกจาก storage** และทำเครื่องหมาย `status = 'deleted'` ใน `media_files`
3. ลบงานที่ AI สกัดมาจากข้อความนั้นทิ้งด้วย จะได้ไม่เหลือเนื้อหาที่ถูกยกเลิกค้างในระบบ

**ทดลองในคลาส**

ส่งรูปเข้ากลุ่ม รอให้ระบบเก็บเสร็จ แล้วกดยกเลิกส่ง (ลบข้อความออกจากทุกคน) ในแอป LINE
จากนั้นดู log

```
[ยกเลิกส่ง] 5567890123 - ข้อความ ลบแล้ว, ไฟล์ ลบแล้ว
```

แล้วตรวจว่าไฟล์หายจากดิสก์จริง

```bash
find storage/media -type f | wc -l
```

**คำถามชวนคิดสำหรับห้องเรียน:** ถ้าไม่ทำส่วนนี้ ระบบของเราจะกลายเป็นอะไร
(คำตอบที่ต้องการ: กลายเป็นระบบที่เก็บสิ่งที่เจ้าของตั้งใจลบไปแล้ว ซึ่งผิดทั้งเจตนาผู้ใช้ ผิดแนวปฏิบัติของ LINE และเสี่ยงผิด PDPA)

---

## Part D: prompt สำหรับให้ AI สร้างส่วนนี้เอง (10 นาที)

ถ้าอยากให้ผู้เรียนสร้างเองแทนการอ่านโค้ดที่เตรียมไว้ ใช้ prompt นี้

```
ในโปรเจกต์ webhook LINE ที่มีอยู่แล้ว ช่วยเพิ่มความสามารถเก็บไฟล์จากไลน์กลุ่มถาวร
เขียน TypeScript ไม่ใส่ semicolon comment ภาษาไทย

1. สร้าง storage layer ที่ src/services/storage.ts
   - interface เดียวชื่อ Storage มีเมธอด put / get / delete / exists / usage
   - implementation แรกเก็บลงดิสก์ในเครื่อง อ่าน path จาก env
   - เขียนโครง S3 ไว้ให้ต่อยอดภายหลังโดยไม่ต้องแก้โค้ดส่วนอื่น
   - ต้องกัน path traversal ไม่ให้ key พาไฟล์ออกนอกโฟลเดอร์ที่กำหนด

2. สร้างตาราง media_files เก็บ line_message_id (unique), group_id, ผู้ส่ง,
   media_type, file_name, content_type, size_bytes, storage_key, preview_key,
   checksum, status, sent_at, archived_at, deleted_at, deleted_reason

3. ใน webhook เมื่อ message.type เป็น image/video/audio/file ให้
   - ข้ามถ้า contentProvider.type === "external" เพราะไฟล์ไม่ได้อยู่บนเซิร์ฟเวอร์ LINE
   - ดาวน์โหลดด้วย getMessageContent ทันที ไม่ await ไม่ให้บล็อก event ถัดไป
   - วิดีโอกับเสียงต้องเช็คสถานะ transcoding ก่อน และ retry ได้
   - เก็บภาพย่อของรูปและวิดีโอด้วย getMessageContentPreview ไว้ทำ thumbnail
   - ข้ามไฟล์ที่ใหญ่เกินค่าที่ตั้งใน env
   - error ทุกกรณีต้องบันทึกลงตารางพร้อมเหตุผล ไม่ทำให้ webhook ล้ม

4. จัดการ unsend event: ลบเนื้อความออกจากฐานข้อมูล ลบไฟล์ออกจาก storage จริง
   และทำเครื่องหมายว่าถูกลบเพราะ unsend

5. เพิ่มหน้า /media ในแดชบอร์ด แสดงเป็น grid พร้อม thumbnail
   ค้นหาชื่อไฟล์ กรองผู้ส่ง ชนิด ช่วงวันที่ แบ่งหน้า และโหลดไฟล์กลับได้
   พร้อมการ์ดสรุปจำนวนไฟล์ พื้นที่ที่ใช้ และจำนวนที่เก็บไม่สำเร็จ

6. เรื่องชื่อไฟล์: LINE ส่ง fileName มาให้เฉพาะข้อความชนิด file เท่านั้น
   รูปและวิดีโอไม่มีชื่อไฟล์ติดมาเลย ให้ประกอบชื่อขึ้นเองจากเวลาที่ส่ง
   (เช่น IMG_20260809_1042.jpg) และเปิดช่อง caption ให้แอดมินตั้งคำบรรยายไทยได้
   เพื่อให้ค้นย้อนหลังเจอด้วยคำที่คนจำได้ เช่น "ใบเสร็จค่าขนส่ง"

อธิบายด้วยว่าทำไมต้องดาวน์โหลดทันที ห้ามเก็บ messageId ไว้โหลดทีหลัง
```

---

## Part E: นโยบายเก็บข้อมูลและพื้นที่ (5 นาที)

### คำนวณพื้นที่ให้ผู้เรียนเห็นภาพ

| สถานการณ์ | ต่อวัน | ต่อเดือน | ต่อปี |
| --- | --- | --- | --- |
| กลุ่มเล็ก 5 คน (รูป 10 ภาพ/วัน @2 MB) | 20 MB | 600 MB | 7 GB |
| กลุ่มกลาง 20 คน (30 ภาพ/วัน @2 MB) | 60 MB | 1.8 GB | 22 GB |
| กลุ่มใหญ่ + วิดีโอ (50 ไฟล์/วัน @5 MB) | 250 MB | 7.5 GB | 90 GB |

**สรุปให้ผู้เรียนจำ:** ระบบเก็บไฟล์ต้องคิดเรื่องพื้นที่ตั้งแต่วันแรก
ไม่ใช่รอจนดิสก์เต็มแล้วค่อยแก้

### ตั้งนโยบายลบอัตโนมัติ

```bash
npm run media:cleanup -- --days=90         # ดูว่าจะลบกี่ไฟล์ (ยังไม่ลบจริง)
npm run media:cleanup -- --days=90 --yes   # ลบจริง
```

แนะนำให้ตั้งเป็นงานประจำเดือน และ **ประกาศนโยบายให้สมาชิกกลุ่มทราบล่วงหน้า**
เช่น "ระบบเก็บไฟล์ย้อนหลัง 1 ปี หลังจากนั้นจะลบอัตโนมัติ"

### ย้ายไป object storage เมื่อไฟล์เยอะ

```env
MEDIA_STORAGE_DRIVER=s3
S3_BUCKET=line-media
S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
```

แล้ว `npm install @aws-sdk/client-s3` และเปิดโค้ดที่คอมเมนต์ไว้ใน `src/services/storage.ts`
**ไม่ต้องแก้ webhook หรือแดชบอร์ดเลยแม้แต่บรรทัดเดียว** - นี่คือประโยชน์ของการแยก layer

> ถ้า deploy บน Render อย่าลืมว่าดิสก์ของ instance จะหายเมื่อ deploy ใหม่
> ต้องใช้ Persistent Disk (มีค่าใช้จ่ายเพิ่ม) หรือย้ายไป object storage

---

## Governance และ PDPA สำหรับการเก็บไฟล์

การเก็บ **ไฟล์** มีความอ่อนไหวมากกว่าการเก็บข้อความ เพราะภาพหนึ่งภาพอาจมีบัตรประชาชน
สลิปธนาคาร ใบหน้าคน หรือเอกสารลับขององค์กรอยู่

| ต้องทำ | รายละเอียด |
| --- | --- |
| แจ้งและขอความยินยอมก่อน | ระบุให้ชัดว่าเก็บอะไร เก็บนานเท่าไหร่ ใครเข้าถึงได้ (ระบบมีช่องยืนยันในหน้า `/groups`) |
| จำกัดผู้เข้าถึง | หน้า `/media` ต้องล็อกอินเสมอ และควรมีบัญชีเฉพาะผู้ที่เกี่ยวข้อง |
| ลบได้จริงเมื่อถูกร้องขอ | รองรับ unsend อัตโนมัติ และมีปุ่มลบรายไฟล์ในหน้าแกลเลอรี |
| มีวันหมดอายุ | ตั้งนโยบายและรัน `media:cleanup` เป็นประจำ |
| ไม่ส่งไฟล์ออกนอกองค์กร | โดยเฉพาะอย่าอัปโหลดภาพเอกสารลับเข้าโมเดล AI ภายนอกโดยไม่ได้พิจารณา |
| เข้ารหัสตอนพัก (at rest) | ถ้าเป็นข้อมูลอ่อนไหวสูง ให้ใช้ดิสก์ที่เข้ารหัสหรือ bucket ที่เปิด SSE |

---

## Checkpoint

- [ ] `npm run seed:media` แล้วเปิด `/media` เห็นไฟล์ตัวอย่าง
- [ ] ส่งรูปจริงเข้ากลุ่มแล้วเห็น log `[สื่อ] เก็บ image ...`
- [ ] ไฟล์อยู่ในโฟลเดอร์ `storage/media` จริง
- [ ] เปิดหน้า `/media` แล้วโหลดไฟล์กลับมาได้
- [ ] กดยกเลิกส่งในแอป LINE แล้วไฟล์หายจากทั้งฐานข้อมูลและดิสก์
- [ ] อธิบายได้ว่าทำไมต้องโหลดทันที ห้ามเก็บ messageId ไว้โหลดทีหลัง
- [ ] อธิบายได้ว่าระบบนี้ **ไม่** กู้ไฟล์เก่าที่หมดอายุไปแล้ว

---

## เอกสารอ้างอิง

- Get user-sent content with webhook: https://developers.line.biz/en/docs/messaging-api/receiving-messages/#get-content-from-webhook
- Get content (API reference): https://developers.line.biz/en/reference/messaging-api/#get-content
- Get a preview image of the image or video: https://developers.line.biz/en/reference/messaging-api/#get-image-or-video-preview
- Verify video or audio preparation status: https://developers.line.biz/en/reference/messaging-api/#verify-video-or-audio-preparation-status
- Processing on receipt of unsend event: https://developers.line.biz/en/docs/messaging-api/receiving-messages/#webhook-unsend-message
- Unsend event object: https://developers.line.biz/en/reference/messaging-api/#unsend-event
