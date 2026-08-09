# ตั้งค่า LINE MCP Server (3 Channel)

`.mcp.json` ในโปรเจกต์นี้ **ไม่มี token อยู่ข้างใน** — token ถูกอ่านจาก environment variable
ตอนรันโดย [`scripts/line-mcp.js`](scripts/line-mcp.js) ดังนั้นไฟล์นี้ commit ขึ้น git ได้ปลอดภัย
ส่วนแต่ละคนไปตั้งค่า token ของตัวเองที่เครื่องตัวเอง

> **ทำไมต้องมีสคริปต์ตัวกลาง** — เดิม `.mcp.json` เขียน token เป็น `"${LINE_HR_TOKEN}"` ตรง ๆ
> ซึ่ง **Claude Code CLI แทนค่าให้ แต่ Claude Desktop ไม่แทน** มันส่งข้อความ `${LINE_HR_TOKEN}`
> ดิบ ๆ เข้าไปเป็น token → LINE ตอบ `401 Unauthorized` ทุก OA และ**ปิดเปิดโปรแกรมกี่รอบก็ไม่หาย**
> เพราะไม่ใช่ปัญหาชั่วคราวตอนเปิดโปรแกรม
> สคริปต์ตัวกลางอ่าน env เองตอนรัน จึงทำงานเหมือนกันทั้ง CLI และ Desktop และครบทุก OS

| Channel (LINE Developers) | ชื่อ MCP server | Environment variable |
| --- | --- | --- |
| HR Notification | `line-hr` | `LINE_HR_TOKEN` |
| Sale Notification | `line-sale` | `LINE_SALE_TOKEN` |
| Support Notification | `line-support` | `LINE_SUPPORT_TOKEN` |
| (ใช้ร่วมกันทั้ง 3) | — | `LINE_USER_ID` |

---

## ไฟล์ 2 ตัวที่ทำให้ทั้งหมดนี้ทำงาน

> ถ้า clone repo นี้มา **มีให้แล้วทั้งคู่ ข้ามไปขั้นที่ 1 ได้เลย**
> หัวข้อนี้สำหรับคนที่สร้างโปรเจกต์เองตั้งแต่ต้น หรืออยากเข้าใจว่ามันทำงานยังไง

### 1. `.mcp.json` (ที่ root ของโปรเจกต์)

ไม่มีค่าลับอยู่ข้างใน commit ขึ้น git ได้

```json
{
  "mcpServers": {
    "line-hr": {
      "type": "stdio",
      "command": "node",
      "args": ["scripts/line-mcp.js", "LINE_HR_TOKEN"]
    },
    "line-sale": {
      "type": "stdio",
      "command": "node",
      "args": ["scripts/line-mcp.js", "LINE_SALE_TOKEN"]
    },
    "line-support": {
      "type": "stdio",
      "command": "node",
      "args": ["scripts/line-mcp.js", "LINE_SUPPORT_TOKEN"]
    }
  }
}
```

ค่าตัวที่สองใน `args` คือ **ชื่อ environment variable** ที่เก็บ token ของ Channel นั้น — ไม่ใช่ตัว token
อยากเพิ่ม OA ตัวที่ 4 ก็ก๊อปบล็อกเดิมแล้วเปลี่ยนแค่ชื่อ server กับชื่อตัวแปร

### 2. `scripts/line-mcp.js`

ตัวกลางที่อ่าน env ตอนรันแล้วส่งต่อให้ MCP server โค้ดเต็มอยู่ที่ [`scripts/line-mcp.js`](scripts/line-mcp.js)
หัวใจคือส่วนนี้

```js
const isWindows = process.platform === 'win32';

const child = spawn(isWindows ? 'npx.cmd' : 'npx', ['-y', '@line/line-bot-mcp-server'], {
  stdio: 'inherit',
  shell: isWindows,
  env: { ...process.env, CHANNEL_ACCESS_TOKEN: token, DESTINATION_USER_ID: userId },
});
```

จุดที่ต้องเข้าใจ 3 อย่าง

