import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the real event handlers without making API requests or changing browser storage.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
function element() {
  const classes = new Set();
  return {
    value: '', textContent: '', dataset: {}, events: {}, options: [], children: [],
    setAttribute(name, value) { this[name] = value; },
    set innerHTML(value) { this.options = []; this.value = ''; },
    appendChild(option) { this.options.push(option); if (this.options.length === 1) this.value = option.value; },
    addEventListener(name, handler) { this.events[name] = handler; },
    classList: {
      add(name) { classes.add(name); },
      remove(...names) { names.forEach((name) => classes.delete(name)); },
      toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); },
      contains(name) { return classes.has(name); }
    }
  };
}
const nodes = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => [match[1], element()]));
nodes.get('imageCount').value = '1';
const presets = [...html.matchAll(/data-size-preset="([^"]+)"/g)].map((match) => {
  const button = element();
  button.dataset.sizePreset = match[1];
  return button;
});
const document = {
  body: element(),
  createElement: element,
  getElementById: (id) => nodes.get(id) ?? null,
  querySelectorAll: (selector) => selector === '[data-size-preset]' ? presets : [],
  addEventListener() {}
};
const context = vm.createContext({ document, window: { location: { search: '' }, addEventListener() {} }, URLSearchParams,
  FormData, Blob, localStorage: { getItem() { return null; }, removeItem() {}, setItem() {} }
});
vm.runInContext(source.replace(/^init\(\);\r?$/m, ''), context);
vm.runInContext('bindEvents();', context);
const size = nodes.get('size');
const width = nodes.get('customSizeWidth');
const height = nodes.get('customSizeHeight');
for (const button of presets) {
  button.events.click();
  assert.equal(`${width.value}x${height.value}`, button.dataset.sizePreset);
  assert.equal(size.value, button.dataset.sizePreset);
  assert.equal(presets.filter((item) => item.classList.contains('active')).length, 1);
}
presets.find((button) => button.dataset.sizePreset === '2048x1536').events.click();
assert.equal(`${width.value}x${height.value}`, '2048x1536');
width.value = '1600';
width.events.input();
assert.equal(size.value, 'custom');
assert.equal(height.value, '1536');
height.value = '1200';
height.events.input();
assert.equal(vm.runInContext('resolveSizeValue()', context), '1600x1200');
assert.equal(vm.runInContext('validateCustomSize()', context), '');
assert.ok(presets.every((button) => !button.classList.contains('active')));
width.value = '1601';
width.events.input();
assert.match(nodes.get('sizeSummary').textContent, /16px/);
presets.find((button) => button.dataset.sizePreset === '1024x1024').events.click();
assert.equal(`${width.value}x${height.value}`, '1024x1024');
assert.equal(vm.runInContext('validateCustomSize()', context), '');
console.log('Size settings: preset sync, manual edits, request dimensions and validation passed.');

const model = nodes.get('imageModel');
model.value = 'gpt-image-2';
const modelList = JSON.stringify([
  { value: 'gpt-image-1', label: 'gpt-image-1' },
  { value: 'gpt-image-2', label: 'gpt-image-2' },
  { value: 'gpt-5.5', label: 'gpt-5.5' }
]);
vm.runInContext(`applyLoadedModelOptions(${modelList}, 'test-config', false)`, context);
assert.deepEqual(model.options.map((option) => option.value), ['gpt-image-1', 'gpt-image-2']);
assert.equal(model.value, 'gpt-image-2');
model.value = 'gpt-image-1';
model.events.change();
vm.runInContext('updateApiModeUI()', context);
vm.runInContext(`applyLoadedModelOptions(${modelList}, 'test-config', true)`, context);
assert.equal(model.value, 'gpt-image-1', 'refreshing the model list must retain the selection');
nodes.get('apiUrl').value = 'https://example.invalid';
nodes.get('apiKey').value = 'test-only';
nodes.get('prompt').value = 'test image';
let request = await vm.runInContext('buildGenerationRequest()', context);
assert.equal(JSON.parse(request.body).model, 'gpt-image-1');
assert.ok(request.url.endsWith('/images/generations'));
vm.runInContext("state.mode = 'edit'", context);
request = await vm.runInContext('buildGenerationRequest()', context);
assert.equal(request.body.get('model'), 'gpt-image-1');
assert.ok(request.url.endsWith('/images/edits'));
vm.runInContext("state.mode = 'mask'; exportMaskBlob = async () => new Blob(['test-mask'], { type: 'image/png' })", context);
request = await vm.runInContext('buildGenerationRequest()', context);
assert.equal(request.body.get('model'), 'gpt-image-1');
assert.ok(request.body.has('mask'));
assert.equal(vm.runInContext('normalizeCachedForm(captureCurrentForm()).model', context), 'gpt-image-1');
vm.runInContext('resetModelSelectsToDefaults()', context);
assert.deepEqual(model.options.map((option) => option.value), ['gpt-image-2']);
vm.runInContext('applyLoadedModelOptions([], "test-config", false)', context);
assert.equal(model.value, 'gpt-image-2');
console.log('Model selection: loading, refresh, all three request modes, history data and fallback passed.');

