// Run on a dedicated emulator with the debug APK installed: node scripts/test-android.mjs <adb> [serial]
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as pause } from 'node:timers/promises'

const adb = (...args) => execFileSync(process.argv[2] || 'adb', [...(process.argv[3] ? ['-s', process.argv[3]] : []), ...args], { encoding: 'utf8' }).trim()
const app = 'com.montana.finance'
adb('shell', 'am', 'start', '-n', `${app}/.MainActivity`)
const pid = adb('shell', 'pidof', app)
adb('forward', 'tcp:9222', `localabstract:webview_devtools_remote_${pid}`)
const [page] = await (await fetch('http://127.0.0.1:9222/json')).json()
const socket = new WebSocket(page.webSocketDebuggerUrl)
await once(socket, 'open')
let id = 0
const pending = new Map()
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data)
  pending.get(message.id)?.(message)
  pending.delete(message.id)
})
const evaluate = async (expression) => {
  const requestId = ++id
  const response = new Promise((resolve) => pending.set(requestId, resolve))
  socket.send(JSON.stringify({ id: requestId, method: 'Runtime.evaluate', params: { expression, returnByValue: true, awaitPromise: true } }))
  const result = await Promise.race([response, pause(10000, undefined, { ref: false }).then(() => { throw new Error(`Timed out: ${expression}`) })])
  assert.ok(!result.error && !result.result.exceptionDetails, JSON.stringify(result))
  return result.result.result.value
}
const waitFor = async (expression) => {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (await evaluate(expression)) return
    await pause(100)
  }
  assert.fail(`Not ready: ${expression}`)
}
const click = (label) => evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(label)}).click()`)
try {
  await waitFor('!!document.querySelector("h1, h2")')
  assert.equal(await evaluate('Capacitor.getPlatform()'), 'android')
  assert.equal(await evaluate('navigator.serviceWorker.getRegistrations().then(r => r.length)'), 0)
  assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
  await evaluate('location.hash = "/settings"')
  await waitFor('document.body.textContent.includes("Công cụ dữ liệu")')
  await click('Xoá dữ liệu trên máy này')
  await waitFor('!!document.querySelector("button[aria-label=Đóng]")')
  adb('shell', 'input', 'keyevent', '4')
  await waitFor('!document.querySelector("button[aria-label=Đóng]")')
  assert.equal(await evaluate('location.hash'), '#/settings', 'Back must close the modal without leaving Settings')
  await evaluate('window.exportErrors = []; window.alert = message => window.exportErrors.push(message)')
  await click('Xuất JSON')
  const filename = await evaluate('`montana-backup-${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}-${String(new Date().getDate()).padStart(2,"0")}.json`')
  await pause(700)
  const backup = JSON.parse(adb('shell', 'run-as', app, 'cat', `cache/${filename}`))
  assert.equal(backup.app, 'montana')
  assert.deepEqual(backup.tables, await evaluate('JSON.parse(localStorage.getItem("montana:v1")).tables'))
  assert.match(adb('shell', 'dumpsys', 'activity', 'activities'), /ChooserActivity/, 'Export must open Android sharing')
  adb('shell', 'input', 'keyevent', '4')
  await pause(300)
  assert.deepEqual(await evaluate('window.exportErrors'), [], 'Canceling sharing must not report an export failure')
  console.log('Android: native bridge, layout, no service worker, modal Back, JSON backup and native sharing passed.')
} finally {
  socket.close()
  adb('forward', '--remove', 'tcp:9222')
}