| บรรทัด | ทำไมต้องมี |
| --- | --- |
| `isWindows ? 'npx.cmd' : 'npx'` | Windows ไม่มีไฟล์ชื่อ `npx` เฉย ๆ ต้องเรียก `npx.cmd` |
| `shell: isWindows` | Node รุ่นใหม่บล็อกการรันไฟล์ `.cmd` ตรง ๆ (อุดช่องโหว่ด้านความปลอดภัย) ต้องผ่าน shell |
| `stdio: 'inherit'` | ทำให้ JSON-RPC ระหว่าง Claude กับ MCP server ทะลุถึงกัน — **ขาดบรรทัดนี้ server จะเงียบ ไม่ตอบอะไรเลย** |

---

## ขั้นที่ 1 — หาค่าที่ต้องใช้ (เหมือนกันทุก OS)

เข้า [LINE Developers Console](https://developers.line.biz/console/) > Provider **ClaudeMCPDev** > เลือก Channel

- **Channel access token** — แท็บ `Messaging API` > หัวข้อ *Channel access token (long-lived)* > กด **Issue** แล้วคัดลอก
- **Your user ID** — แท็บ `Basic settings` > *Your user ID* (ขึ้นต้นด้วย `U`)

> ค่า user ID เป็นค่าเดียวกันทั้ง 3 Channel เพราะอยู่ภายใต้ Provider เดียวกัน
> LINE ออก user ID ในระดับ Provider ไม่ใช่ระดับ Channel

**สำคัญ:** ต้องสแกน QR เพิ่ม OA ทั้ง 3 ตัวเป็นเพื่อนใน LINE ก่อน (QR อยู่ในแท็บ `Messaging API`)
ถ้ายังไม่ได้เพิ่มเพื่อน การ push จะขึ้น error **403 Forbidden**

---

## ขั้นที่ 2 — ใส่ token

มี 2 วิธี เลือกอย่างใดอย่างหนึ่ง

| | วิธี A — ไฟล์ในโปรเจกต์ | วิธี B — env var ระดับเครื่อง |
| --- | --- | --- |
| คำสั่งที่ต้องจำ | ไม่มี แก้ไฟล์ JSON อย่างเดียว | `setx` / `launchctl` |
| Windows กับ macOS | **เหมือนกันเป๊ะ** | คนละคำสั่ง |
| ขอบเขต | เฉพาะโปรเจกต์นี้ | ทั้งเครื่อง ทุกโปรแกรม |
| เหมาะกับ | **สอนในคลาส / หลายโปรเจกต์แยก token** | ใช้ token ชุดเดียวข้ามหลายโปรเจกต์ |

**แนะนำวิธี A สำหรับการอบรม** — ขั้นตอนเหมือนกันทุกเครื่อง ไม่ต้องแยกคำอธิบาย Windows/macOS
และไม่ต้องปิดโปรแกรมทั้งระบบ

---

### ✅ วิธี A — `.claude/settings.local.json` (แนะนำ)

แก้ไฟล์ [`.claude/settings.local.json`](.claude/settings.local.json) เติมค่าจริงลงไป

```json
{
  "env": {
    "LINE_HR_TOKEN": "<Channel access token ของ HR Notification>",
    "LINE_SALE_TOKEN": "<Channel access token ของ Sale Notification>",
    "LINE_SUPPORT_TOKEN": "<Channel access token ของ Support Notification>",
    "LINE_USER_ID": "<Your user ID ขึ้นต้นด้วย U>"
  },
  "enabledMcpjsonServers": [
    "line-hr",
    "line-sale",
    "line-support"
  ]
}
```

ไฟล์นี้ถูก `.gitignore` ไว้แล้ว จะไม่หลุดขึ้น git

**`enabledMcpjsonServers` จำเป็นไหม** — ไม่จำเป็น ใส่หรือไม่ใส่ระบบก็ทำงานได้เหมือนกัน
มันทำหน้าที่เดียวคือ **อนุมัติ MCP server จาก `.mcp.json` ไว้ล่วงหน้า** จะได้ไม่ต้องกดอนุมัติตอนเปิดโปรเจกต์

| | ผลที่ได้ |
| --- | --- |
| ใส่ | เปิดโปรเจกต์แล้ว server พร้อมใช้เลย ไม่มีหน้าต่างถาม |
| ไม่ใส่ | มีหน้าต่างถามอนุมัติครั้งแรก กด "อนุมัติ" แล้วจำค่าไว้ให้ ครั้งต่อไปไม่ถามอีก |

**แนะนำให้ใส่ตอนสอน** เพราะตัดขั้นตอนที่ผู้เรียนมักงงออกไปหนึ่งจุด และทุกคนได้ผลตรงกัน

> 📖 เอกสารทางการระบุว่าเป็น *"List of specific MCP servers from `.mcp.json` files to approve"*
> ถ้าอยากอนุมัติทุกตัวรวดเดียวโดยไม่ต้องไล่ชื่อ ใช้ `"enableAllProjectMcpServers": true` แทนได้
> — https://code.claude.com/docs/en/settings

> **ลืมเติมค่าแล้วจะรู้ทันที** — `scripts/line-mcp.js` ตรวจ env ก่อนเปิด server ถ้าไม่เจอจะหยุด
> พร้อมข้อความ `[line-mcp] ไม่พบค่า LINE_HR_TOKEN — ตรวจ .claude/settings.local.json`
> ไม่ปล่อยให้ไปตาย `401` ทีหลังแล้วไล่หาสาเหตุไม่เจอ

#### ⚠️ กับดักที่ต้องรู้

คำสั่ง `claude mcp list` จะขึ้น warning นี้ **ทั้งที่ระบบทำงานได้ปกติ**

```
├ [Warning] [line-hr] Missing environment variables: LINE_HR_TOKEN, LINE_USER_ID
```

เป็น **false alarm** เพราะ subcommand `mcp list` ไม่ได้โหลด project settings เหมือน session จริง
**อย่าไปไล่แก้ตามนี้** ให้ตรวจสถานะจริงด้วย `/mcp` ในเซสชัน Claude Code แทน

---

### วิธี B — environment variable ระดับเครื่อง

เลือกทำตาม OS ของตัวเอง

#### 🪟 Windows

เปิด **PowerShell** แล้วรันทีละบรรทัด

```powershell
setx LINE_HR_TOKEN      "<Channel access token ของ HR Notification>"
setx LINE_SALE_TOKEN    "<Channel access token ของ Sale Notification>"
setx LINE_SUPPORT_TOKEN "<Channel access token ของ Support Notification>"
setx LINE_USER_ID       "<Your user ID ขึ้นต้นด้วย U>"
```

ตรวจผล — เปิด PowerShell **หน้าต่างใหม่** แล้วรัน (ต้องได้เลข ไม่ใช่ 0):

```powershell
"HR=$($env:LINE_HR_TOKEN.Length) SALE=$($env:LINE_SALE_TOKEN.Length) SUPPORT=$($env:LINE_SUPPORT_TOKEN.Length) USER=$($env:LINE_USER_ID)"
```

#### 🍎 macOS

macOS มีจุดที่คนติดกันเยอะ: **`export` ใน `~/.zshrc` มีผลเฉพาะโปรแกรมที่เปิดจาก Terminal เท่านั้น**
แอปที่เปิดจาก Dock หรือ Finder (เช่น Claude Desktop) **จะมองไม่เห็นค่าเหล่านั้นเลย**

**B.1 สำหรับ Claude Code CLI (เปิดจาก Terminal)**

```bash
cat >> ~/.zshrc << 'EOF'

# LINE MCP Server — 3 Channel
export LINE_HR_TOKEN="<Channel access token ของ HR Notification>"
export LINE_SALE_TOKEN="<Channel access token ของ Sale Notification>"
export LINE_SUPPORT_TOKEN="<Channel access token ของ Support Notification>"
export LINE_USER_ID="<Your user ID ขึ้นต้นด้วย U>"
EOF
```

```bash
source ~/.zshrc
```

> ถ้าใช้ bash แทน zsh ให้เปลี่ยนเป็น `~/.bash_profile` — เช็คด้วย `echo $SHELL`

ตรวจผล (ต้องได้เลข ไม่ใช่ 0):

```bash
echo "HR=${#LINE_HR_TOKEN} SALE=${#LINE_SALE_TOKEN} SUPPORT=${#LINE_SUPPORT_TOKEN} USER=$LINE_USER_ID"
```

**B.2 สำหรับ Claude Desktop / Cowork (เปิดจาก Dock)**

```bash
launchctl setenv LINE_HR_TOKEN "$LINE_HR_TOKEN"
launchctl setenv LINE_SALE_TOKEN "$LINE_SALE_TOKEN"
launchctl setenv LINE_SUPPORT_TOKEN "$LINE_SUPPORT_TOKEN"
launchctl setenv LINE_USER_ID "$LINE_USER_ID"
```

> ⚠️ `launchctl setenv` **หายเมื่อ restart เครื่องหรือ logout** ต้องรันใหม่ทุกครั้ง
> ถ้าอยากถาวร ดูหัวข้อ *ทำให้ launchctl ถาวร* ท้ายไฟล์
> — หรือใช้**วิธี A** ซึ่งไม่มีปัญหานี้เลย

**ทางลัด** ถ้าใช้แค่ VS Code: ข้าม B.2 แล้วเปิด VS Code จาก Terminal แทน จะได้ env ครบ

```bash
cd /path/to/line-workflow-claude-mcp && code .
```

---

## ขั้นที่ 3 — เปิด Claude Code ใหม่แล้วอนุมัติ

| ใช้วิธีไหน | ต้องทำอะไร |
| --- | --- |
| วิธี A | เริ่มเซสชันใหม่พอ (`/mcp` reconnect ได้) |
| วิธี B | ต้องปิดโปรแกรม**ให้สนิท**แล้วเปิดใหม่ — Windows: ปิดทุกหน้าต่าง / macOS: `Cmd + Q` |

เปิด Claude Code ที่โฟลเดอร์โปรเจกต์ แล้วเช็คด้วย `/mcp`
ควรเห็นครบ 3 ตัว: `line-hr`, `line-sale`, `line-support`

> ถ้า**ไม่ได้ใส่** `enabledMcpjsonServers` ไว้ จะมีหน้าต่างถามอนุมัติ MCP server จาก `.mcp.json`
> โผล่มาก่อน (project scope ต้อง approve เสมอ) — กดอนุมัติแล้วค่อยเช็ค `/mcp`

---

## ขั้นที่ 4 — ทดสอบ

สั่งเป็นภาษาไทยได้เลย ระบุชื่อฝ่ายเพื่อให้เลือก Channel ถูกตัว

```
เช็คโปรไฟล์ LINE ของฉันผ่านทั้ง 3 OA หน่อย
```

`get_profile` แค่อ่านข้อมูล ไม่ส่งข้อความ — ใช้ตรวจว่า token ถูกและเพิ่มเพื่อนครบหรือยัง

จากนั้นค่อยลองส่งจริง:

```
ส่ง LINE ฝ่ายบุคคล แจ้งว่า "ทดสอบระบบแจ้งเตือน HR เชื่อมต่อสำเร็จ"
```

> ⚠️ `broadcast_text_message` ส่งถึงผู้ติดตามทุกคนของ Channel นั้นทันทีและ **ยกเลิกไม่ได้**
> ตอนมีหลาย OA ให้ระบุฝ่ายให้ชัดทุกครั้ง

---

## แก้ปัญหาที่พบบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
| --- | --- | --- |
| `claude mcp list` ขึ้น `Missing environment variables` แต่ใช้งานได้ปกติ | false alarm ของ subcommand (เฉพาะวิธี A) | **ไม่ต้องแก้** ดูสถานะจริงที่ `/mcp` |
| `/mcp` ขึ้นว่าหา environment variable ไม่เจอ | ยังไม่เติมค่า หรือ (วิธี B) ปิดโปรแกรมไม่สนิท | เช็คไฟล์ / `Cmd+Q` แล้วเปิดใหม่ |
| CLI เห็น server แต่ Claude Desktop ไม่เห็น (macOS) | แอปจาก Dock ไม่อ่าน `~/.zshrc` | ทำ B.2 หรือย้ายไปใช้วิธี A |
| `spawn npx ENOENT` (macOS) | แอปจาก Dock ไม่เห็น PATH ของ nvm | ดูหัวข้อถัดไป |
| push แล้วได้ `403 Forbidden` | ยังไม่ได้เพิ่ม OA นั้นเป็นเพื่อน | สแกน QR ในแท็บ Messaging API |
| ได้ `401 Unauthorized` **ทั้ง 3 OA พร้อมกัน** บน Claude Desktop แต่ CLI ปกติ | Desktop ไม่แทนค่า `${VAR}` ใน `.mcp.json` ส่ง placeholder ดิบเข้าไปเป็น token | ต้องเรียกผ่าน `scripts/line-mcp.js` (โปรเจกต์นี้ตั้งไว้ให้แล้ว) — **restart ไม่ช่วย** |
| ได้ `401 Unauthorized` ทั้งที่เพิ่งคัดลอก token มา | **กด Issue ซ้ำ** — LINE จะ revoke ตัวเก่าทิ้งทันทีที่ออกตัวใหม่ | กด Issue ครั้งเดียว คัดลอกทันที แล้วอย่ากดซ้ำอีก |
| ได้ `401 Unauthorized` | token หมดอายุ / คัดลอกไม่ครบ | ตรวจความยาวต้องได้ **172 ตัวอักษร** และลงท้ายด้วย `=` |
| ส่งผิด OA | ไม่ได้ระบุฝ่ายในคำสั่ง | พิมพ์ระบุ เช่น "ส่ง LINE **ฝ่ายขาย**" |

### แก้ `spawn npx ENOENT` บน macOS

เกิดกับคนที่ติดตั้ง Node ผ่าน **nvm** เพราะ nvm ใส่ PATH ไว้ใน `~/.zshrc` ซึ่งแอปจาก Dock อ่านไม่ถึง

```bash
which npx
```

`.mcp.json` เรียก `node` แล้วให้ [`scripts/line-mcp.js`](scripts/line-mcp.js) ไปเรียก `npx` อีกทอด
ดังนั้น**แก้ที่สคริปต์ ไม่ใช่ที่ `.mcp.json`** — หาบรรทัด `spawn(...)` แล้วเปลี่ยน `'npx'`
เป็น path เต็มที่ได้จากคำสั่งข้างบน เช่น

```js
spawn(isWindows ? 'npx.cmd' : '/Users/<ชื่อผู้ใช้>/.nvm/versions/node/v22.14.0/bin/npx', ...)
```

> วิธีที่ยั่งยืนกว่าคือติดตั้ง Node ผ่าน Homebrew (`brew install node`) ซึ่งไปอยู่ที่
> `/opt/homebrew/bin/npx` — path มาตรฐานที่แอป GUI มองเห็นเอง
> แต่ path เต็มแบบ hard-code ไม่เหมือนกันในแต่ละเครื่อง ทำให้ commit แล้วเพื่อนใช้ไม่ได้
> ถ้าเจอปัญหานี้ตอนสอน ให้ใช้ `code .` จาก Terminal จะเร็วกว่า

### ทำให้ launchctl ถาวร (macOS, เฉพาะวิธี B)

```bash
mkdir -p ~/Library/LaunchAgents
cat > ~/Library/LaunchAgents/com.user.lineenv.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.user.lineenv</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string>
    <string>-c</string>
    <string>launchctl setenv LINE_HR_TOKEN "ค่าจริง"; launchctl setenv LINE_SALE_TOKEN "ค่าจริง"; launchctl setenv LINE_SUPPORT_TOKEN "ค่าจริง"; launchctl setenv LINE_USER_ID "ค่าจริง"</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
EOF

launchctl load ~/Library/LaunchAgents/com.user.lineenv.plist
```

> ⚠️ ไฟล์ plist นี้มี token แบบ plaintext — อยู่ใน `~/Library` ซึ่งไม่ถูก commit
> แต่ห้ามคัดลอกไปวางในโฟลเดอร์โปรเจกต์เด็ดขาด