// A cached automatic load must not substitute for a user-requested connection test.
const storage = new Map();
context.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key)
};
context.window.setTimeout = () => {};
const requests = [];
context.fetch = (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject }));
const respond = (request, status, body) => request.resolve({ ok: status >= 200 && status < 300, status, text: async () => body });
const reply = JSON.stringify({ data: [{ id: 'gpt-image-2' }] });
const summary = nodes.get('configSummary');
const badge = nodes.get('apiStatusText');
const testButton = nodes.get('saveConfigButton');
const checkStatus = (text) => {
  assert.equal(summary.textContent, text);
  assert.equal(badge.textContent, text);
};
vm.runInContext(`writeModelListCache(getConfigSignature(), ${modelList})`, context);
await vm.runInContext('loadModels()', context);
assert.equal(requests.length, 0);
checkStatus('模型已缓存，待测试连接');
nodes.get('configDetails').open = true;
let pending = testButton.events.click();
assert.equal(requests.length, 1);
assert.equal(requests[0].options.cache, 'no-store');
assert.equal(requests[0].options.headers.Authorization, 'Bearer test-only');
checkStatus('连接测试中');
assert.equal(testButton.disabled, true);
await testButton.events.click();
assert.equal(requests.length, 1, 'duplicate clicks must not start concurrent tests');
respond(requests[0], 200, reply);
await pending;
checkStatus('连接成功');
assert.equal(testButton.disabled, false);
assert.equal(nodes.get('configDetails').open, true);
await vm.runInContext('loadModels()', context);
assert.equal(requests.length, 1, 'automatic loads still use the refreshed cache');
pending = testButton.events.click();
assert.equal(requests.length, 2, 'a second manual test must bypass the new cache too');
respond(requests[1], 401, JSON.stringify({ error: { message: 'Invalid API key' } }));
await pending;
checkStatus('连接失败：Invalid API key');
assert.equal(nodes.get('apiStatus').dataset.state, 'is-error');
assert.equal(storage.has('gpt-image-gen2:model-list-cache'), false);
pending = testButton.events.click();
requests.at(-1).reject(new TypeError('Failed to fetch'));
await pending;
checkStatus('连接失败：Failed to fetch');
pending = testButton.events.click();
respond(requests.at(-1), 200, '{}');
await pending;
checkStatus('连接失败：接口未返回有效的模型列表。');
pending = testButton.events.click();
const oldRequest = requests.at(-1);
nodes.get('apiKey').value = 'new-test-key';
nodes.get('apiKey').events.input();
checkStatus('待测试连接');
const newPending = testButton.events.click();
respond(oldRequest, 401, JSON.stringify({ error: { code: 'INSUFFICIENT_BALANCE' } }));
await pending;
checkStatus('连接测试中');
assert.equal(testButton.disabled, true);
assert.equal(nodes.get('apiKeyBalanceNotice').classList.contains('hidden'), true);
respond(requests.at(-1), 200, reply);
await newPending;
checkStatus('连接成功');
nodes.get('apiUrl').value = '';
nodes.get('apiUrl').events.input();
const count = requests.length;
await testButton.events.click();
assert.equal(requests.length, count);
checkStatus('连接失败：请填写 API URL。');
console.log('Connection checks: cache bypass, pending/success/errors, badge sync and stale responses passed.');

