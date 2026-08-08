# LINE Workflow Automation with Claude Code & MCP

> คลังเอกสารหลักสูตรอบรมออนไลน์เชิงปฏิบัติการ **"สร้างระบบแจ้งเตือน สรุปแชทกลุ่ม และรายงานอัตโนมัติบน LINE ด้วย AI Agent สำหรับองค์กรไทย"**

| หัวข้อ | รายละเอียด |
| --- | --- |
| รูปแบบ | อบรมออนไลน์สดผ่าน Zoom · Workshop ลงมือทำจริงทุกหัวข้อ · มีบันทึกวิดีโอย้อนหลัง |
| ระยะเวลา | 2 วัน รวม 6 ชั่วโมง (วันละ 3 ชั่วโมง เวลา 20:30 - 23:30 น.) |
| วันที่อบรม | วันเสาร์ที่ 8 - วันอาทิตย์ที่ 9 สิงหาคม 2569 |
| ผู้สอน | อ.สามิตร โกยม (ประสบการณ์สอนและพัฒนาซอฟต์แวร์กว่า 15 ปี) |
| จัดอบรมโดย | สถาบันไอทีจีเนียส เอ็นจิเนียริ่ง — [www.itgenius.co.th](https://www.itgenius.co.th) |

---

## หลักสูตรนี้เกี่ยวกับอะไร

องค์กรไทยแทบทุกแห่งใช้ LINE เป็นช่องทางสื่อสารหลัก แต่งานสื่อสารเหล่านั้นยังเป็น "งานมือ" เกือบทั้งหมด — แจ้งประกาศภายใน สรุปประชุมจากแชทกลุ่ม ติดตามงานที่มอบหมายกันในไลน์ และทำรายงานส่งผู้บริหารทุกเช้า

หลักสูตรนี้พาผู้เรียนเปลี่ยนงานเหล่านั้นให้เป็นระบบอัตโนมัติ ด้วย **LINE Bot MCP Server** (MCP อย่างเป็นทางการจาก LINE) ต่อเข้ากับ AI Agent อย่าง **Claude Code** โดยครอบคลุมทั้งขาส่งและขารับ ตั้งแต่ส่งข้อความ/Flex Message/Rich Menu ไปจนถึงสร้าง Webhook เก็บแชทกลุ่มลง PostgreSQL ให้ AI วิเคราะห์ และปิดท้ายด้วยรายงานประจำวันที่รันเองทุกเช้าด้วย Task Scheduler

prompt ทั้งหมดในหลักสูตรออกแบบให้เป็นกลาง ใช้ได้ทั้ง **Claude Code** และ **GPT Codex**

---

## โครงสร้างที่เก็บนี้

```
.
├── Outlines/       Course outline ฉบับเต็ม (Markdown + PDF สำหรับเผยแพร่)
├── Notes/          เอกสารประกอบการสอนรายวัน (Instructor / Student Note)
├── Presentation/   สไลด์ที่ใช้บรรยายในคลาส (PDF)
├── Resources/      ไฟล์ประกอบที่ผู้เรียนต้องใช้ใน Workshop (ภาพ Rich Menu ฯลฯ)
└── .gitignore
```

### 📄 Outlines/

| ไฟล์ | คำอธิบาย |
| --- | --- |
| [`outline_LINE-Chatbot-Auto-Workflow-2026.md`](Outlines/outline_LINE-Chatbot-Auto-Workflow-2026.md) | Course outline ฉบับเต็ม: แนวคิดหลักสูตร วัตถุประสงค์ จุดเด่น กลุ่มเป้าหมาย พื้นฐานที่ต้องมี Tech Stack กำหนดการทั้ง 2 วัน และสิ่งที่ผู้เรียนได้กลับไป |
| `Course-Outline_LINE-Workflow-Automation-Claude-Code-MCP.pdf` | outline เวอร์ชัน PDF สำหรับส่งให้ผู้เรียนและใช้ประชาสัมพันธ์ |

### 📝 Notes/

เอกสารประกอบการสอนแบบละเอียด เขียนให้อ่านตามได้เองทีละขั้น มีทั้งคำอธิบายแนวคิด แผนภาพ ASCII ตารางสเปก prompt สำเร็จรูป จุดสอนสำคัญ Checkpoint ท้ายแต่ละ Workshop และตารางแก้ปัญหาที่พบบ่อย

| ไฟล์ | เนื้อหา |
| --- | --- |
| [`Day1_note.md`](Notes/Day1_note.md) | **วันที่ 1 — เชื่อม AI Agent เข้า LINE ด้วย MCP + งานแจ้งเตือนองค์กร**<br>Module 1 จาก AI Chat สู่ AI Agent และ MCP · Module 2 ตั้งค่า LINE OA และเชื่อม MCP เข้ากับ Claude Code · Workshop 1 HR Notification Bot · Workshop 2 Rich Menu องค์กร + Cross-check บน GPT Codex |
| [`Day2_note.md`](Notes/Day2_note.md) | **วันที่ 2 — Auto Workflow เต็มระบบ**<br>Module 3 สถาปัตยกรรม Auto Workflow · Workshop 3 Group Chat Recorder · Workshop 4 AI สรุปประชุมกลุ่ม ติดตามงาน และ Admin Dashboard · Workshop 5 (Capstone) Executive Daily Report · Module 4 Codex Cross-check, Governance และแนวทางต่อยอด |

### 🖥 Presentation/

| ไฟล์ | คำอธิบาย |
| --- | --- |
| `LINE Workflow Automation Workshop.pdf` | สไลด์ประกอบการบรรยายตลอดหลักสูตร |

### 🖼 Resources/

ไฟล์ประกอบที่ผู้เรียน **ต้องใช้จริงระหว่างทำ Workshop** เตรียมไว้ให้พร้อมใช้ ไม่ต้องออกแบบเองในคลาส

| ไฟล์ | ใช้ตอนไหน | รายละเอียด |
| --- | --- | --- |
| `Images/LINE_Rich_Menu_HR_2500x1686.jpg` | **Workshop 2** (Day 1) — ขั้นตอนอัปโหลดภาพ Rich Menu | ภาพพื้นหลัง Rich Menu "เมนูบริการพนักงาน" ขนาดมาตรฐาน **2500 × 1686 px** แบ่ง 6 ช่องเท่ากัน (3 คอลัมน์ × 2 แถว) เรียงตามลำดับเดียวกับ prompt ในโน้ต: ประกาศบริษัท · ขอเอกสาร HR · แจ้งลา / ลาป่วย · เบอร์ติดต่อภายใน · เว็บไซต์บริษัท · ติดต่อฝ่ายบุคคล |

> ช่องในภาพถูกวางให้ตรงกับค่า `bounds` ที่คำนวณจาก 2500 ÷ 3 และ 1686 ÷ 2 พอดี จึงใช้เป็น "เฉลย" สำหรับตรวจว่า `bounds` ที่ AI คำนวณมาให้ถูกต้องหรือไม่ (ดู Workshop 2 Part B ใน [`Notes/Day1_note.md`](Notes/Day1_note.md))

> **หมายเหตุ:** ไฟล์ชุด workshop (โค้ดตัวอย่าง, mockup, ไฟล์ seed ฐานข้อมูล, คู่มือ Pre-course Setup) ไม่ได้เก็บใน repo นี้ ตามที่ระบุไว้ใน `.gitignore` — ผู้เรียนจะได้รับแยกในวันอบรม

---

## ภาพรวมการเรียน 2 วัน

| วัน | โฟกัส | ผลลัพธ์หลัก |
| --- | --- | --- |
| **Day 1** (เสาร์ 8 ส.ค.) | เชื่อม AI Agent เข้า LINE ด้วย MCP + งานแจ้งเตือนองค์กร | LINE OA ที่สั่งงานด้วยภาษาไทยผ่าน Claude Code ได้จริง: แจ้งเตือน HR, broadcast ประกาศ, Flex Message และ Rich Menu |
| **Day 2** (อาทิตย์ 9 ส.ค.) | Auto Workflow เต็มระบบ: เก็บแชทกลุ่ม สรุปงาน รายงานอัตโนมัติ | ระบบเก็บแชทกลุ่มลงฐานข้อมูล + AI สรุปประชุมและติดตามงานส่งกลับเข้ากลุ่ม + รายงานธุรกิจประจำวันที่รันเองทุกเช้า |

### Workshop ทั้งหมด

ทุก Workshop ร้อยเรียงบนสถานการณ์จำลองเดียวกัน คือบริษัท **"สยามสมาร์ทเทรด"** ซึ่งสื่อสารกันผ่าน LINE เป็นหลัก (ข้อมูลจำลองทั้งหมด ไม่เกี่ยวข้องกับบุคคลหรือบริษัทจริง)

| # | Workshop | สิ่งที่ได้ลงมือทำ |
| --- | --- | --- |
| 1 | HR Notification Bot | แจ้งนัดประชุมรายบุคคล, ดึงผู้ติดตามด้วย `get_follower_ids`, ตรวจโควต้า, broadcast ประกาศวันหยุด, Flex Message ประกาศรับสมัครงานภายใน |
| 2 | Rich Menu องค์กร + GPT Codex | สั่ง AI สร้าง Rich Menu เมนูบริการพนักงาน 6 ช่อง พร้อมตรวจค่า `bounds` ที่ AI คำนวณ อัปโหลดภาพสำเร็จรูปจาก [`Resources/Images/`](Resources/Images) แล้วรัน prompt ชุดเดิมบน Codex CLI เทียบผล |
| 3 | Group Chat Recorder | ให้ Claude Code สร้าง Webhook Server (Node.js + Express + `@line/bot-sdk`) เก็บข้อความจากไลน์กลุ่มลง PostgreSQL และเปิดสู่ HTTPS ด้วย ngrok |
| 4 | AI สรุปประชุมกลุ่ม + Admin Dashboard | ต่อ Postgres MCP แล้วสั่ง AI วิเคราะห์บทสนทนา สรุปประเด็น หางานที่มีคนรับปาก และส่งสรุปกลับเข้ากลุ่มเป็น Flex Message |
| 5 | **Capstone** — Executive Daily Report | สร้างสคริปต์รายงานยอดขายรายวัน (มี dry-run + Anomaly Detection) ส่ง Flex Message เข้ากลุ่มผู้บริหาร และตั้งเวลารันอัตโนมัติ 08:00 ด้วย Windows Task Scheduler |

---

## Tech Stack ที่ใช้ในหลักสูตร

| หมวด | เครื่องมือ |
| --- | --- |
| AI Agent หลัก | Claude Code (CLI) |
| AI Agent เสริม | GPT Codex (Codex CLI) — สาธิต prompt ชุดเดียวกันและการตั้งค่า MCP |
| MCP ขาส่ง LINE | `@line/line-bot-mcp-server` v0.5.0 (MCP อย่างเป็นทางการจาก LINE) |
| MCP ขาอ่านข้อมูล | `@modelcontextprotocol/server-postgres` |
| LINE Platform | LINE Official Account, Messaging API, Flex Message, Rich Menu |
| Webhook Server | Node.js v22 + Express + `@line/bot-sdk` |
| ฐานข้อมูล | PostgreSQL 16 |
| Tunnel | ngrok หรือ cloudflared |
| Automation | Windows Task Scheduler |
| เครื่องมือเสริม | Flex Message Simulator, MCP Inspector |

---

## สิ่งที่ควรเตรียมก่อนเรียน

- คอมพิวเตอร์ Windows (แนะนำ) หรือ macOS พร้อมสิทธิ์ติดตั้งโปรแกรม และอินเทอร์เน็ตเสถียร
- **Node.js v22 ขึ้นไป** (จำเป็นสำหรับ `line-bot-mcp-server` — เป็นสาเหตุอันดับ 1 ที่ MCP ต่อไม่ติด), PostgreSQL 16 และ Git
- Claude Code พร้อมบัญชี Claude แบบ Pro ขึ้นไป (ผู้ที่ต้องการทดลองฝั่ง Codex เตรียม Codex CLI + บัญชี ChatGPT Plus เพิ่ม — ไม่บังคับ)
- บัญชี [LINE Developers](https://developers.line.biz/console/) และบัญชี ngrok แบบฟรี
- มือถือที่ใช้งาน LINE ได้ตามปกติ สำหรับทดสอบรับข้อความและอยู่ในไลน์กลุ่มทดสอบ
- Zoom เวอร์ชันล่าสุด และหน้าจอที่สอง (ถ้ามี) จะช่วยให้ทำ Workshop ตามได้สะดวกขึ้น

ตรวจความพร้อมด้วยคำสั่งนี้ — ทุกข้อต้องผ่าน

```bash
node -v          # ต้องได้ v22.x.x หรือสูงกว่า
npm -v
git --version
claude --version
```

---

## เริ่มอ่านจากไหนดี

1. **อยากรู้ภาพรวมหลักสูตร** → [`Outlines/outline_LINE-Chatbot-Auto-Workflow-2026.md`](Outlines/outline_LINE-Chatbot-Auto-Workflow-2026.md)
2. **ทบทวนเนื้อหาวันแรก / ตั้งค่า MCP ให้ต่อติด** → [`Notes/Day1_note.md`](Notes/Day1_note.md)
3. **สร้างระบบเก็บแชทกลุ่มและรายงานอัตโนมัติ** → [`Notes/Day2_note.md`](Notes/Day2_note.md)

---

## ข้อควรระวังด้าน Security และ Privacy

หลักสูตรนี้ย้ำแนวปฏิบัติต่อไปนี้ตลอดทั้ง 2 วัน

- เก็บ Channel access token / Channel secret ใน `.env` เท่านั้น **ห้าม hard-code หรือ commit** และใส่ `.env` ใน `.gitignore` ทุกโปรเจกต์
- ห้ามวาง token ในแชท, Zoom chat หรือสไลด์ — token คือกุญแจของ OA ทั้งบัญชี หากสงสัยว่ารั่วให้กด Issue ใหม่ทันที
- **ขอความยินยอมก่อนเก็บบทสนทนาไลน์กลุ่มทุกครั้ง** และใช้ read-only user เมื่อต่อกับฐานข้อมูลจริง
- ใส่ human-in-the-loop ("ก่อนส่งให้แสดงให้ผมอ่านยืนยันก่อน") ในทุก prompt ที่ส่งถึงคนหมู่มาก ย้อนกลับไม่ได้ หรือมีค่าใช้จ่าย
- ระวังโควต้า: `broadcast` 1 ครั้งนับโควต้า **เท่ากับจำนวนผู้รับ** ให้เรียก `get_message_quota` ตรวจก่อนเสมอ

---

## เอกสารอ้างอิงหลัก

- [LINE Bot MCP Server (Official)](https://github.com/line/line-bot-mcp-server)
- [LINE Messaging API — Getting Started](https://developers.line.biz/en/docs/messaging-api/getting-started/)
- [LINE Messaging API — Group Chats](https://developers.line.biz/en/docs/messaging-api/group-chats/)
- [LINE Flex Message Simulator](https://developers.line.biz/flex-simulator/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code — MCP](https://docs.claude.com/en/docs/claude-code/mcp)
- [OpenAI Codex CLI](https://developers.openai.com/codex/cli/)

---

## ผู้สอน

**อ.สามิตร โกยม** — ผู้สอนและผู้พัฒนาซอฟต์แวร์ที่มีประสบการณ์กว่า 15 ปี ถ่ายทอดความรู้ด้าน Mobile App Development, Web Development, AI Tools และการประยุกต์ใช้เทคโนโลยีในงานจริงให้กับผู้เรียนและองค์กรจำนวนมาก

จุดเด่นของการสอนคือการอธิบายเรื่องเทคนิคให้เข้าใจง่าย เชื่อมโยงกับงานจริง และพาผู้เรียนลงมือทำจนเห็นผลลัพธ์ด้วยตัวเอง

---

## ติดต่อ

**สถาบันไอทีจีเนียส เอ็นจิเนียริ่ง (IT Genius Engineering)**
โทร. 02-570-8449 · มือถือ 088-807-9770
เว็บไซต์: [www.itgenius.co.th](https://www.itgenius.co.th)

---

> เอกสารในที่เก็บนี้จัดทำเพื่อใช้ประกอบการอบรมเท่านั้น ข้อมูลบริษัท ยอดขาย และบทสนทนาทั้งหมดเป็นข้อมูลจำลอง ไม่เกี่ยวข้องกับบุคคลหรือองค์กรจริงใด ๆ
