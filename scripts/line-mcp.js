#!/usr/bin/env node
/*
 * ตัวกลางเปิด LINE MCP server ให้ใช้ได้ทั้ง Windows / macOS / Linux
 *
 * ทำไมต้องมีไฟล์นี้:
 *   .mcp.json เขียน token เป็น ${LINE_HR_TOKEN} ไม่ได้ เพราะ Claude Desktop
 *   ไม่แทนค่าให้ (ส่งข้อความดิบ ๆ เข้าไป -> LINE ตอบ 401) ส่วน CLI แทนค่าให้
 *   ไฟล์นี้จึงอ่าน env เองตอนรัน แล้วค่อยส่งต่อให้ MCP server
 *
 * วิธีใช้:  node scripts/line-mcp.js <ชื่อ ENV ที่เก็บ token>
 * ตัวอย่าง: node scripts/line-mcp.js LINE_HR_TOKEN
 */
const { spawn } = require('child_process');

const tokenVar = process.argv[2];
if (!tokenVar) {
  console.error('[line-mcp] ต้องระบุชื่อ env var ของ token เช่น LINE_HR_TOKEN');
  process.exit(1);
}

const token = process.env[tokenVar];
const userId = process.env.LINE_USER_ID;

for (const [name, value] of [[tokenVar, token], ['LINE_USER_ID', userId]]) {
  if (!value) {
    console.error(`[line-mcp] ไม่พบค่า ${name} — ตรวจ .claude/settings.local.json`);
    process.exit(1);
  }
}

// Windows ต้องเรียก npx.cmd และต้องผ่าน shell (Node บล็อกการรัน .cmd ตรง ๆ)
const isWindows = process.platform === 'win32';

const child = spawn(isWindows ? 'npx.cmd' : 'npx', ['-y', '@line/line-bot-mcp-server'], {
  stdio: 'inherit', // ส่ง stdin/stdout ทะลุถึง Claude เพื่อให้ JSON-RPC คุยกันได้
  shell: isWindows,
  env: {
    ...process.env,
    NPM_CONFIG_IGNORE_SCRIPTS: 'true',
    CHANNEL_ACCESS_TOKEN: token,
    DESTINATION_USER_ID: userId,
  },
});

child.on('error', (e) => {
  console.error('[line-mcp] เปิด server ไม่สำเร็จ:', e.message);
  process.exit(1);
});
child.on('exit', (code, signal) => process.exit(signal ? 1 : code ?? 0));