nodes.get('apiUrl').value = 'https://example.invalid';
nodes.get('apiKey').value = 'test-only';
nodes.get('prompt').value = 'quantity test';
const quantity = nodes.get('imageCount');
const decrease = nodes.get('decreaseImageCountButton');
const increase = nodes.get('increaseImageCountButton');
const submit = nodes.get('submitButton');
vm.runInContext('state.mode = "generate"; updateSubmitButton()', context);
assert.equal(decrease.disabled, true);
assert.equal(submit.textContent, '开始生成');
increase.events.click();
assert.equal(Number(quantity.value), 2);
assert.equal(submit.textContent, '开始生成（2 张）');
decrease.events.click();
decrease.events.click();
assert.equal(Number(quantity.value), 1);
quantity.value = '10';
quantity.events.input();
assert.equal(increase.disabled, true);
increase.events.click();
assert.equal(Number(quantity.value), 10);
for (const invalid of ['', '0', '-1', '1.5', '11', 'NaN', '1e2']) {
  quantity.value = invalid;
  quantity.events.input();
  assert.match(vm.runInContext('validateGenerationForm()', context), /1–10/);
  await assert.rejects(vm.runInContext('buildGenerationRequest()', context), /1–10/);
}
for (const amount of [1, 4, 10]) {
  quantity.value = String(amount);
  quantity.events.input();
  vm.runInContext('state.mode = "generate"', context);
  let countRequest = await vm.runInContext('buildGenerationRequest()', context);
  assert.equal(JSON.parse(countRequest.body).n, amount);
  for (const mode of ['edit', 'mask']) {
    vm.runInContext(`state.mode = '${mode}'`, context);
    countRequest = await vm.runInContext('buildGenerationRequest()', context);
    assert.equal(countRequest.body.get('n'), String(amount));
  }
}
quantity.value = '4';
quantity.events.input();
vm.runInContext('state.submitting = true; updateSubmitButton()', context);
assert.equal(quantity.disabled, true);
assert.equal(increase.disabled, true);
assert.equal(decrease.disabled, true);
assert.equal(submit.textContent, '取消请求');
increase.events.click();
assert.equal(Number(quantity.value), 4);
vm.runInContext('state.submitting = false; updateSubmitButton()', context);
assert.equal(submit.textContent, '开始生成（4 张）');
assert.equal(quantity.disabled, false);
assert.equal(vm.runInContext('normalizeCachedForm(captureCurrentForm()).count', context), 4);
assert.equal(vm.runInContext('normalizeCachedForm({}).count', context), 1);
assert.equal(vm.runInContext('normalizeCachedForm({count: 999}).count', context), 1);
assert.equal(vm.runInContext('toPlainHistoryEntry({form:captureCurrentForm(),results:[]}).form.count', context), 4);
context.quantityResponse = { text: async () => JSON.stringify({data:Array.from({length:4}, (_, i) => ({url:`https://example.invalid/image-${i}.png`}))}) };
const parsedImages = await vm.runInContext('consumeImageGenerationJsonResponse(quantityResponse)', context);
assert.equal(parsedImages.length, 4);
assert.equal(new Set(parsedImages.map((image) => image.url)).size, 4);
// Keep the actual history/reset functions while skipping canvas and DOM rendering in this check.
vm.runInContext('resetMaskEditor = exitMaskEditorFullscreen = renderSourceImages = renderResults = renderHistory = () => {}; document.body.classList = {toggle() {}}', context);
vm.runInContext('restoreHistoryEntry({form:{...captureCurrentForm(), count:7}, results:[]})', context);
assert.equal(Number(quantity.value), 7);
assert.equal(submit.textContent, '开始生成（7 张）');
vm.runInContext('resetForm()', context);
assert.equal(Number(quantity.value), 1);
assert.equal(submit.textContent, '开始生成');
console.log('Generation count: controls, limits, all request modes, multi-image parsing and history/reset passed.');
