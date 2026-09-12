const CONFIG_CACHE_KEY = 'gpt-image-gen2:config';
const MODEL_LIST_CACHE_KEY = 'gpt-image-gen2:model-list-cache';
const RESPONSE_MODEL_SELECTION_CACHE_KEY = 'gpt-image-gen2:response-model-selection';
const APP_CONFIG_PATH = './app.config.json';
const FALLBACK_API_PATH_PREFIX = '/v1';
const HISTORY_DB_NAME = 'gpt-image-gen2-image-generation';
const HISTORY_DB_VERSION = 1;
const HISTORY_DB_STORE = 'history';
const HISTORY_LIMIT = 10;
const DEFAULT_API_MODE = 'images';
const DEFAULT_RESPONSE_MODEL = 'gpt-5.5';
const DEFAULT_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_SIZE = '1024x1024';
const DEFAULT_IMAGE_COUNT = 1;
const MAX_IMAGE_COUNT = 10;
const DEFAULT_CUSTOM_SIZE_WIDTH = '1024';
const DEFAULT_CUSTOM_SIZE_HEIGHT = '1024';
const CUSTOM_SIZE_VALUE = 'custom';
const CUSTOM_SIZE_MAX_EDGE = 3840;
const CUSTOM_SIZE_MULTIPLE = 16;
const CUSTOM_SIZE_MAX_RATIO = 3;
const CUSTOM_SIZE_MIN_PIXELS = 655360;
const CUSTOM_SIZE_MAX_PIXELS = 8294400;
const FIXED_RESPONSE_FORMAT = 'url';
const DEFAULT_INPUT_FIDELITY = 'low';
const DEFAULT_REASONING_EFFORT = 'xhigh';
const DEFAULT_IMAGE_STREAM_MODE = 'non_stream';
const DEFAULT_MASK_CANVAS_WIDTH = 1024;
const DEFAULT_MASK_CANVAS_HEIGHT = 1024;
const MAX_UNDO_STACK_SIZE = 20;
const MODEL_LIST_CACHE_TTL_MS = 60 * 60 * 1000;
const FIXED_PARTIAL_IMAGES = 0;
const PROMPT_POLISH_RESULT_COUNT = 3;
const PAGE_OPTIONS = {
  noConfiguredApiKey: readBooleanSearchParam('nokey'),
  noHeader: readBooleanSearchParam('noheader'),
  fixedApiUrl: readSearchParam('url'),
  apiMode: DEFAULT_API_MODE
};
const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const INPUT_FIDELITY_UNSUPPORTED_IMAGE_MODELS = new Set(['gpt-image-2', 'gpt-image-1-mini']);
const SIZE_PRESET_VALUES = new Set([
  '1024x1024', '2048x2048', '2016x1344', '1344x2016', '2048x1536',
  '1536x2048', '2048x1152', '1152x2048', '2880x2880', '3504x2336',
  '2336x3504', '3264x2448', '2448x3264', '3840x2160', '2160x3840'
]);
let runtimeConfig = createDefaultRuntimeConfig();
const el = {
  configDetails: document.getElementById('configDetails'),
  configSummary: document.getElementById('configSummary'),
  apiStatus: document.getElementById('apiStatus'),
  apiStatusText: document.getElementById('apiStatusText'),
  apiUrl: document.getElementById('apiUrl'),
  apiKey: document.getElementById('apiKey'),
  fillFreeKeyButton: document.getElementById('fillFreeKeyButton'),
  getKeyLink: document.getElementById('getKeyLink'),
  freeKeyNotice: document.getElementById('freeKeyNotice'),
  apiKeyBalanceNotice: document.getElementById('apiKeyBalanceNotice'),
  toggleKeyButton: document.getElementById('toggleKeyButton'),
  saveConfigButton: document.getElementById('saveConfigButton'),
  modeButtons: Array.from(document.querySelectorAll('[data-mode]')),
  apiModeHidden: Array.from(document.querySelectorAll('[data-api-mode-hidden]')),
  responseModel: document.getElementById('responseModel'),
  imageModel: document.getElementById('imageModel'),
  prompt: document.getElementById('prompt'),
  promptPolishButton: document.getElementById('promptPolishButton'),
  clearPromptButton: document.getElementById('clearPromptButton'),
  promptCount: document.getElementById('promptCount'),
  promptHint: document.getElementById('promptHint'),
  sourcePanel: document.getElementById('sourcePanel'),
  sourceTitle: document.getElementById('sourceTitle'),
  sourceHint: document.getElementById('sourceHint'),
  sourceFileInput: document.getElementById('sourceFileInput'),
  sourceGrid: document.getElementById('sourceGrid'),
  sourceEmpty: document.getElementById('sourceEmpty'),
  maskPanel: document.getElementById('maskPanel'),
  maskFullscreenButton: document.getElementById('maskFullscreenButton'),
  maskToolButtons: Array.from(document.querySelectorAll('[data-mask-tool]')),
  maskBrushSize: document.getElementById('maskBrushSize'),
  maskBrushValue: document.getElementById('maskBrushValue'),
  maskUndoButton: document.getElementById('maskUndoButton'),
  maskClearButton: document.getElementById('maskClearButton'),
  maskPreviewButton: document.getElementById('maskPreviewButton'),
  maskBaseCanvas: document.getElementById('maskBaseCanvas'),
  maskDrawingCanvas: document.getElementById('maskDrawingCanvas'),
  size: document.getElementById('size'),
  sizeSummary: document.getElementById('sizeSummary'),
  customSizeWidth: document.getElementById('customSizeWidth'),
  customSizeHeight: document.getElementById('customSizeHeight'),
  clearHistoryButton: document.getElementById('clearHistoryButton'),
  resetButton: document.getElementById('resetButton'),
  submitButton: document.getElementById('submitButton'),
  imageCount: document.getElementById('imageCount'),
  decreaseImageCountButton: document.getElementById('decreaseImageCountButton'),
  increaseImageCountButton: document.getElementById('increaseImageCountButton'),
  submitSummary: document.getElementById('submitSummary'),
  resultSummary: document.getElementById('resultSummary'),
  resultBulkActions: document.getElementById('resultBulkActions'),
  clearCanvasButton: document.getElementById('clearCanvasButton'),
  resultBody: document.getElementById('resultBody'),
  copyAllButton: document.getElementById('copyAllButton'),
  downloadAllButton: document.getElementById('downloadAllButton'),
  historySummary: document.getElementById('historySummary'),
  historyCount: document.getElementById('historyCount'),
  historyClearButton: document.getElementById('historyClearButton'),
  historyList: document.getElementById('historyList'),
  previewModal: document.getElementById('previewModal'),
  previewTitle: document.getElementById('previewTitle'),
  previewCloseButton: document.getElementById('previewCloseButton'),
  previewImage: document.getElementById('previewImage'),
  previewZoomOutButton: document.getElementById('previewZoomOutButton'),
  previewZoomResetButton: document.getElementById('previewZoomResetButton'),
  previewZoomInButton: document.getElementById('previewZoomInButton'),
  promptPolishModal: document.getElementById('promptPolishModal'),
  promptPolishStatus: document.getElementById('promptPolishStatus'),
  promptPolishOptions: document.getElementById('promptPolishOptions'),
  promptPolishRetryButton: document.getElementById('promptPolishRetryButton'),
  promptPolishCancelButton: document.getElementById('promptPolishCancelButton'),
  promptPolishCloseButton: document.getElementById('promptPolishCloseButton'),
  tooltipTriggers: Array.from(document.querySelectorAll('[data-tooltip]')),
  helpTooltip: document.getElementById('helpTooltip'),
  toastHost: document.getElementById('toastHost')
};

const state = {
  mode: 'generate',
  apiMode: PAGE_OPTIONS.apiMode,
  responseModelOptions: [],
  sourceImages: [],
  resultImages: [],
  history: [],
  activeHistoryId: '',
  restoredFromCache: false,
  lastSavedAt: '',
  lastDurationMs: null,
  submitError: '',
  submitting: false,
  loadingModels: false,
  configCheckStatus: 'unconfigured',
  configCheckError: '',
  modelOptionsConfigSignature: '',
  abortController: null,
  modelLoadRequestId: 0,
  maskTool: 'brush',
  maskSourceImageElement: null,
  maskPointerActive: false,
  maskPointerId: null,
  maskLastPoint: null,
  maskShapeStartPoint: null,
  maskShapeSnapshot: null,
  maskUndoStack: [],
  maskHasDrawing: false,
  maskEditorExpanded: false,
  previousBodyOverflow: '',
  maskPreviewObjectUrl: '',
  previewImageUrl: '',
  previewZoom: 1,
  previewTransformOrigin: '50% 50%',
  previewOffset: { x: 0, y: 0 },
  previewDrag: null,
  promptPolishing: false,
  promptPolishModalOpen: false,
  promptPolishOptions: [],
  promptPolishError: '',
  promptPolishAbortController: null,
  promptPolishRequestId: 0,
  activeTooltipTrigger: null
};

init();

async function init() {
  applyPageOptionsUI();
  runtimeConfig = await loadRuntimeConfig();
  applyRuntimeConfigUI();
  restoreConfig();
  updateApiModeUI();
  bindEvents();
  updateModeUI();
  updateSizeUI();
  updatePromptMeta();
  updatePromptPolishButton();
  updateRunSummary();
  renderSourceImages();
  renderResults();
  state.history = await loadImageHistory();
  if (state.history.length > 0) await persistImageHistory();
  renderHistory();
  if (hasCompleteConfigFields()) loadModels();
}

function applyPageOptionsUI() {
  document.body.classList.toggle('no-header', PAGE_OPTIONS.noHeader);
}

function bindEvents() {
  el.apiUrl.addEventListener('input', markConfigUnchecked);
  el.apiKey.addEventListener('input', () => {
    markConfigUnchecked();
    updateConfiguredKeyNotice();
  });
  el.fillFreeKeyButton.addEventListener('click', fillConfiguredApiKey);
  el.toggleKeyButton.addEventListener('click', toggleApiKeyVisibility);
  el.saveConfigButton.addEventListener('click', testConnection);

  el.modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });

  el.responseModel.addEventListener('change', () => {
    persistResponseModelSelection();
    updateRunSummary();
    markRestoredDirty();
  });
  el.imageModel.addEventListener('change', () => {
    updateRunSummary();
    markRestoredDirty();
  });
  el.prompt.addEventListener('input', () => {
    updatePromptMeta();
    markRestoredDirty();
  });
  el.promptPolishButton.addEventListener('click', startPromptPolish);
  el.clearPromptButton.addEventListener('click', clearPrompt);
  el.sourceFileInput.addEventListener('change', handleSourceImagesChange);
  el.sourcePanel.addEventListener('dragover', handleSourceDragOver);
  el.sourcePanel.addEventListener('dragleave', handleSourceDragLeave);
  el.sourcePanel.addEventListener('drop', handleSourceDrop);
  el.sourcePanel.addEventListener('paste', handleSourcePaste);
  el.sourceEmpty.addEventListener('click', openSourceFilePicker);
  el.sourceEmpty.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openSourceFilePicker();
    }
  });
  document.querySelectorAll('[data-size-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      el.size.value = button.dataset.sizePreset || DEFAULT_SIZE;
      updateSizeUI();
      markRestoredDirty();
    });
  });
  [el.customSizeWidth, el.customSizeHeight].forEach((input) => {
    input.addEventListener('input', () => {
      el.size.value = CUSTOM_SIZE_VALUE;
      updateSizeUI();
      markRestoredDirty();
    });
  });

  el.maskBrushSize.addEventListener('input', () => {
    el.maskBrushValue.textContent = el.maskBrushSize.value;
  });
  el.maskToolButtons.forEach((button) => {
    button.addEventListener('click', () => setMaskTool(button.dataset.maskTool));
  });
  el.maskUndoButton.addEventListener('click', undoMaskDrawing);
  el.maskClearButton.addEventListener('click', clearMaskDrawing);
  el.maskPreviewButton.addEventListener('click', previewMask);
  el.maskFullscreenButton.addEventListener('click', toggleMaskEditorFullscreen);
  el.maskDrawingCanvas.addEventListener('pointerdown', handleMaskPointerDown);
  el.maskDrawingCanvas.addEventListener('pointermove', handleMaskPointerMove);
  el.maskDrawingCanvas.addEventListener('pointerup', handleMaskPointerUp);
  el.maskDrawingCanvas.addEventListener('pointercancel', handleMaskPointerUp);
  el.maskDrawingCanvas.addEventListener('pointerleave', handleMaskPointerLeave);

  el.resetButton.addEventListener('click', resetForm);
  el.clearHistoryButton.addEventListener('click', confirmClearHistory);
  el.historyClearButton?.addEventListener('click', confirmClearHistory);
  el.clearCanvasButton?.addEventListener('click', clearCanvas);
  el.imageCount.addEventListener('input', () => {
    updateRunSummary();
    markRestoredDirty();
  });
  el.decreaseImageCountButton.addEventListener('click', () => changeImageCount(-1));
  el.increaseImageCountButton.addEventListener('click', () => changeImageCount(1));
  el.submitButton.addEventListener('click', () => {
    if (state.submitting) {
      cancelGeneration();
    } else {
      submitGeneration();
    }
  });

  el.copyAllButton.addEventListener('click', copyAllImageLinks);
  el.downloadAllButton.addEventListener('click', downloadAllImages);

  el.previewCloseButton.addEventListener('click', closePreview);
  el.previewModal.addEventListener('click', (event) => {
    if (event.target === el.previewModal) closePreview();
  });
  el.previewModal.addEventListener('wheel', handlePreviewWheel, { passive: false });
  el.previewImage.addEventListener('pointerdown', handlePreviewPointerDown);
  el.previewImage.addEventListener('pointermove', handlePreviewPointerMove);
  el.previewImage.addEventListener('pointerup', finishPreviewDrag);
  el.previewImage.addEventListener('pointercancel', finishPreviewDrag);
  el.previewImage.addEventListener('lostpointercapture', finishPreviewDrag);
  el.previewZoomOutButton.addEventListener('click', () => nudgePreviewZoom(1 / 1.25));
  el.previewZoomResetButton.addEventListener('click', resetPreviewZoom);
  el.previewZoomInButton.addEventListener('click', () => nudgePreviewZoom(1.25));
  el.promptPolishCloseButton.addEventListener('click', closePromptPolishModal);
  el.promptPolishCancelButton.addEventListener('click', closePromptPolishModal);
  el.promptPolishRetryButton.addEventListener('click', startPromptPolish);
  el.promptPolishModal.addEventListener('click', (event) => {
    if (event.target === el.promptPolishModal) closePromptPolishModal();
  });
  el.tooltipTriggers.forEach((trigger) => {
    trigger.addEventListener('pointerenter', () => showHelpTooltip(trigger));
    trigger.addEventListener('pointerleave', () => {
      if (document.activeElement !== trigger) hideHelpTooltip(trigger);
    });
    trigger.addEventListener('focus', () => showHelpTooltip(trigger));
    trigger.addEventListener('blur', () => hideHelpTooltip(trigger));
    trigger.addEventListener('click', () => showHelpTooltip(trigger));
  });
  document.addEventListener('keydown', handleGlobalKeydown);
  document.addEventListener('paste', handleGlobalPaste);
  window.addEventListener('scroll', updateActiveHelpTooltip, true);
  window.addEventListener('resize', updateActiveHelpTooltip);
  window.addEventListener('beforeunload', () => {
    cancelPromptPolishRequest();
    clearLocalPreviews(state.sourceImages);
    if (state.maskPreviewObjectUrl) URL.revokeObjectURL(state.maskPreviewObjectUrl);
  });
}

async function loadRuntimeConfig() {
  try {
    const response = await fetch(APP_CONFIG_PATH, { cache: 'no-store' });
    if (!response.ok) return createDefaultRuntimeConfig();
    return normalizeRuntimeConfig(await response.json());
  } catch (error) {
    console.warn('Failed to load runtime config', error);
    return createDefaultRuntimeConfig();
  }
}

function normalizeRuntimeConfig(value) {
  const defaults = createDefaultRuntimeConfig();
  if (!isRecord(value)) return defaults;

  const apiPathPrefix = Object.prototype.hasOwnProperty.call(value, 'apiPathPrefix')
    ? normalizeApiPathPrefix(value.apiPathPrefix)
    : defaults.apiPathPrefix;

  return {
    apiUrl: normalizeApiBaseUrl(firstConfigString(value.apiUrl, value.defaultApiUrl), apiPathPrefix),
    apiKey: firstConfigString(value.apiKey, value.defaultApiKey, value.freeApiKey),
    apiPathPrefix,
    keyUrl: normalizeExternalLink(firstConfigString(value.keyUrl, value.getKeyUrl)),
    apiKeyButtonText: firstConfigString(value.apiKeyButtonText, value.freeApiKeyButtonText) || defaults.apiKeyButtonText,
    apiKeyNotice: firstConfigString(value.apiKeyNotice, value.freeApiKeyNotice) || defaults.apiKeyNotice
  };
}

function createDefaultRuntimeConfig() {
  return {
    apiUrl: '',
    apiKey: '',
    apiPathPrefix: FALLBACK_API_PATH_PREFIX,
    keyUrl: '',
    apiKeyButtonText: '填充默认key',
    apiKeyNotice: '当前使用配置文件中的默认 API Key。'
  };
}

function applyRuntimeConfigUI() {
  const fixedApiUrl = getFixedApiBaseUrl();
  el.apiUrl.placeholder = fixedApiUrl || runtimeConfig.apiUrl || '请填写 API URL';
  el.apiUrl.readOnly = Boolean(fixedApiUrl);
  el.apiUrl.setAttribute('aria-readonly', fixedApiUrl ? 'true' : 'false');
  el.fillFreeKeyButton.textContent = runtimeConfig.apiKeyButtonText;
  el.fillFreeKeyButton.classList.toggle('hidden', !canUseConfiguredApiKey());
  el.freeKeyNotice.textContent = runtimeConfig.apiKeyNotice;

  if (!PAGE_OPTIONS.noConfiguredApiKey && runtimeConfig.keyUrl) {
    el.getKeyLink.href = runtimeConfig.keyUrl;
    el.getKeyLink.classList.remove('hidden');
  } else {
    el.getKeyLink.removeAttribute('href');
    el.getKeyLink.classList.add('hidden');
  }
}

function restoreConfig() {
  let config = null;
  try {
    config = JSON.parse(localStorage.getItem(CONFIG_CACHE_KEY) || 'null');
  } catch {
    localStorage.removeItem(CONFIG_CACHE_KEY);
  }
  const cachedApiUrl = normalizeApiBaseUrl(config?.apiUrl, runtimeConfig.apiPathPrefix);
  const cachedApiKey = firstConfigString(config?.apiKey);
  const configuredApiKey = canUseConfiguredApiKey() ? runtimeConfig.apiKey : '';
  el.apiUrl.value = getFixedApiBaseUrl() || cachedApiUrl || runtimeConfig.apiUrl;
  el.apiKey.value = cachedApiKey || configuredApiKey;
  state.configCheckStatus = 'unconfigured';
  el.configDetails.open = true;
  clearStaleModelCaches(hasCompleteConfigFields() ? getConfigSignature() : '');
  updateConfiguredKeyNotice();
  setApiKeyBalanceNotice(false);
  updateConfigSummary();
}

function getApiModeLabel() {
  return state.apiMode === 'images' ? 'Images API' : 'Responses API';
}

function saveConfig(options = {}) {
  const shouldLoadModels = options.loadModelsAfterSave !== false;
  const config = {
    apiUrl: getApiBaseUrl(),
    apiKey: getApiKey()
  };
  localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config));
  clearStaleModelCaches(hasCompleteConfigFields() ? getConfigSignature() : '');
  if (!options.silent) showToast('配置已保存', 'success');
  updateConfigSummary();
  if (hasCompleteConfigFields()) {
    if (shouldLoadModels) loadModels();
  }
}

async function testConnection() {
  if (state.loadingModels) return;
  if (hasCompleteConfigFields()) saveConfig({ loadModelsAfterSave: false, silent: true });
  await loadModels({ force: true });
}

function toggleApiKeyVisibility() {
  const shouldShow = el.apiKey.type === 'password';
  el.apiKey.type = shouldShow ? 'text' : 'password';
  el.toggleKeyButton.textContent = shouldShow ? '隐藏' : '显示';
}

function fillConfiguredApiKey() {
  if (!canUseConfiguredApiKey()) return;
  el.apiKey.value = runtimeConfig.apiKey;
  markConfigUnchecked();
  updateConfiguredKeyNotice();
  el.apiKey.focus();
}

function updateConfiguredKeyNotice() {
  el.freeKeyNotice.classList.toggle('hidden', !canUseConfiguredApiKey() || getApiKey() !== runtimeConfig.apiKey);
}

function canUseConfiguredApiKey() {
  return !PAGE_OPTIONS.noConfiguredApiKey && Boolean(runtimeConfig.apiKey);
}

function setApiKeyBalanceNotice(visible) {
  el.apiKeyBalanceNotice.classList.toggle('hidden', !visible);
}

function getApiKey() {
  return el.apiKey.value.trim();
}

function hasCompleteConfigFields() {
  return Boolean(getApiBaseUrl()) && Boolean(getApiKey());
}

function getConfigSignature() {
  return `${getApiBaseUrl()}::${getApiKey()}`;
}

function getApiBaseUrl() {
  return getFixedApiBaseUrl() || normalizeApiBaseUrl(el.apiUrl.value, runtimeConfig.apiPathPrefix);
}

function getFixedApiBaseUrl() {
  return normalizeApiBaseUrl(PAGE_OPTIONS.fixedApiUrl, runtimeConfig.apiPathPrefix);
}

function buildApiUrl(path) {
  const normalizedPath = String(path || '').startsWith('/') ? String(path || '') : `/${path || ''}`;
  const prefix = getApiPathPrefix();
  return `${getApiBaseUrl()}${prefix}${normalizedPath}`;
}

function getApiPathPrefix() {
  return normalizeApiPathPrefix(runtimeConfig.apiPathPrefix);
}

function updateConfigSummary() {
  el.saveConfigButton.disabled = state.loadingModels;
  el.saveConfigButton.textContent = state.loadingModels ? '连接测试中' : '测试连接';
  if (state.configCheckStatus === 'checking') {
    setConfigSummary('连接测试中', 'is-checking');
    return;
  }
  if (state.configCheckStatus === 'configured') {
    setConfigSummary('连接成功', 'is-configured');
    return;
  }
  if (state.configCheckStatus === 'error') {
    setConfigSummary(`连接失败：${state.configCheckError}`, 'is-error');
    return;
  }
  setConfigSummary(state.configCheckStatus === 'cached' ? '模型已缓存，待测试连接' : '待测试连接', 'is-unconfigured');
}

function setConfigSummary(text, statusClass) {
  el.configSummary.textContent = text;
  el.configSummary.classList.remove('is-unconfigured', 'is-configured', 'is-error', 'is-checking');
  el.configSummary.classList.add(statusClass);
  el.apiStatusText.textContent = text;
  el.apiStatus.title = text;
  el.apiStatus.dataset.state = statusClass;
}

function markConfigUnchecked() {
  state.modelLoadRequestId += 1;
  state.loadingModels = false;
  state.configCheckStatus = 'unconfigured';
  state.configCheckError = '';
  setApiKeyBalanceNotice(false);
  const currentSignature = hasCompleteConfigFields() ? getConfigSignature() : '';
  const removedCache = clearStaleModelCaches(currentSignature);
  if (removedCache || (state.modelOptionsConfigSignature && state.modelOptionsConfigSignature !== currentSignature)) {
    resetModelSelectsToDefaults();
  }
  updateConfigSummary();
}

function resetModelSelectsToDefaults() {
  state.responseModelOptions = [];
  state.modelOptionsConfigSignature = '';
  fillModelSelect(el.responseModel, [{ value: DEFAULT_RESPONSE_MODEL, label: DEFAULT_RESPONSE_MODEL }]);
  fillModelSelect(el.imageModel, [{ value: DEFAULT_IMAGE_MODEL, label: DEFAULT_IMAGE_MODEL }]);
  updateRunSummary();
}

function normalizeApiMode(value) {
  return DEFAULT_API_MODE;
}

function updateApiModeUI() {
  el.apiModeHidden.forEach((node) => {
    const hiddenModes = trimmedStringValue(node.dataset.apiModeHidden).split(/\s+/).filter(Boolean);
    node.classList.toggle('hidden', hiddenModes.includes(state.apiMode));
  });
  document.body.dataset.apiMode = state.apiMode;
  updateRunSummary();
}

function clearPrompt() {
  if (!el.prompt.value) return;
  el.prompt.value = '';
  updatePromptMeta();
  markRestoredDirty();
  el.prompt.focus();
}

async function startPromptPolish() {
  if (state.apiMode === 'images') return;
  if (state.promptPolishing) return;
  const validationError = validatePromptPolishForm();
  if (validationError) {
    showToast(validationError, 'warning', 6000);
    return;
  }

  const requestId = ++state.promptPolishRequestId;
  state.promptPolishing = true;
  state.promptPolishAbortController = new AbortController();
  state.promptPolishOptions = [];
  state.promptPolishError = '';
  openPromptPolishModal();
  updatePromptPolishButton();
  renderPromptPolishModal();

  try {
    const request = buildPromptPolishRequestInit();
    const response = await fetch(buildApiUrl('/responses'), {
      ...request,
      signal: state.promptPolishAbortController.signal
    });
    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(extractImagesErrorMessage(responseText, response.status));
    }

    const payload = parseJsonPayload(responseText, '润色请求失败：接口没有返回有效 JSON。');
    const options = extractPromptPolishOptions(payload);
    if (options.length < PROMPT_POLISH_RESULT_COUNT) {
      throw new Error('润色请求已返回，但没有拿到 3 份有效提示词。');
    }

    if (requestId !== state.promptPolishRequestId) return;
    state.promptPolishOptions = options;
    showToast('已生成 3 份润色结果', 'success');
  } catch (error) {
    if (requestId !== state.promptPolishRequestId) return;
    if (error instanceof DOMException && error.name === 'AbortError') return;
    const message = extractErrorMessage(error, '提示词润色失败');
    state.promptPolishError = message;
    showToast(message, 'error', 7000);
  } finally {
    if (requestId === state.promptPolishRequestId) {
      state.promptPolishing = false;
      state.promptPolishAbortController = null;
      updatePromptPolishButton();
      renderPromptPolishModal();
    }
  }
}

function validatePromptPolishForm() {
  if (state.apiMode === 'images') return 'Images API 模式不支持提示词润色。';
  if (state.submitting) return '图片生成请求进行中，请稍后再润色提示词。';
  if (!getApiBaseUrl()) return '请填写 API URL。';
  if (!getApiKey()) return '请填写 API Key。';
  if (state.loadingModels) return '正在加载模型，请稍后再试。';
  if (!trimmedStringValue(el.responseModel.value)) return '请选择或输入 Responses 模型。';
  if (!trimmedStringValue(el.prompt.value)) return '请输入提示词后再润色。';
  return '';
}

function buildPromptPolishRequestInit() {
  return {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(buildPromptPolishPayload())
  };
}

function buildPromptPolishPayload() {
  return {
    model: trimmedStringValue(el.responseModel.value) || DEFAULT_RESPONSE_MODEL,
    text: {
      format: {
        type: 'json_schema',
        name: 'prompt_polish_options',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            prompt1: { type: 'string' },
            prompt2: { type: 'string' },
            prompt3: { type: 'string' }
          },
          required: ['prompt1', 'prompt2', 'prompt3'],
          additionalProperties: false
        }
      }
    },
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: buildPromptPolishInstruction(trimmedStringValue(el.prompt.value))
          }
        ]
      }
    ],
    store: false,
    stream: false
  };
}

function buildPromptPolishInstruction(originalPrompt) {
  return [
    '你是专业的 AI 生图提示词编辑器。',
    '请在不改变用户原始主体、核心意图、画幅要求和显式限制的前提下，润色并扩展下面的提示词。',
    `输出 ${PROMPT_POLISH_RESULT_COUNT} 份互不相同、可直接用于生图的完整提示词。`,
    '语言必须保留原提示词的主要语言；如果原提示词主要是中文，全部用中文；如果主要是英文，全部用英文。',
    '三份结果分别偏向：1. 视觉细节与材质；2. 构图、镜头和光线；3. 风格、氛围和审美。',
    '不要解释，不要 Markdown，不要代码块。只返回符合 schema 的 JSON，字段必须是 prompt1、prompt2、prompt3。',
    '',
    `原提示词：${originalPrompt}`
  ].join('\n');
}

function extractPromptPolishOptions(payload) {
  const direct = normalizePromptPolishOptions(payload);
  if (direct.length >= PROMPT_POLISH_RESULT_COUNT) return direct;

  const responseText = extractResponsesText(payload);
  const parsed = parsePromptPolishJson(responseText);
  const parsedOptions = normalizePromptPolishOptions(parsed);
  if (parsedOptions.length >= PROMPT_POLISH_RESULT_COUNT) return parsedOptions;

  return normalizePromptPolishOptions(parsePromptPolishLines(responseText));
}

function normalizePromptPolishOptions(value) {
  let list = [];
  if (Array.isArray(value)) {
    list = value;
  } else if (isRecord(value)) {
    const fixedPrompts = [value.prompt1, value.prompt2, value.prompt3]
      .map((item) => stringValue(item))
      .filter((item) => trimmedStringValue(item));
    if (fixedPrompts.length > 0) list = fixedPrompts;
    else if (Array.isArray(value.prompts)) list = value.prompts;
    else if (Array.isArray(value.options)) list = value.options;
    else if (Array.isArray(value.results)) list = value.results;
  }

  const seen = new Set();
  const options = [];
  for (const item of list) {
    const text = normalizePromptPolishOptionText(item);
    if (!text) continue;
    const key = text.replace(/\s+/g, ' ').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(text);
    if (options.length >= PROMPT_POLISH_RESULT_COUNT) break;
  }
  return options;
}

function normalizePromptPolishOptionText(value) {
  const text = isRecord(value)
    ? stringValue(value.prompt) || stringValue(value.text) || stringValue(value.content)
    : stringValue(value);
  return trimmedStringValue(text)
    .replace(/^\s*(?:方案\s*)?\d+[.、:：]\s*/, '')
    .trim();
}

function extractResponsesText(payload) {
  const direct = trimmedStringValue(payload?.output_text);
  if (direct) return direct;

  const parts = [];
  const output = Array.isArray(payload?.output) ? payload.output : [];
  for (const item of output) {
    if (!isRecord(item)) continue;
    const itemText = trimmedStringValue(item.text);
    if (itemText) parts.push(itemText);
    const content = Array.isArray(item.content) ? item.content : [];
    for (const contentItem of content) {
      if (!isRecord(contentItem)) continue;
      const text = trimmedStringValue(contentItem.text) ||
        trimmedStringValue(contentItem.output_text) ||
        trimmedStringValue(contentItem.content);
      if (text) parts.push(text);
    }
  }

  const choices = Array.isArray(payload?.choices) ? payload.choices : [];
  for (const choice of choices) {
    if (!isRecord(choice)) continue;
    const text = trimmedStringValue(choice.text) || trimmedStringValue(choice.message?.content);
    if (text) parts.push(text);
  }
  return parts.join('\n').trim();
}

function parsePromptPolishJson(text) {
  const normalized = stripJsonCodeFence(text);
  if (!normalized) return null;
  const parsed = tryParseJson(normalized);
  if (parsed) return parsed;

  const objectStart = normalized.indexOf('{');
  const objectEnd = normalized.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    const objectParsed = tryParseJson(normalized.slice(objectStart, objectEnd + 1));
    if (objectParsed) return objectParsed;
  }

  const arrayStart = normalized.indexOf('[');
  const arrayEnd = normalized.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    const arrayParsed = tryParseJson(normalized.slice(arrayStart, arrayEnd + 1));
    if (arrayParsed) return arrayParsed;
  }
  return null;
}

function stripJsonCodeFence(text) {
  const normalized = trimmedStringValue(text);
  const match = normalized.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : normalized;
}

function parsePromptPolishLines(text) {
  return trimmedStringValue(text)
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.、:：])\s*/, '').trim())
    .filter(Boolean);
}

function parseJsonPayload(text, errorMessage) {
  try {
    return trimmedStringValue(text) ? JSON.parse(text) : {};
  } catch {
    throw new Error(errorMessage);
  }
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function openPromptPolishModal() {
  state.promptPolishModalOpen = true;
  el.promptPolishModal.classList.add('visible');
}

function closePromptPolishModal() {
  cancelPromptPolishRequest();
  state.promptPolishModalOpen = false;
  el.promptPolishModal.classList.remove('visible');
  el.promptPolishButton.focus();
}

function cancelPromptPolishRequest() {
  if (!state.promptPolishAbortController) return;
  state.promptPolishRequestId += 1;
  state.promptPolishAbortController.abort();
  state.promptPolishAbortController = null;
  state.promptPolishing = false;
  updatePromptPolishButton();
}

function applyPromptPolishOption(prompt) {
  const nextPrompt = trimmedStringValue(prompt);
  if (!nextPrompt) return;
  el.prompt.value = nextPrompt;
  updatePromptMeta();
  markRestoredDirty();
  closePromptPolishModal();
  el.prompt.focus();
}

async function copyPromptPolishOption(prompt) {
  const content = trimmedStringValue(prompt);
  if (!content) return;
  try {
    await writeClipboardText(content);
    showToast('已复制润色结果', 'success');
  } catch {
    showToast('复制失败，请手动复制内容', 'error');
  }
}

function renderPromptPolishModal() {
  el.promptPolishOptions.innerHTML = '';
  el.promptPolishRetryButton.disabled = state.promptPolishing;
  el.promptPolishRetryButton.textContent = state.promptPolishing ? '生成中...' : '重新生成';
  el.promptPolishCancelButton.textContent = state.promptPolishing ? '取消请求' : '取消';

  if (state.promptPolishing) {
    el.promptPolishStatus.textContent = 'AI 正在生成 3 份不同方向的润色结果。';
    const loading = document.createElement('div');
    loading.className = 'prompt-polish-state';
    loading.textContent = '润色中，请稍候...';
    el.promptPolishOptions.appendChild(loading);
    return;
  }

  if (state.promptPolishError) {
    el.promptPolishStatus.textContent = '润色失败，可以重新生成。';
    const error = document.createElement('div');
    error.className = 'prompt-polish-state prompt-polish-error';
    error.textContent = state.promptPolishError;
    el.promptPolishOptions.appendChild(error);
    return;
  }

  el.promptPolishStatus.textContent = '选择一个结果后会填充到提示词输入框。';
  if (state.promptPolishOptions.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'prompt-polish-state';
    empty.textContent = '暂无润色结果';
    el.promptPolishOptions.appendChild(empty);
    return;
  }

  state.promptPolishOptions.forEach((prompt, index) => {
    const card = document.createElement('div');
    card.className = 'prompt-polish-option';

    const title = document.createElement('span');
    title.className = 'prompt-polish-option-title';
    title.textContent = `方案 ${index + 1}`;
    const body = document.createElement('span');
    body.className = 'prompt-polish-option-body';
    body.textContent = prompt;
    const actions = document.createElement('div');
    actions.className = 'prompt-polish-option-actions';
    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'btn btn-sm';
    copyButton.textContent = '复制';
    copyButton.addEventListener('click', () => copyPromptPolishOption(prompt));
    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    selectButton.className = 'btn btn-sm btn-primary';
    selectButton.textContent = '选这个';
    selectButton.addEventListener('click', () => applyPromptPolishOption(prompt));
    actions.append(copyButton, selectButton);
    card.append(title, body, actions);
    el.promptPolishOptions.appendChild(card);
  });
}

function updatePromptPolishButton() {
  el.promptPolishButton.disabled = state.promptPolishing;
  el.promptPolishButton.textContent = state.promptPolishing ? '润色中...' : '一键润色';
}

function updatePromptMeta() {
  const length = Array.from(trimmedStringValue(el.prompt.value)).length;
  el.promptCount.textContent = `${length.toLocaleString('zh-CN')} 字`;
  el.clearPromptButton.disabled = length === 0;
  document.body.classList.toggle('has-prompt', length > 0);
  updateRunSummary();
}

function updateRunSummary() {
  const modeLabel = state.mode === 'generate' ? '文生图' : state.mode === 'mask' ? '局部重绘' : '图生图';
  const apiModeLabel = getApiModeLabel();
  const size = getCurrentSizeDisplay();
  const streamPart = state.apiMode === 'images' ? ` · ${getImageStreamModeLabel()}` : '';
  const sourcePart = state.mode === 'generate' ? '' : ` · ${state.sourceImages.length} 张源图`;
  const summary = `${apiModeLabel} · ${modeLabel} · ${size} · PNG · 默认质量${streamPart}${sourcePart}`;
  el.submitSummary.textContent = state.submitting ? `正在生成：${summary}` : `准备生成：${summary}`;
  updateSubmitButton();
}

function getCurrentSizeDisplay() {
  if (el.size.value !== CUSTOM_SIZE_VALUE) return trimmedStringValue(el.size.value) || DEFAULT_SIZE;
  if (validateCustomSize()) return '尺寸待修正';
  const dimensions = readCustomSizeDimensions();
  return dimensions ? `${dimensions.width}x${dimensions.height}` : '尺寸待修正';
}

function updateSizeSummary() {
  const customSizeError = validateCustomSize();
  el.sizeSummary.classList.toggle('warning', Boolean(customSizeError));
  if (customSizeError) {
    el.sizeSummary.textContent = customSizeError;
    return;
  }
  const dimensions = el.size.value === CUSTOM_SIZE_VALUE
    ? readCustomSizeDimensions()
    : parseSizeValue(resolveSizeValue());
  if (!dimensions) {
    el.sizeSummary.textContent = '当前尺寸无效，请检查宽高。';
    return;
  }
  const width = Number(dimensions.width);
  const height = Number(dimensions.height);
  const gcd = greatestCommonDivisor(width, height);
  const ratio = `${width / gcd}:${height / gcd}`;
  const orientation = width === height ? '正方形' : width > height ? '横屏' : '竖屏';
  const megapixels = ((width * height) / 1000000).toFixed(2);
  el.sizeSummary.textContent = `当前输出：${width}x${height}，${ratio} ${orientation}，约 ${megapixels} 百万像素。`;
}

async function loadModels({ force = false } = {}) {
  if (state.loadingModels) return;
  const apiKey = getApiKey();
  if (!hasCompleteConfigFields()) {
    state.configCheckStatus = 'error';
    state.configCheckError = !getApiBaseUrl() ? '请填写 API URL。' : '请填写 API Key。';
    updateConfigSummary();
    showToast(state.configCheckError, 'warning', 6000);
    return;
  }
  setApiKeyBalanceNotice(false);

  const requestId = ++state.modelLoadRequestId;
  const requestConfigSignature = getConfigSignature();
  clearStaleModelCaches(requestConfigSignature);
  if (force) localStorage.removeItem(MODEL_LIST_CACHE_KEY);
  const cachedModels = force ? null : readCachedModelList(requestConfigSignature);
  if (cachedModels) {
    applyLoadedModelOptions(cachedModels, requestConfigSignature, true);
    return;
  }

  state.loadingModels = true;
  state.configCheckStatus = 'checking';
  state.configCheckError = '';
  updateConfigSummary();

  try {
    const response = await fetch(buildApiUrl('/models'), {
      cache: force ? 'no-store' : 'default',
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    const responseText = await response.text();
    if (requestId !== state.modelLoadRequestId || requestConfigSignature !== getConfigSignature()) return;
    if (extractImagesErrorCode(responseText) === 'INSUFFICIENT_BALANCE') {
      setApiKeyBalanceNotice(true);
      throw new Error('该API Key所剩余额不足');
    }
    if (!response.ok) {
      throw new Error(extractImagesErrorMessage(responseText, response.status));
    }

    let payload = {};
    try {
      payload = responseText.trim() ? JSON.parse(responseText) : {};
    } catch {
      throw new Error('加载模型失败：接口没有返回有效 JSON。');
    }
    if (extractImagesErrorCodeFromPayload(payload) === 'INSUFFICIENT_BALANCE') {
      setApiKeyBalanceNotice(true);
      throw new Error('该API Key所剩余额不足');
    }

    if (!Array.isArray(payload) && !Array.isArray(payload?.data)) {
      throw new Error('接口未返回有效的模型列表。');
    }
    const allModels = normalizeOpenAIModelOptions(payload);
    writeModelListCache(requestConfigSignature, allModels);
    applyLoadedModelOptions(allModels, requestConfigSignature, false);
    showToast('连接成功，模型列表已更新', 'success');
  } catch (error) {
    if (requestId !== state.modelLoadRequestId) return;
    if (requestConfigSignature !== getConfigSignature()) return;
    state.configCheckStatus = 'error';
    state.configCheckError = extractErrorMessage(error, '连接失败');
    updateConfigSummary();
    showToast(state.configCheckError, 'error', 6000);
  } finally {
    if (requestId === state.modelLoadRequestId) {
      state.loadingModels = false;
      updateConfigSummary();
    }
  }
}

function fillModelSelect(select, options) {
  select.innerHTML = '';
  for (const option of options) {
    const node = document.createElement('option');
    node.value = option.value;
    node.textContent = option.label;
    select.appendChild(node);
  }
}

function applyLoadedModelOptions(allModels, configSignature, fromCache) {
  const selectedImageModel = resolveImageModelValue();
  const responseModels = allModels.filter((option) => !isImageGenerationModelId(option.value));
  const imageModels = allModels.filter((option) => option.value.toLowerCase().startsWith('gpt-image'));
  state.responseModelOptions = responseModels.length > 0
    ? responseModels
    : [{ value: DEFAULT_RESPONSE_MODEL, label: DEFAULT_RESPONSE_MODEL }];
  state.modelOptionsConfigSignature = configSignature;
  fillModelSelect(el.responseModel, state.responseModelOptions);
  fillModelSelect(el.imageModel, imageModels.length > 0
    ? imageModels
    : [{ value: DEFAULT_IMAGE_MODEL, label: DEFAULT_IMAGE_MODEL }]);
  setModelControlValue('image', selectedImageModel);
  setModelControlValue('response', resolvePreferredResponseModelValue(state.responseModelOptions, configSignature));
  updateRunSummary();

  state.configCheckStatus = fromCache ? 'cached' : 'configured';
  updateConfigSummary();
}

function setModelControlValue(kind, value) {
  const select = kind === 'response' ? el.responseModel : el.imageModel;
  const fallback = kind === 'response' ? DEFAULT_RESPONSE_MODEL : DEFAULT_IMAGE_MODEL;
  const normalizedValue = trimmedStringValue(value) || fallback;
  const hasOption = Array.from(select.options).some((option) => option.value === normalizedValue);
  const fallbackOption = Array.from(select.options).find((option) => option.value === fallback);
  select.value = hasOption ? normalizedValue : (fallbackOption?.value || select.options[0]?.value || fallback);
}

function resolvePreferredResponseModelValue(options, configSignature) {
  const values = new Set(options.map((option) => option.value));
  const cachedValue = readCachedResponseModelSelection(configSignature);
  if (cachedValue && values.has(cachedValue)) return cachedValue;
  if (values.has(DEFAULT_RESPONSE_MODEL)) return DEFAULT_RESPONSE_MODEL;
  return options[0]?.value || DEFAULT_RESPONSE_MODEL;
}

function readCachedModelList(configSignature) {
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem(MODEL_LIST_CACHE_KEY) || 'null');
  } catch {
    localStorage.removeItem(MODEL_LIST_CACHE_KEY);
    return null;
  }
  if (!isRecord(parsed) || parsed.version !== 1 || parsed.configSignature !== configSignature) {
    if (parsed) localStorage.removeItem(MODEL_LIST_CACHE_KEY);
    return null;
  }
  const savedAt = typeof parsed.savedAt === 'number' ? parsed.savedAt : 0;
  if (!savedAt || Date.now() - savedAt > MODEL_LIST_CACHE_TTL_MS) {
    localStorage.removeItem(MODEL_LIST_CACHE_KEY);
    return null;
  }
  const models = normalizeCachedModelOptions(parsed.models);
  if (models.length === 0) {
    localStorage.removeItem(MODEL_LIST_CACHE_KEY);
    return null;
  }
  return models;
}

function writeModelListCache(configSignature, models) {
  try {
    localStorage.setItem(MODEL_LIST_CACHE_KEY, JSON.stringify({
      version: 1,
      configSignature,
      savedAt: Date.now(),
      models: normalizeCachedModelOptions(models)
    }));
  } catch (error) {
    console.warn('Failed to cache model list', error);
  }
}

function normalizeCachedModelOptions(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const options = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const modelValue = trimmedStringValue(item.value);
    if (!modelValue || seen.has(modelValue)) continue;
    seen.add(modelValue);
    options.push({
      value: modelValue,
      label: trimmedStringValue(item.label) || modelValue
    });
  }
  return options;
}

function persistResponseModelSelection() {
  if (!hasCompleteConfigFields() || !trimmedStringValue(el.responseModel.value)) return;
  try {
    localStorage.setItem(RESPONSE_MODEL_SELECTION_CACHE_KEY, JSON.stringify({
      version: 1,
      configSignature: getConfigSignature(),
      value: trimmedStringValue(el.responseModel.value)
    }));
  } catch (error) {
    console.warn('Failed to cache selected Responses model', error);
  }
}

function readCachedResponseModelSelection(configSignature) {
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem(RESPONSE_MODEL_SELECTION_CACHE_KEY) || 'null');
  } catch {
    localStorage.removeItem(RESPONSE_MODEL_SELECTION_CACHE_KEY);
    return '';
  }
  if (!isRecord(parsed) || parsed.version !== 1 || parsed.configSignature !== configSignature) {
    if (parsed) localStorage.removeItem(RESPONSE_MODEL_SELECTION_CACHE_KEY);
    return '';
  }
  return trimmedStringValue(parsed.value);
}

function clearStaleModelCaches(configSignature) {
  const removedModelCache = clearStorageItemForDifferentConfig(MODEL_LIST_CACHE_KEY, configSignature);
  const removedSelectionCache = clearStorageItemForDifferentConfig(RESPONSE_MODEL_SELECTION_CACHE_KEY, configSignature);
  return removedModelCache || removedSelectionCache;
}

function clearStorageItemForDifferentConfig(storageKey, configSignature) {
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem(storageKey) || 'null');
  } catch {
    localStorage.removeItem(storageKey);
    return true;
  }
  if (!parsed) return false;
  if (!configSignature || !isRecord(parsed) || parsed.configSignature !== configSignature) {
    localStorage.removeItem(storageKey);
    return true;
  }
  return false;
}

function normalizeOpenAIModelOptions(payload) {
  let data = [];
  if (isRecord(payload) && Array.isArray(payload.data)) {
    data = payload.data;
  } else if (Array.isArray(payload)) {
    data = payload;
  }
  const seen = new Set();
  const options = [];
  for (const item of data) {
    const model = normalizeOpenAIModelItem(item);
    if (!model || seen.has(model.id)) continue;
    seen.add(model.id);
    options.push({
      value: model.id,
      label: model.displayName && model.displayName !== model.id
        ? `${model.displayName} (${model.id})`
        : model.id
    });
  }
  return options;
}

function normalizeOpenAIModelItem(value) {
  if (typeof value === 'string') {
    const id = value.trim();
    return id ? { id, displayName: id } : null;
  }
  if (!isRecord(value)) return null;
  const id = trimmedStringValue(value.id);
  if (!id) return null;
  return {
    id,
    displayName: trimmedStringValue(value.display_name) || trimmedStringValue(value.displayName) || id
  };
}

function isImageGenerationModelId(value) {
  const modelId = value.trim().toLowerCase();
  return modelId.startsWith('gpt-image-') ||
    modelId.startsWith('chatgpt-image') ||
    modelId.includes('-image');
}

function setMode(mode) {
  if (!['generate', 'edit', 'mask'].includes(mode)) return;
  state.mode = mode;
  state.submitError = '';
  if (mode === 'generate') {
    clearLocalPreviews(state.sourceImages);
    state.sourceImages = [];
    resetMaskEditor();
    exitMaskEditorFullscreen();
  } else if (mode === 'edit') {
    resetMaskEditor();
    exitMaskEditorFullscreen();
  } else if (mode === 'mask') {
    if (state.sourceImages.length > 1) {
      keepFirstSourceImageOnly();
      showToast('遮罩编辑只支持一张原始图片，已保留第一张。', 'info');
    }
    if (state.sourceImages[0]) loadMaskSourceImage(state.sourceImages[0]);
  }
  updateModeUI();
  renderSourceImages();
  markRestoredDirty();
}

function updateModeUI() {
  el.modeButtons.forEach((button) => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  const isGenerate = state.mode === 'generate';
  document.body.dataset.mode = state.mode;
  el.sourcePanel.classList.add('visible');
  el.sourcePanel.classList.remove('drag-over');
  el.sourcePanel.setAttribute('aria-disabled', 'false');
  el.maskPanel.classList.toggle('visible', state.mode === 'mask' && state.sourceImages.length > 0);
  el.sourceFileInput.multiple = state.mode === 'edit';

  if (state.mode === 'generate') {
    el.prompt.placeholder = '请输入你想生成的图像描述，\n例如：一只可爱的猫咪在阳光下的窗台上，\n风格：清新、真实、摄影风格';
    el.promptHint.textContent = '建议描述主体、风格、镜头和背景，效果会更稳定。';
    el.sourceTitle.textContent = '参考图（可选）';
    el.sourceHint.textContent = '上传图片作为生成参考，可选。';
    setSourceEmptyCopy('拖拽图片到此处，或点击上传', '支持 JPG、PNG、WEBP，最大 10MB');
  } else if (state.mode === 'mask') {
    el.prompt.placeholder = '例如：把遮罩区域改成蓝色针织毛衣。';
    el.promptHint.textContent = '红色绘制区域会作为透明遮罩提交，表示希望模型修改的区域。';
    el.sourceTitle.textContent = '源图（仅一张）';
    el.sourceHint.textContent = '遮罩模式只使用一张源图，遮罩在页面内绘制生成。';
    setSourceEmptyCopy('拖拽或粘贴一张原图', '上传后即可在页面内绘制需要修改的遮罩区域。');
  } else {
    el.prompt.placeholder = '例如：保留构图，把背景改成极简摄影棚。';
    el.promptHint.textContent = '改图时建议明确“保留什么、修改什么”。';
    el.sourceTitle.textContent = '源图';
    el.sourceHint.textContent = '图生图会将一张或多张源图作为参考图提交。';
    setSourceEmptyCopy('拖拽或粘贴源图', '支持 PNG、JPEG、WebP，也可以点击这里选择文件。');
  }

  if (state.mode !== 'mask') {
    el.maskPanel.classList.remove('visible');
  }
  updatePromptMeta();
  updateRunSummary();
}

function setSourceEmptyCopy(title, description) {
  const [titleNode, descriptionNode] = Array.from(el.sourceEmpty.children);
  if (titleNode) titleNode.textContent = title;
  if (descriptionNode) descriptionNode.textContent = description;
}

function updateSizeUI() {
  const dimensions = parseSizeValue(el.size.value);
  if (dimensions) {
    el.customSizeWidth.value = dimensions.width;
    el.customSizeHeight.value = dimensions.height;
  }
  document.querySelectorAll('[data-size-preset]').forEach((button) => {
    button.classList.toggle('active', button.dataset.sizePreset === el.size.value);
  });
  updateSizeSummary();
  updateRunSummary();
}

function handleSourceImagesChange(event) {
  const input = event.target;
  addSourceFiles(Array.from(input.files || []));
  input.value = '';
}

function openSourceFilePicker() {
  el.sourceFileInput.click();
}

function clearCanvas() {
  if (state.resultImages.length === 0) return;
  state.resultImages = [];
  state.restoredFromCache = false;
  state.activeHistoryId = '';
  state.lastSavedAt = '';
  state.lastDurationMs = null;
  renderResults();
  renderHistory();
}

function handleSourceDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  el.sourcePanel.classList.add('drag-over');
}

function handleSourceDragLeave(event) {
  if (!el.sourcePanel.contains(event.relatedTarget)) {
    el.sourcePanel.classList.remove('drag-over');
  }
}

function handleSourceDrop(event) {
  event.preventDefault();
  el.sourcePanel.classList.remove('drag-over');
  addSourceFiles(Array.from(event.dataTransfer?.files || []));
}

function handleSourcePaste(event) {
  const files = Array.from(event.clipboardData?.files || []);
  if (files.length === 0) return;
  event.preventDefault();
  addSourceFiles(files);
}

function handleGlobalPaste(event) {
  if (event.defaultPrevented) return;
  const files = Array.from(event.clipboardData?.files || []);
  if (files.length === 0) return;
  event.preventDefault();
  addSourceFiles(files);
}

function showHelpTooltip(trigger) {
  const text = trimmedStringValue(trigger?.dataset?.tooltip);
  if (!text || !el.helpTooltip) return;
  state.activeTooltipTrigger = trigger;
  trigger.setAttribute('aria-describedby', 'helpTooltip');
  el.helpTooltip.textContent = text;
  el.helpTooltip.classList.remove('hidden');
  updateActiveHelpTooltip();
}

function hideHelpTooltip(trigger = state.activeTooltipTrigger) {
  if (trigger && state.activeTooltipTrigger && trigger !== state.activeTooltipTrigger) return;
  state.activeTooltipTrigger?.removeAttribute('aria-describedby');
  state.activeTooltipTrigger = null;
  if (!el.helpTooltip) return;
  el.helpTooltip.classList.add('hidden');
  el.helpTooltip.textContent = '';
  el.helpTooltip.style.left = '';
  el.helpTooltip.style.top = '';
}

function updateActiveHelpTooltip() {
  const trigger = state.activeTooltipTrigger;
  if (!trigger || !el.helpTooltip || el.helpTooltip.classList.contains('hidden')) return;
  if (!document.documentElement.contains(trigger)) {
    hideHelpTooltip(trigger);
    return;
  }

  const rect = trigger.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  if (rect.bottom < 0 || rect.top > viewportHeight || rect.right < 0 || rect.left > viewportWidth) {
    hideHelpTooltip(trigger);
    return;
  }

  const margin = 12;
  const gap = 8;
  const tooltipWidth = el.helpTooltip.offsetWidth;
  const tooltipHeight = el.helpTooltip.offsetHeight;
  const maxLeft = Math.max(margin, viewportWidth - tooltipWidth - margin);
  let left = rect.left + rect.width / 2 - tooltipWidth / 2;
  left = Math.min(Math.max(margin, left), maxLeft);

  let top = rect.top - tooltipHeight - gap;
  if (top < margin) top = rect.bottom + gap;
  if (top + tooltipHeight > viewportHeight - margin) {
    top = Math.max(margin, viewportHeight - tooltipHeight - margin);
  }

  el.helpTooltip.style.left = `${Math.round(left)}px`;
  el.helpTooltip.style.top = `${Math.round(top)}px`;
}

function addSourceFiles(selectedFiles) {
  const files = selectedFiles.filter(isSupportedImageFile);
  if (selectedFiles.length !== files.length) {
    showToast('仅支持 PNG、JPEG、WebP 图片。', 'warning');
  }
  if (files.length === 0) {
    return;
  }

  const items = files.map(createLocalImagePreview);
  if (state.mode === 'mask') {
    clearLocalPreviews(state.sourceImages);
    state.sourceImages = items.slice(0, 1);
    clearLocalPreviews(items.slice(1));
    resetMaskEditor();
    if (state.sourceImages[0]) loadMaskSourceImage(state.sourceImages[0]);
    if (files.length > 1) showToast('遮罩编辑只支持一张原始图片，已保留第一张。', 'info');
  } else {
    state.sourceImages = [...state.sourceImages, ...items];
  }
  renderSourceImages();
  updateRunSummary();
  markRestoredDirty();
}

function createLocalImagePreview(file) {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    url: URL.createObjectURL(file)
  };
}

function removeSourceImage(id) {
  const target = state.sourceImages.find((item) => item.id === id);
  if (!target) return;
  URL.revokeObjectURL(target.url);
  state.sourceImages = state.sourceImages.filter((item) => item.id !== id);
  if (state.mode === 'mask') resetMaskEditor();
  if (state.mode === 'mask' && state.sourceImages[0]) loadMaskSourceImage(state.sourceImages[0]);
  renderSourceImages();
  markRestoredDirty();
}

function clearLocalPreviews(previews) {
  for (const preview of previews) {
    URL.revokeObjectURL(preview.url);
  }
}

function keepFirstSourceImageOnly() {
  const first = state.sourceImages[0];
  if (!first) return;
  clearLocalPreviews(state.sourceImages.slice(1));
  state.sourceImages = [first];
}

function renderSourceImages() {
  el.sourceGrid.innerHTML = '';
  el.sourceEmpty.classList.toggle('hidden', state.sourceImages.length > 0);
  for (const item of state.sourceImages) {
    const card = document.createElement('div');
    card.className = 'source-item';

    const image = document.createElement('img');
    image.className = 'source-thumb';
    image.src = item.url;
    image.alt = item.file.name;
    image.loading = 'lazy';
    image.addEventListener('click', () => openPreview(item.url, item.file.name));
    card.appendChild(image);

    const meta = document.createElement('div');
    meta.className = 'source-meta';
    const name = document.createElement('span');
    name.className = 'truncate';
    name.textContent = item.file.name;
    const remove = document.createElement('button');
    remove.className = 'btn btn-sm btn-text-danger';
    remove.type = 'button';
    remove.textContent = '移除';
    remove.addEventListener('click', () => removeSourceImage(item.id));
    meta.append(name, remove);
    card.appendChild(meta);
    el.sourceGrid.appendChild(card);
  }
  updateModeUI();
  updateRunSummary();
}

function resetForm() {
  state.mode = 'generate';
  state.apiMode = PAGE_OPTIONS.apiMode;
  el.prompt.value = '';
  el.imageCount.value = DEFAULT_IMAGE_COUNT;
  setModelControlValue('response', DEFAULT_RESPONSE_MODEL);
  setModelControlValue('image', DEFAULT_IMAGE_MODEL);
  el.size.value = DEFAULT_SIZE;
  el.customSizeWidth.value = DEFAULT_CUSTOM_SIZE_WIDTH;
  el.customSizeHeight.value = DEFAULT_CUSTOM_SIZE_HEIGHT;
  state.submitError = '';
  state.resultImages = [];
  state.restoredFromCache = false;
  state.activeHistoryId = '';
  state.lastSavedAt = '';
  state.lastDurationMs = null;
  clearLocalPreviews(state.sourceImages);
  state.sourceImages = [];
  resetMaskEditor();
  exitMaskEditorFullscreen();
  updateApiModeUI();
  updateModeUI();
  updateSizeUI();
  updatePromptMeta();
  renderSourceImages();
  renderResults();
  renderHistory();
}

async function submitGeneration() {
  if (state.submitting) return;
  const validationError = validateGenerationForm();
  if (validationError) {
    showToast(validationError, 'warning', 6000);
    return;
  }

  const startedAt = performance.now();
  const requestedCount = readImageCount();
  saveConfig({ loadModelsAfterSave: false });
  state.submitError = '';
  state.resultImages = [];
  state.restoredFromCache = false;
  state.activeHistoryId = '';
  state.lastSavedAt = '';
  state.lastDurationMs = null;
  state.submitting = true;
  state.abortController = new AbortController();
  updateRunSummary();
  renderResults();
  updateSubmitButton();

  try {
    const request = await buildGenerationRequest();
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      signal: state.abortController.signal
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(extractImagesErrorMessage(responseText, response.status));
    }

    const images = isEventStreamResponse(response)
      ? await consumeImageGenerationStream(response)
      : await consumeImageGenerationJsonResponse(response);
    if (images.length === 0) {
      throw new Error('接口已返回成功，但没有拿到可展示的图片数据。');
    }

    state.resultImages = images;
    state.restoredFromCache = false;
    state.lastSavedAt = new Date().toISOString();
    state.lastDurationMs = Math.max(0, Math.round(performance.now() - startedAt));
    state.activeHistoryId = '';
    const saved = await persistCachedResult();
    renderResults();
    renderHistory();
    showToast(`已生成 ${images.length} 张图片，耗时 ${formatDuration(state.lastDurationMs)}`, 'success');
    if (images.length !== requestedCount) {
      showToast(`请求 ${requestedCount} 张，接口实际返回 ${images.length} 张。`, 'warning', 8000);
    }
    showToast(
      saved
        ? '请尽快下载图片或复制链接保存，浏览器历史只会临时保留最近 10 次。'
        : '图片已生成，但浏览器本地存储空间不足，本次结果未保存到历史记录。',
      'warning',
      8000
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      state.resultImages = [];
      state.restoredFromCache = false;
      state.activeHistoryId = '';
      state.lastSavedAt = '';
      state.lastDurationMs = null;
      showToast('已取消本次请求', 'info');
      return;
    }
    const message = extractErrorMessage(error, '生图请求失败');
    state.submitError = message;
    showToast(message, 'error', 8000);
  } finally {
    state.submitting = false;
    state.abortController = null;
    updateRunSummary();
    renderResults();
    updateSubmitButton();
  }
}

function readImageCount(value = el.imageCount.value) {
  const count = parseIntegerString(value);
  return count !== null && count >= 1 && count <= MAX_IMAGE_COUNT ? count : null;
}

function changeImageCount(delta) {
  if (state.submitting) return;
  el.imageCount.value = clampNumber((readImageCount() ?? DEFAULT_IMAGE_COUNT) + delta, 1, MAX_IMAGE_COUNT);
  updateRunSummary();
  markRestoredDirty();
}

function updateSubmitButton() {
  const count = readImageCount();
  const label = count > 1 ? `开始生成（${count} 张）` : '开始生成';
  el.submitButton.textContent = state.submitting ? '取消请求' : label;
  el.submitButton.classList.toggle('btn-primary', !state.submitting);
  el.submitButton.classList.toggle('btn-danger', state.submitting);
  el.imageCount.disabled = state.submitting;
  el.decreaseImageCountButton.disabled = state.submitting || count === 1;
  el.increaseImageCountButton.disabled = state.submitting || count === MAX_IMAGE_COUNT;
}

function cancelGeneration() {
  if (state.abortController) {
    state.abortController.abort();
    state.abortController = null;
  }
  state.submitting = false;
  updateRunSummary();
  updateSubmitButton();
  renderResults();
}

function validateGenerationForm() {
  if (readImageCount() === null) return '生成数量必须为 1–10 的整数。';
  if (!getApiBaseUrl()) return '请填写 API URL。';
  if (!getApiKey()) return '请填写 API Key。';
  if (state.loadingModels) return '正在加载模型，请稍后再试。';
  if (state.apiMode === 'responses' && !trimmedStringValue(el.responseModel.value)) return '请选择或输入 Responses 模型。';
  if (!trimmedStringValue(el.prompt.value)) return '请输入提示词。';
  if (state.mode !== 'generate' && state.sourceImages.length === 0) {
    return state.mode === 'mask' ? '局部重绘模式需要上传一张原始图片。' : '图生图模式至少需要上传一张源图。';
  }
  if (state.mode === 'mask' && !state.maskHasDrawing) return '请先在原始图片上绘制需要修改的遮罩区域。';
  if (state.sourceImages.some((preview) => !isSupportedImageFile(preview.file))) return '仅支持 PNG、JPEG、WebP 图片。';
  const sizeError = validateCustomSize();
  if (sizeError) return sizeError;
  return '';
}

async function buildGenerationRequest() {
  if (readImageCount() === null) throw new Error('生成数量必须为 1–10 的整数。');
  if (state.apiMode === 'images') return buildImagesApiRequest();
  return buildResponsesApiRequest();
}

function validateCustomSize() {
  if (el.size.value !== CUSTOM_SIZE_VALUE) return '';
  const dimensions = readCustomSizeDimensions();
  if (!dimensions) return '请输入有效的自定义宽高。';
  const { width, height } = dimensions;
  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);
  const pixels = width * height;
  if (longEdge > CUSTOM_SIZE_MAX_EDGE) return `自定义尺寸最大边长不能超过 ${CUSTOM_SIZE_MAX_EDGE}px。`;
  if (width % CUSTOM_SIZE_MULTIPLE !== 0 || height % CUSTOM_SIZE_MULTIPLE !== 0) return `自定义尺寸的宽高都必须是 ${CUSTOM_SIZE_MULTIPLE}px 的倍数。`;
  if (longEdge / shortEdge > CUSTOM_SIZE_MAX_RATIO) return `自定义尺寸的长边与短边比例不能超过 ${CUSTOM_SIZE_MAX_RATIO}:1。`;
  if (pixels < CUSTOM_SIZE_MIN_PIXELS || pixels > CUSTOM_SIZE_MAX_PIXELS) {
    return `自定义尺寸总像素数必须在 ${CUSTOM_SIZE_MIN_PIXELS.toLocaleString()} 到 ${CUSTOM_SIZE_MAX_PIXELS.toLocaleString()} 之间。`;
  }
  return '';
}

async function buildResponsesApiRequest() {
  return {
    url: buildApiUrl('/responses'),
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(await buildResponsesPayload())
  };
}

async function buildImagesApiRequest() {
  if (state.mode === 'generate') {
    return {
      url: buildApiUrl('/images/generations'),
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildImagesGenerationPayload())
    };
  }

  return {
    url: buildApiUrl('/images/edits'),
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`
    },
    body: await buildImagesEditFormData()
  };
}

function buildImagesGenerationPayload() {
  const payload = appendImagesPayloadOptions({
    model: resolveImageModelValue(),
    prompt: trimmedStringValue(el.prompt.value),
    size: resolveSizeValue()
  });
  appendImagesStreamPayloadOptions(payload);
  return payload;
}

async function buildImagesEditFormData() {
  const formData = new FormData();
  const imagesToSubmit = state.mode === 'mask'
    ? state.sourceImages.slice(0, 1)
    : state.sourceImages;

  formData.append('model', resolveImageModelValue());
  formData.append('prompt', trimmedStringValue(el.prompt.value));
  formData.append('size', resolveSizeValue());
  appendImagesStreamFormDataOptions(formData);

  const imageFieldName = imagesToSubmit.length > 1 ? 'image[]' : 'image';
  for (const item of imagesToSubmit) {
    formData.append(imageFieldName, item.file, item.file.name || 'image.png');
  }

  if (state.mode === 'mask') {
    const maskBlob = await exportMaskBlob();
    formData.append('mask', maskBlob, 'mask.png');
  }

  appendImagesFormDataOptions(formData);
  return formData;
}

function appendImagesPayloadOptions(payload) {
  payload.n = readImageCount();
  payload.quality = 'auto';
  payload.output_format = 'png';
  payload.response_format = FIXED_RESPONSE_FORMAT;
  payload.moderation = 'low';
  return payload;
}

function appendImagesStreamPayloadOptions(payload) {
  const streaming = shouldUseImagesStream();
  payload.stream = streaming;
  if (streaming) payload.partial_images = FIXED_PARTIAL_IMAGES;
}

function appendImagesFormDataOptions(formData) {
  formData.append('n', String(readImageCount()));
  formData.append('quality', 'auto');
  formData.append('output_format', 'png');
  formData.append('response_format', FIXED_RESPONSE_FORMAT);
  formData.append('moderation', 'low');

  if (!isInputFidelityUnsupportedImageModel()) {
    formData.append('input_fidelity', DEFAULT_INPUT_FIDELITY);
  }
}

function appendImagesStreamFormDataOptions(formData) {
  const streaming = shouldUseImagesStream();
  formData.append('stream', String(streaming));
  if (streaming) formData.append('partial_images', String(FIXED_PARTIAL_IMAGES));
}

async function buildResponsesPayload() {
  const tool = {
    type: 'image_generation',
    model: resolveImageModelValue(),
    action: state.mode === 'mask' ? 'edit' : 'generate',
    size: resolveSizeValue(),
    quality: 'auto',
    output_format: 'png',
    response_format: FIXED_RESPONSE_FORMAT,
    moderation: 'low',
    partial_images: FIXED_PARTIAL_IMAGES
  };

  if (state.mode !== 'generate' && !isInputFidelityUnsupportedImageModel()) {
    tool.input_fidelity = DEFAULT_INPUT_FIDELITY;
  }

  const content = [
    { type: 'input_text', text: trimmedStringValue(el.prompt.value) }
  ];

  const imagesToSubmit = state.mode === 'mask'
    ? state.sourceImages.slice(0, 1)
    : state.mode === 'edit'
      ? state.sourceImages
      : [];

  for (const item of imagesToSubmit) {
    content.push({
      type: 'input_image',
      image_url: await fileToDataUrl(item.file),
      detail: 'auto'
    });
  }

  if (state.mode === 'mask') {
    const maskBlob = await exportMaskBlob();
    tool.input_image_mask = { image_url: await blobToDataUrl(maskBlob) };
  }

  return {
    model: trimmedStringValue(el.responseModel.value) || DEFAULT_RESPONSE_MODEL,
    input: [
      {
        role: 'user',
        content
      }
    ],
    tools: [tool],
    tool_choice: { type: 'image_generation' },
    reasoning: { effort: DEFAULT_REASONING_EFFORT },
    store: false,
    stream: true
  };
}

function isEventStreamResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  return contentType.toLowerCase().includes('text/event-stream');
}

function isSupportedImageFile(file) {
  return SUPPORTED_IMAGE_TYPES.has(file.type);
}

async function consumeImageGenerationJsonResponse(response) {
  const responseText = await response.text();
  const payload = parseJsonPayload(responseText, '生图请求失败：接口没有返回有效 JSON。');
  const images = extractFinalImageCandidates(payload, 'json')
    .map((candidate, index) => createStreamResultImage(candidate, index, false))
    .filter(Boolean);
  if (images.length === 0) throw new Error('接口已返回成功，但没有拿到可展示的图片数据。');
  return images;
}

function shouldUseImagesStream() {
  return false;
}

function getImageStreamModeLabel() {
  return shouldUseImagesStream() ? '流式' : '非流式';
}

function isInputFidelityUnsupportedImageModel() {
  return INPUT_FIDELITY_UNSUPPORTED_IMAGE_MODELS.has(resolveImageModelValue());
}

function resolveImageModelValue() {
  return trimmedStringValue(el.imageModel.value) || DEFAULT_IMAGE_MODEL;
}

function resolveSizeValue() {
  if (el.size.value !== CUSTOM_SIZE_VALUE) return trimmedStringValue(el.size.value) || DEFAULT_SIZE;
  const dimensions = readCustomSizeDimensions();
  return dimensions ? `${dimensions.width}x${dimensions.height}` : DEFAULT_SIZE;
}

function readCustomSizeDimensions() {
  const width = parseIntegerString(el.customSizeWidth.value);
  const height = parseIntegerString(el.customSizeHeight.value);
  if (width === null || height === null || width <= 0 || height <= 0) return null;
  return { width, height };
}

function parseSizeValue(value) {
  const match = /^(\d+)x(\d+)$/i.exec(String(value || '').trim());
  if (!match) return null;
  return { width: match[1], height: match[2] };
}

function fileToDataUrl(file) {
  if (!isSupportedImageFile(file)) return Promise.reject(new Error('仅支持 PNG、JPEG、WebP 图片。'));
  return blobToDataUrl(file);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      result ? resolve(result) : reject(new Error('读取图片失败。'));
    };
    reader.onerror = () => reject(new Error('读取图片失败。'));
    reader.readAsDataURL(blob);
  });
}

async function consumeImageGenerationStream(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('生图请求失败：无法读取流式响应。');

  const decoder = new TextDecoder();
  const completedImages = [];
  const completedImageKeys = new Set();
  let completedCount = 0;
  let buffer = '';
  let currentEvent = '';
  let currentDataLines = [];

  const dispatchEvent = () => {
    if (!currentEvent && currentDataLines.length === 0) return;

    const eventName = currentEvent.trim();
    const rawData = currentDataLines.join('\n').trim();
    currentEvent = '';
    currentDataLines = [];

    if (!rawData || rawData === '[DONE]') return;

    let payload;
    try {
      payload = JSON.parse(rawData);
    } catch {
      throw new Error('生图请求失败：流式响应不是有效 JSON。');
    }

    const payloadType = trimmedStringValue(payload.type);
    const resolvedEvent = eventName || payloadType;
    if (resolvedEvent === 'error' || payloadType === 'error' || payloadType === 'response.failed') {
      throw new Error(extractStreamErrorMessage(payload));
    }

    const partialCandidate = extractPartialImageCandidate(payload, resolvedEvent);
    if (partialCandidate) {
      const partialIndex = Number.isInteger(partialCandidate.index) ? Number(partialCandidate.index) : state.resultImages.length;
      const partialImage = createStreamResultImage(partialCandidate, partialIndex, true);
      if (partialImage) upsertStreamResultImage(partialImage, partialIndex);
      if (resolvedEvent.includes('partial_image') || payloadType.includes('partial_image')) return;
    }

    for (const candidate of extractFinalImageCandidates(payload, resolvedEvent)) {
      if (completedImageKeys.has(candidate.key)) continue;
      const completedImage = createStreamResultImage(candidate, completedCount, false);
      if (!completedImage) continue;
      completedImageKeys.add(candidate.key);
      upsertStreamResultImage(completedImage, completedCount);
      completedImages.push(completedImage);
      completedCount += 1;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, '');
      if (!line) {
        dispatchEvent();
        continue;
      }
      if (line.startsWith(':')) continue;
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
        continue;
      }
      if (line.startsWith('data:')) {
        currentDataLines.push(line.slice(5).trimStart());
      }
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    const trailingLines = buffer.split('\n');
    for (const rawLine of trailingLines) {
      const line = rawLine.replace(/\r$/, '');
      if (!line) {
        dispatchEvent();
        continue;
      }
      if (line.startsWith(':')) continue;
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
        continue;
      }
      if (line.startsWith('data:')) {
        currentDataLines.push(line.slice(5).trimStart());
      }
    }
  }
  dispatchEvent();

  if (completedImages.length === 0) throw new Error('接口已返回成功，但没有拿到可展示的图片数据。');
  state.resultImages = [...completedImages];
  return completedImages;
}

function extractStreamErrorMessage(payload) {
  return trimmedStringValue(payload.response?.error?.message) ||
    trimmedStringValue(payload.error?.message) ||
    trimmedStringValue(payload.response?.error?.code) ||
    trimmedStringValue(payload.error?.code) ||
    '生图请求失败';
}

function extractPartialImageCandidate(payload, resolvedEvent) {
  let candidate = null;
  walkStreamValue(payload, (value) => {
    if (candidate || !isRecord(value)) return;
    const type = trimmedStringValue(value.type);
    const hasPartialIndex = Object.prototype.hasOwnProperty.call(value, 'partial_image_index');
    const looksPartial = type.includes('partial_image') || resolvedEvent.includes('partial_image') || hasPartialIndex;
    if (!looksPartial) return;

    const b64 = trimmedStringValue(value.b64_json) ||
      trimmedStringValue(value.partial_image_b64) ||
      trimmedStringValue(value.partial_image) ||
      trimmedStringValue(value.result);
    const url = trimmedStringValue(value.url);
    if (!b64 && !url) return;

    const index = typeof value.partial_image_index === 'number' && Number.isInteger(value.partial_image_index)
      ? value.partial_image_index
      : undefined;
    candidate = {
      key: streamImageCandidateKey(url, b64, `partial-${index ?? 0}`),
      index,
      url,
      b64,
      revisedPrompt: streamRevisedPromptValue(value),
      outputFormat: trimmedStringValue(value.output_format)
    };
  });
  return candidate;
}

function extractFinalImageCandidates(payload, resolvedEvent) {
  const candidates = [];
  walkStreamValue(payload, (value) => {
    const candidate = streamValueToFinalCandidate(value, resolvedEvent, candidates.length);
    if (candidate) candidates.push(candidate);
  });
  return candidates;
}

function streamValueToFinalCandidate(value, resolvedEvent, index) {
  if (!isRecord(value)) return null;
  const type = trimmedStringValue(value.type);
  const effectiveType = type || resolvedEvent;
  const isToolResult = effectiveType === 'image_generation_call';
  const isLegacyCompleted = effectiveType === 'image_generation.completed' || effectiveType === 'image_edit.completed';
  const isImageResultItem = hasDirectImageValue(value) && (
    effectiveType === 'json' ||
    effectiveType === 'image_generation.completed' ||
    effectiveType === 'image_edit.completed' ||
    resolvedEvent === 'json'
  );
  if (!isToolResult && !isLegacyCompleted && !isImageResultItem) return null;

  const b64 = isToolResult
    ? trimmedStringValue(value.result) || trimmedStringValue(value.b64_json)
    : trimmedStringValue(value.b64_json) || trimmedStringValue(value.result);
  const url = trimmedStringValue(value.url);
  if (!b64 && !url) return null;

  return {
    key: streamImageCandidateKey(url, b64, trimmedStringValue(value.id) || `${effectiveType}-${index}`),
    url,
    b64,
    revisedPrompt: streamRevisedPromptValue(value),
    outputFormat: trimmedStringValue(value.output_format)
  };
}

function hasDirectImageValue(value) {
  return Boolean(
    trimmedStringValue(value.url) ||
    trimmedStringValue(value.b64_json) ||
    trimmedStringValue(value.result)
  );
}

function streamRevisedPromptValue(value) {
  return trimmedStringValue(value.revised_prompt) || trimmedStringValue(value.revisedPrompt);
}

function walkStreamValue(value, visitor) {
  visitor(value);
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) walkStreamValue(item, visitor);
    return;
  }
  for (const item of Object.values(value)) walkStreamValue(item, visitor);
}

function streamImageCandidateKey(url, b64, fallback) {
  if (url) return `url:${url}`;
  if (b64) return `b64:${b64.slice(0, 96)}`;
  return `fallback:${fallback}`;
}

function createStreamResultImage(candidate, index, isPartial) {
  if (!candidate) return null;
  const outputFormat = trimmedStringValue(candidate.outputFormat) || 'png';
  const mimeType = resolveMimeType(outputFormat);
  const url = normalizeStreamImageUrl(candidate, mimeType);
  if (!url) return null;
  return {
    url,
    mimeType: detectMimeTypeFromUrl(url, mimeType),
    fileName: buildImageFileName(index, url, mimeType),
    revisedPrompt: trimmedStringValue(candidate.revisedPrompt) || undefined,
    isPartial
  };
}

function normalizeStreamImageUrl(candidate, mimeType) {
  const directUrl = trimmedStringValue(candidate.url);
  if (directUrl) return directUrl;
  const b64 = trimmedStringValue(candidate.b64);
  if (!b64) return '';
  return `data:${mimeType};base64,${b64}`;
}

function upsertStreamResultImage(image, targetIndex) {
  const next = [...state.resultImages];
  if (targetIndex >= 0 && targetIndex < next.length) {
    next[targetIndex] = image;
  } else {
    next.push(image);
  }
  state.resultImages = next;
  renderResults();
}

async function loadMaskSourceImage(preview) {
  try {
    const image = await loadImageElement(preview.url);
    if (state.sourceImages[0]?.id !== preview.id || state.mode !== 'mask') return;
    state.maskSourceImageElement = image;
    el.maskBaseCanvas.width = image.naturalWidth || DEFAULT_MASK_CANVAS_WIDTH;
    el.maskBaseCanvas.height = image.naturalHeight || DEFAULT_MASK_CANVAS_HEIGHT;
    el.maskDrawingCanvas.width = el.maskBaseCanvas.width;
    el.maskDrawingCanvas.height = el.maskBaseCanvas.height;
    renderMaskEditor();
    el.maskPanel.classList.add('visible');
  } catch {
    showToast('原始图片加载失败，请重新上传后再试。', 'error');
  }
}

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = url;
  });
}

function renderMaskEditor() {
  renderMaskBaseCanvas();
  renderMaskDrawingCanvas();
  updateMaskButtons();
}

function renderMaskBaseCanvas() {
  const canvas = el.maskBaseCanvas;
  const image = state.maskSourceImageElement;
  if (!canvas || !image) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
}

function renderMaskDrawingCanvas() {
  const canvas = el.maskDrawingCanvas;
  const context = canvas.getContext('2d');
  if (!context) return;
  if (!state.maskHasDrawing) context.clearRect(0, 0, canvas.width, canvas.height);
}

function handleMaskPointerDown(event) {
  const canvas = el.maskDrawingCanvas;
  if (state.mode !== 'mask' || !state.maskSourceImageElement) return;
  event.preventDefault();
  const point = getCanvasPoint(event, canvas);
  state.maskPointerActive = true;
  state.maskPointerId = event.pointerId;
  state.maskLastPoint = point;
  canvas.setPointerCapture(event.pointerId);
  pushMaskUndoSnapshot();

  if (state.maskTool === 'brush' || state.maskTool === 'eraser') {
    drawMaskLine(point, point);
    state.maskHasDrawing = hasMaskPixels();
    updateMaskButtons();
    return;
  }

  const context = canvas.getContext('2d');
  if (!context) return;
  state.maskShapeStartPoint = point;
  state.maskShapeSnapshot = context.getImageData(0, 0, canvas.width, canvas.height);
}

function handleMaskPointerMove(event) {
  if (!state.maskPointerActive || event.pointerId !== state.maskPointerId) return;
  const canvas = el.maskDrawingCanvas;
  event.preventDefault();
  const point = getCanvasPoint(event, canvas);
  if (state.maskTool === 'brush' || state.maskTool === 'eraser') {
    drawMaskLine(state.maskLastPoint || point, point);
    state.maskLastPoint = point;
    state.maskHasDrawing = hasMaskPixels();
    updateMaskButtons();
    return;
  }
  drawMaskShapePreview(point);
}

function handleMaskPointerUp(event) {
  if (!state.maskPointerActive || event.pointerId !== state.maskPointerId) return;
  const canvas = el.maskDrawingCanvas;
  event.preventDefault();
  if (state.maskTool === 'circle' || state.maskTool === 'rectangle') {
    drawMaskShapePreview(getCanvasPoint(event, canvas));
  }
  finishMaskPointer(canvas, event.pointerId);
}

function handleMaskPointerLeave(event) {
  if (!state.maskPointerActive || event.pointerId !== state.maskPointerId) return;
  if (event.buttons !== 0) return;
  finishMaskPointer(el.maskDrawingCanvas, event.pointerId);
}

function finishMaskPointer(canvas, pointerId) {
  if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
  state.maskPointerActive = false;
  state.maskPointerId = null;
  state.maskLastPoint = null;
  state.maskShapeStartPoint = null;
  state.maskShapeSnapshot = null;
  state.maskHasDrawing = hasMaskPixels();
  updateMaskButtons();
  markRestoredDirty();
}

function getCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
  const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function drawMaskLine(from, to) {
  const canvas = el.maskDrawingCanvas;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = Number(el.maskBrushSize.value) || 36;
  if (state.maskTool === 'eraser') {
    context.globalCompositeOperation = 'destination-out';
    context.strokeStyle = 'rgba(0, 0, 0, 1)';
  } else {
    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = 'rgba(239, 68, 68, 0.68)';
  }
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
  context.restore();
}

function drawMaskShapePreview(currentPoint) {
  const canvas = el.maskDrawingCanvas;
  const context = canvas.getContext('2d');
  if (!context || !state.maskShapeStartPoint || !state.maskShapeSnapshot) return;
  context.putImageData(state.maskShapeSnapshot, 0, 0);
  context.save();
  context.fillStyle = 'rgba(239, 68, 68, 0.68)';
  if (state.maskTool === 'rectangle') {
    context.fillRect(
      state.maskShapeStartPoint.x,
      state.maskShapeStartPoint.y,
      currentPoint.x - state.maskShapeStartPoint.x,
      currentPoint.y - state.maskShapeStartPoint.y
    );
  } else {
    const radius = Math.hypot(currentPoint.x - state.maskShapeStartPoint.x, currentPoint.y - state.maskShapeStartPoint.y);
    context.beginPath();
    context.arc(state.maskShapeStartPoint.x, state.maskShapeStartPoint.y, radius, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function pushMaskUndoSnapshot() {
  const canvas = el.maskDrawingCanvas;
  const context = canvas.getContext('2d');
  if (!context) return;
  state.maskUndoStack.push(context.getImageData(0, 0, canvas.width, canvas.height));
  if (state.maskUndoStack.length > MAX_UNDO_STACK_SIZE) {
    state.maskUndoStack = state.maskUndoStack.slice(state.maskUndoStack.length - MAX_UNDO_STACK_SIZE);
  }
  updateMaskButtons();
}

function undoMaskDrawing() {
  const canvas = el.maskDrawingCanvas;
  const context = canvas.getContext('2d');
  const snapshot = state.maskUndoStack.pop();
  if (!context || !snapshot) return;
  context.putImageData(snapshot, 0, 0);
  state.maskHasDrawing = hasMaskPixels();
  updateMaskButtons();
  markRestoredDirty();
}

function clearMaskDrawing() {
  const canvas = el.maskDrawingCanvas;
  const context = canvas.getContext('2d');
  if (!context) return;
  pushMaskUndoSnapshot();
  context.clearRect(0, 0, canvas.width, canvas.height);
  state.maskHasDrawing = false;
  updateMaskButtons();
  markRestoredDirty();
}

function hasMaskPixels() {
  const canvas = el.maskDrawingCanvas;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return false;
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] > 0) return true;
  }
  return false;
}

async function previewMask() {
  try {
    const blob = await exportMaskBlob();
    if (state.maskPreviewObjectUrl) URL.revokeObjectURL(state.maskPreviewObjectUrl);
    state.maskPreviewObjectUrl = URL.createObjectURL(blob);
    openPreview(state.maskPreviewObjectUrl, '遮罩预览：透明区域将被修改');
  } catch (error) {
    showToast(extractErrorMessage(error, '导出遮罩失败'), 'error');
  }
}

async function exportMaskBlob() {
  const drawingCanvas = el.maskDrawingCanvas;
  if (!drawingCanvas) throw new Error('遮罩编辑器尚未准备好。');
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = drawingCanvas.width;
  maskCanvas.height = drawingCanvas.height;
  const maskContext = maskCanvas.getContext('2d');
  const drawingContext = drawingCanvas.getContext('2d', { willReadFrequently: true });
  if (!maskContext || !drawingContext) throw new Error('遮罩编辑器尚未准备好。');

  maskContext.fillStyle = '#ffffff';
  maskContext.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
  const drawingData = drawingContext.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
  const maskData = maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  for (let index = 0; index < drawingData.data.length; index += 4) {
    if (drawingData.data[index + 3] > 0) {
      maskData.data[index + 3] = 0;
    }
  }
  maskContext.putImageData(maskData, 0, 0);

  return new Promise((resolve, reject) => {
    maskCanvas.toBlob((blob) => {
      blob ? resolve(blob) : reject(new Error('导出遮罩失败。'));
    }, 'image/png');
  });
}

function resetMaskEditor() {
  const canvas = el.maskDrawingCanvas;
  const context = canvas.getContext('2d');
  if (context) context.clearRect(0, 0, canvas.width, canvas.height);
  el.maskBaseCanvas.width = DEFAULT_MASK_CANVAS_WIDTH;
  el.maskBaseCanvas.height = DEFAULT_MASK_CANVAS_HEIGHT;
  el.maskDrawingCanvas.width = DEFAULT_MASK_CANVAS_WIDTH;
  el.maskDrawingCanvas.height = DEFAULT_MASK_CANVAS_HEIGHT;
  state.maskSourceImageElement = null;
  state.maskPointerActive = false;
  state.maskPointerId = null;
  state.maskLastPoint = null;
  state.maskShapeStartPoint = null;
  state.maskShapeSnapshot = null;
  state.maskUndoStack = [];
  state.maskHasDrawing = false;
  updateMaskButtons();
}

function toggleMaskEditorFullscreen() {
  state.maskEditorExpanded = !state.maskEditorExpanded;
  if (state.maskEditorExpanded) {
    state.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('mask-scroll-lock');
    el.maskPanel.classList.add('fullscreen');
    el.maskFullscreenButton.textContent = '退出放大';
  } else {
    exitMaskEditorFullscreen();
  }
  requestAnimationFrame(renderMaskEditor);
}

function exitMaskEditorFullscreen() {
  state.maskEditorExpanded = false;
  document.body.style.overflow = state.previousBodyOverflow;
  document.body.classList.remove('mask-scroll-lock');
  el.maskPanel.classList.remove('fullscreen');
  el.maskFullscreenButton.textContent = '放大编辑';
  requestAnimationFrame(renderMaskEditor);
}

function setMaskTool(tool) {
  if (!['brush', 'circle', 'rectangle', 'eraser'].includes(tool)) return;
  state.maskTool = tool;
  el.maskToolButtons.forEach((button) => {
    const active = button.dataset.maskTool === tool;
    button.classList.toggle('btn-primary', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function updateMaskButtons() {
  el.maskUndoButton.disabled = state.maskUndoStack.length === 0;
  el.maskClearButton.disabled = !state.maskHasDrawing;
  el.maskPreviewButton.disabled = !state.maskHasDrawing;
}

function renderResults() {
  el.resultBody.innerHTML = '';
  el.resultBody.setAttribute('aria-busy', state.submitting ? 'true' : 'false');
  el.resultBulkActions.classList.toggle('hidden', state.submitting || state.resultImages.length === 0);

  if (state.submitting) {
    el.resultSummary.textContent = state.resultImages.length > 0
      ? `已收到 ${state.resultImages.length} 张流式预览，最终结果仍在生成中。`
      : '请求已发出，正在等待图片返回。';
  } else if (state.resultImages.length === 0) {
    el.resultSummary.textContent = '生成完成后会在这里展示最新结果。';
  } else {
    const duration = formatDuration(state.lastDurationMs);
    const durationText = duration ? `，耗时 ${duration}` : '';
    el.resultSummary.textContent = state.restoredFromCache
      ? `已从浏览器历史记录恢复结果，共 ${state.resultImages.length} 张${durationText}。`
      : `本次已生成 ${state.resultImages.length} 张图片${durationText}。`;
  }

  if (state.submitting && state.resultImages.length === 0) {
    const box = document.createElement('div');
    box.className = 'state-box';
    box.innerHTML = '<div class="spinner"></div><div class="state-title">正在生成图片</div><div>不同模型和尺寸耗时不同，请稍等片刻。</div>';
    el.resultBody.appendChild(box);
    return;
  }

  if (state.submitError) {
    const box = document.createElement('div');
    box.className = 'state-box';
    const title = document.createElement('div');
    title.className = 'state-title';
    title.style.color = 'var(--danger)';
    title.textContent = '生成失败';
    const message = document.createElement('div');
    message.textContent = state.submitError;
    box.append(title, message);
    el.resultBody.appendChild(box);
    return;
  }

  if (state.resultImages.length === 0) {
    const box = document.createElement('div');
    box.className = 'state-box';
    box.innerHTML = '<div class="empty-art" aria-hidden="true"></div><div class="state-title">还没有生成图像</div><div>在左侧填写提示词并设置参数，点击下方按钮开始生成<br>让 AI 帮你把想法变成精彩的图像吧！</div>';
    el.resultBody.appendChild(box);
    return;
  }

  if (state.submitting) {
    const streaming = document.createElement('div');
    streaming.className = 'soft-box';
    streaming.style.marginBottom = '10px';
    streaming.textContent = `已收到 ${state.resultImages.length} 张流式预览，最终结果仍在生成中。`;
    el.resultBody.appendChild(streaming);
  }

  const grid = document.createElement('div');
  grid.className = 'result-grid';
  state.resultImages.forEach((image, index) => {
    grid.appendChild(createResultCard(image, index));
  });
  el.resultBody.appendChild(grid);
}

function createResultCard(image, index) {
  const card = document.createElement('article');
  card.className = 'result-item';

  const imageButton = document.createElement('button');
  imageButton.className = 'result-image-button';
  imageButton.type = 'button';
  imageButton.addEventListener('click', () => openPreview(image.url, image.fileName));
  const img = document.createElement('img');
  img.className = 'result-image';
  img.src = image.url;
  img.alt = `generated-image-${index + 1}`;
  img.loading = 'lazy';
  imageButton.appendChild(img);
  card.appendChild(imageButton);

  const body = document.createElement('div');
  body.className = 'result-body';
  const meta = document.createElement('div');
  meta.className = 'result-meta';
  const nameWrap = document.createElement('div');
  nameWrap.style.minWidth = '0';
  const fileName = document.createElement('div');
  fileName.className = 'truncate';
  fileName.style.fontWeight = '700';
  fileName.textContent = image.fileName;
  const mime = document.createElement('div');
  mime.className = 'hint';
  mime.textContent = image.mimeType;
  nameWrap.append(fileName, mime);
  const pill = document.createElement('span');
  pill.className = 'pill';
  pill.textContent = `#${index + 1}`;
  meta.append(nameWrap, pill);
  body.appendChild(meta);

  if (image.isPartial) {
    const partial = document.createElement('span');
    partial.className = 'pill partial';
    partial.textContent = '预览中，最终结果完成后会自动替换';
    body.appendChild(partial);
  }

  if (image.revisedPrompt) {
    const revised = document.createElement('div');
    revised.className = 'revised';
    revised.textContent = image.revisedPrompt;
    body.appendChild(revised);
  }

  const actions = document.createElement('div');
  actions.className = 'toolbar';
  const download = document.createElement('button');
  download.className = 'btn btn-sm';
  download.type = 'button';
  download.textContent = '下载';
  download.disabled = state.submitting || image.isPartial;
  download.addEventListener('click', () => downloadImage(image, index));
  const editReference = document.createElement('button');
  editReference.className = 'btn btn-sm result-reference-button';
  editReference.type = 'button';
  editReference.textContent = '作为图生图参考图';
  editReference.disabled = state.submitting || image.isPartial;
  editReference.addEventListener('click', () => useResultAsSourceReference(image, index, 'edit', editReference));
  const maskReference = document.createElement('button');
  maskReference.className = 'btn btn-sm result-reference-button';
  maskReference.type = 'button';
  maskReference.textContent = '作为局部重绘参考图';
  maskReference.disabled = state.submitting || image.isPartial;
  maskReference.addEventListener('click', () => useResultAsSourceReference(image, index, 'mask', maskReference));
  actions.append(download, editReference, maskReference);
  body.appendChild(actions);
  card.appendChild(body);
  return card;
}

async function useResultAsSourceReference(image, index, mode, button) {
  if (state.submitting || image.isPartial) return;
  const originalText = button?.textContent || '';
  if (button) {
    button.disabled = true;
    button.textContent = '处理中...';
  }

  try {
    const file = await createSourceFileFromResultImage(image, index);
    const preview = createLocalImagePreview(file);

    if (mode === 'mask') {
      clearLocalPreviews(state.sourceImages);
      state.sourceImages = [preview];
      state.mode = 'mask';
      resetMaskEditor();
      exitMaskEditorFullscreen();
      loadMaskSourceImage(preview);
    } else {
      state.mode = 'edit';
      resetMaskEditor();
      exitMaskEditorFullscreen();
      state.sourceImages = [...state.sourceImages, preview];
    }

    updateModeUI();
    renderSourceImages();
    markRestoredDirty();
    showToast(mode === 'mask' ? '已作为局部重绘参考图' : '已作为图生图参考图', 'success');
  } catch (error) {
    showToast(extractErrorMessage(error, '无法将结果图片作为参考图'), 'error', 6000);
  } finally {
    if (button?.isConnected) {
      button.disabled = state.submitting || image.isPartial;
      button.textContent = originalText;
    }
  }
}

async function createSourceFileFromResultImage(image, index) {
  const response = await fetch(image.url);
  if (!response.ok) throw new Error('读取结果图片失败。');
  const blob = await response.blob();
  const mimeType = normalizeResultSourceMimeType(blob.type || image.mimeType);
  if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    throw new Error('仅支持 PNG、JPEG、WebP 图片作为参考图。');
  }
  const sourceBlob = blob.type === mimeType ? blob : blob.slice(0, blob.size, mimeType);
  return new File([sourceBlob], buildResultReferenceFileName(image, index, mimeType), {
    type: mimeType,
    lastModified: Date.now()
  });
}

function normalizeResultSourceMimeType(value) {
  const normalized = trimmedStringValue(value).toLowerCase();
  if (normalized === 'image/jpg') return 'image/jpeg';
  return normalized;
}

function buildResultReferenceFileName(image, index, mimeType) {
  const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1] || 'png';
  const rawName = trimmedStringValue(image.fileName) || `generated-${index + 1}.${extension}`;
  const safeName = rawName.replace(/[\\/:*?"<>|]+/g, '-');
  return /\.(png|jpe?g|webp)$/i.test(safeName) ? safeName : `${safeName}.${extension}`;
}

async function persistCachedResult() {
  const entry = createHistoryEntry(createCachedResultPayload(state.lastSavedAt, state.resultImages, state.lastDurationMs));
  state.history = [
    entry,
    ...state.history.filter((item) => item.id !== entry.id)
  ].slice(0, HISTORY_LIMIT);
  const saved = await persistImageHistory(entry.id);
  state.activeHistoryId = saved ? entry.id : '';
  return saved;
}

function createCachedResultPayload(savedAt, results, durationMs) {
  return {
    version: 1,
    savedAt,
    durationMs: normalizeDurationMs(durationMs),
    form: captureCurrentForm(),
    results
  };
}

function captureCurrentForm() {
  return {
    count: readImageCount() ?? DEFAULT_IMAGE_COUNT,
    apiMode: state.apiMode,
    mode: state.mode,
    prompt: stringValue(el.prompt.value),
    responseModel: stringValue(el.responseModel.value),
    model: resolveImageModelValue(),
    size: stringValue(el.size.value),
    customSizeWidth: stringValue(el.customSizeWidth.value),
    customSizeHeight: stringValue(el.customSizeHeight.value),
    imageStreamMode: DEFAULT_IMAGE_STREAM_MODE
  };
}

async function loadImageHistory() {
  const history = await readIndexedDbHistory();
  return mergeImageHistory(history);
}

async function readIndexedDbHistory() {
  if (!isIndexedDbAvailable()) return [];
  let db = null;
  try {
    db = await openImageHistoryDb();
    const rawEntries = await getAllHistoryEntries(db);
    return rawEntries
      .map((item) => normalizeHistoryEntry(item))
      .filter(Boolean)
      .sort((left, right) => getHistoryTimestamp(right) - getHistoryTimestamp(left))
      .slice(0, HISTORY_LIMIT);
  } catch (error) {
    console.warn('Failed to read image generation IndexedDB history', error);
    return [];
  } finally {
    db?.close();
  }
}

async function replaceIndexedDbHistory(entries) {
  if (!isIndexedDbAvailable()) throw new Error('IndexedDB is not available');
  let db = null;
  try {
    db = await openImageHistoryDb();
    await writeHistoryEntries(db, entries);
  } finally {
    db?.close();
  }
}

async function clearIndexedDbHistory() {
  if (!isIndexedDbAvailable()) return;
  let db = null;
  try {
    db = await openImageHistoryDb();
    await clearHistoryEntries(db);
  } finally {
    db?.close();
  }
}

function isIndexedDbAvailable() {
  return 'indexedDB' in window && Boolean(window.indexedDB);
}

function openImageHistoryDb() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(HISTORY_DB_NAME, HISTORY_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HISTORY_DB_STORE)) {
        db.createObjectStore(HISTORY_DB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open image generation history database'));
    request.onblocked = () => reject(new Error('Image generation history database upgrade is blocked'));
  });
}

function getAllHistoryEntries(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HISTORY_DB_STORE, 'readonly');
    const store = transaction.objectStore(HISTORY_DB_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || transaction.error || new Error('Failed to read image generation history'));
    transaction.onerror = () => reject(transaction.error || new Error('Failed to read image generation history'));
  });
}

function writeHistoryEntries(db, entries) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HISTORY_DB_STORE, 'readwrite');
    const store = transaction.objectStore(HISTORY_DB_STORE);
    store.clear();
    for (const entry of entries) store.put(toPlainHistoryEntry(entry));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Failed to write image generation history'));
    transaction.onabort = () => reject(transaction.error || new Error('Failed to write image generation history'));
  });
}

function clearHistoryEntries(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HISTORY_DB_STORE, 'readwrite');
    transaction.objectStore(HISTORY_DB_STORE).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Failed to clear image generation history'));
    transaction.onabort = () => reject(transaction.error || new Error('Failed to clear image generation history'));
  });
}

function toPlainHistoryEntry(entry) {
  return {
    id: entry.id,
    version: 1,
    savedAt: entry.savedAt,
    durationMs: normalizeDurationMs(entry.durationMs),
    form: {
      count: entry.form.count,
      apiMode: entry.form.apiMode,
      mode: entry.form.mode,
      prompt: entry.form.prompt,
      responseModel: entry.form.responseModel,
      model: entry.form.model,
      size: entry.form.size,
      customSizeWidth: entry.form.customSizeWidth,
      customSizeHeight: entry.form.customSizeHeight,
      imageStreamMode: entry.form.imageStreamMode
    },
    results: entry.results.map((image) => ({
      url: image.url,
      mimeType: image.mimeType,
      fileName: image.fileName,
      revisedPrompt: image.revisedPrompt,
      isPartial: image.isPartial
    }))
  };
}

function normalizeHistoryEntry(value) {
  if (!isRecord(value)) return null;
  const cached = normalizeCachedResult(value);
  if (!cached) return null;
  return {
    ...cached,
    id: typeof value.id === 'string' && value.id ? value.id : buildHistoryEntryId(cached)
  };
}

function normalizeCachedResult(value) {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.form) || !Array.isArray(value.results)) return null;
  const form = normalizeCachedForm(value.form);
  const results = value.results.filter(isResultImage);
  if (results.length === 0) return null;
  return {
    version: 1,
    savedAt: typeof value.savedAt === 'string' && value.savedAt ? value.savedAt : new Date().toISOString(),
    durationMs: normalizeDurationMs(value.durationMs),
    form,
    results
  };
}

function normalizeCachedForm(value) {
  const storedMode = stringValue(value.mode);
  const normalizedSize = normalizeCachedSizeSettings(value);
  return {
    count: readImageCount(value.count ?? DEFAULT_IMAGE_COUNT) ?? DEFAULT_IMAGE_COUNT,
    apiMode: normalizeApiMode(value.apiMode),
    mode: storedMode === 'edit' || storedMode === 'mask' ? storedMode : 'generate',
    prompt: stringValue(value.prompt),
    responseModel: stringValue(value.responseModel) || DEFAULT_RESPONSE_MODEL,
    model: stringValue(value.model) || DEFAULT_IMAGE_MODEL,
    size: normalizedSize.size,
    customSizeWidth: normalizedSize.customSizeWidth,
    customSizeHeight: normalizedSize.customSizeHeight,
    imageStreamMode: normalizeImageStreamMode(value.imageStreamMode)
  };
}

function normalizeCachedSizeSettings(value) {
  const storedSize = stringValue(value.size);
  const storedCustomWidth = stringValue(value.customSizeWidth) || DEFAULT_CUSTOM_SIZE_WIDTH;
  const storedCustomHeight = stringValue(value.customSizeHeight) || DEFAULT_CUSTOM_SIZE_HEIGHT;
  if (storedSize === CUSTOM_SIZE_VALUE) {
    return { size: CUSTOM_SIZE_VALUE, customSizeWidth: storedCustomWidth, customSizeHeight: storedCustomHeight };
  }
  if (SIZE_PRESET_VALUES.has(storedSize)) {
    return { size: storedSize, customSizeWidth: storedCustomWidth, customSizeHeight: storedCustomHeight };
  }
  const parsed = parseSizeValue(storedSize);
  if (parsed) {
    return { size: CUSTOM_SIZE_VALUE, customSizeWidth: parsed.width, customSizeHeight: parsed.height };
  }
  return { size: DEFAULT_SIZE, customSizeWidth: storedCustomWidth, customSizeHeight: storedCustomHeight };
}

function isResultImage(value) {
  return isRecord(value) &&
    typeof value.url === 'string' &&
    value.url.length > 0 &&
    typeof value.mimeType === 'string' &&
    typeof value.fileName === 'string' &&
    (value.revisedPrompt === undefined || typeof value.revisedPrompt === 'string');
}

function createHistoryEntry(payload) {
  return {
    ...payload,
    results: [...payload.results],
    id: buildHistoryEntryId(payload)
  };
}

function buildHistoryEntryId(payload) {
  return `${payload.savedAt}-${payload.form.mode}-${payload.results.length}`;
}

function getHistoryTimestamp(entry) {
  const timestamp = Date.parse(entry.savedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function mergeImageHistory(entries) {
  const merged = new Map();
  for (const entry of entries) {
    const existing = merged.get(entry.id);
    if (!existing || getHistoryTimestamp(entry) >= getHistoryTimestamp(existing)) {
      merged.set(entry.id, entry);
    }
  }
  return [...merged.values()]
    .sort((left, right) => getHistoryTimestamp(right) - getHistoryTimestamp(left))
    .slice(0, HISTORY_LIMIT);
}

async function persistImageHistory(preferredEntryId) {
  const nextHistory = mergeImageHistory(state.history).slice(0, HISTORY_LIMIT);
  if (nextHistory.length === 0) {
    try {
      await clearIndexedDbHistory();
      return false;
    } catch (error) {
      if (!isQuotaExceededError(error)) console.warn('Failed to clear image generation history', error);
      return false;
    }
  }

  while (nextHistory.length > 0) {
    try {
      await replaceIndexedDbHistory(nextHistory);
      state.history = nextHistory;
      return preferredEntryId ? nextHistory.some((entry) => entry.id === preferredEntryId) : true;
    } catch (error) {
      if (!isQuotaExceededError(error)) {
        console.warn('Failed to persist image generation history', error);
        return false;
      }
      nextHistory.pop();
    }
  }

  try {
    await clearIndexedDbHistory();
  } catch (error) {
    if (!isQuotaExceededError(error)) console.warn('Failed to reset image generation history after quota overflow', error);
  }
  state.history = [];
  return false;
}

function renderHistory() {
  el.historyList.innerHTML = '';
  el.historySummary.textContent = `浏览器本地保留最近 ${HISTORY_LIMIT} 次结果，当前 ${state.history.length} 次。`;
  el.historyCount.textContent = `${state.history.length}/${HISTORY_LIMIT}`;
  if (state.history.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-box';
    empty.textContent = '暂无历史记录';
    el.historyList.appendChild(empty);
    return;
  }

  for (const entry of state.history) {
    el.historyList.appendChild(createHistoryButton(entry));
  }
}

function createHistoryButton(entry) {
  const card = document.createElement('div');
  card.className = `history-item${state.activeHistoryId === entry.id ? ' active' : ''}`;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `恢复历史记录：${entry.title || entry.form.prompt?.split('，')[0] || '未命名图片'}`);
  card.addEventListener('click', (event) => {
    if (event.target.closest('.history-delete')) return;
    restoreHistoryEntry(entry);
  });
  card.addEventListener('keydown', (event) => {
    if (event.target !== card || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    restoreHistoryEntry(entry);
  });

  const thumb = document.createElement('img');
  thumb.className = 'history-cover';
  thumb.src = entry.results[0]?.url || '';
  thumb.alt = entry.title || '历史图片';

  const textWrap = document.createElement('div');
  textWrap.className = 'history-copy';
  const title = document.createElement('div');
  title.className = 'history-title truncate';
  title.textContent = entry.title || entry.form.prompt?.split('，')[0] || '未命名图片';
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'history-delete';
  remove.setAttribute('aria-label', `删除历史记录：${entry.title || '未命名图片'}`);
  remove.title = '删除历史记录';
  remove.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#icon-trash"/></svg>';
  remove.addEventListener('click', (event) => deleteHistoryEntry(entry, event));
  title.appendChild(remove);
  const prompt = document.createElement('div');
  prompt.className = 'history-prompt truncate';
  prompt.textContent = entry.description || entry.form.prompt || '未记录提示词';
  const time = document.createElement('div');
  time.className = 'history-time truncate';
  time.textContent = formatHistoryTime(entry.savedAt);
  textWrap.append(title, prompt, time);
  card.append(thumb, textWrap);
  return card;
}

async function deleteHistoryEntry(entry, event) {
  event?.stopPropagation();
  const title = entry.title || entry.form.prompt?.split('，')[0] || '未命名图片';
  if (!window.confirm(`删除历史记录“${title}”？`)) return;

  state.history = state.history.filter((item) => item.id !== entry.id);
  if (state.activeHistoryId === entry.id) {
    state.activeHistoryId = '';
    state.resultImages = [];
    state.restoredFromCache = false;
    state.lastSavedAt = '';
    state.lastDurationMs = null;
    state.submitError = '';
    renderResults();
  }
  await persistImageHistory();
  renderHistory();
  showToast('已删除历史记录', 'success');
}

function restoreHistoryEntry(entry) {
  clearLocalPreviews(state.sourceImages);
  state.sourceImages = [];
  resetMaskEditor();
  exitMaskEditorFullscreen();
  state.apiMode = PAGE_OPTIONS.apiMode;
  state.mode = entry.form.mode;
  el.prompt.value = entry.form.prompt;
  el.imageCount.value = readImageCount(entry.form.count ?? DEFAULT_IMAGE_COUNT) ?? DEFAULT_IMAGE_COUNT;
  setModelControlValue('response', entry.form.responseModel);
  const model = entry.form.model || DEFAULT_IMAGE_MODEL;
  if (!Array.from(el.imageModel.options).some((option) => option.value === model)) {
    const option = document.createElement('option');
    option.value = option.textContent = model;
    el.imageModel.appendChild(option);
  }
  el.imageModel.value = model;
  el.size.value = entry.form.size;
  el.customSizeWidth.value = entry.form.customSizeWidth;
  el.customSizeHeight.value = entry.form.customSizeHeight;
  state.resultImages = [...entry.results];
  state.restoredFromCache = true;
  state.lastSavedAt = entry.savedAt;
  state.lastDurationMs = normalizeDurationMs(entry.durationMs);
  state.activeHistoryId = entry.id;
  state.submitError = '';
  updateApiModeUI();
  updateModeUI();
  updateSizeUI();
  renderSourceImages();
  renderResults();
  renderHistory();
}

async function confirmClearHistory() {
  if (!window.confirm('清空浏览器本地保存的最近生图历史？该操作不可撤销。')) return;
  try {
    await clearIndexedDbHistory();
  } catch (error) {
    console.warn('Failed to clear image generation IndexedDB history', error);
  }
  state.history = [];
  state.activeHistoryId = '';
  state.resultImages = [];
  state.restoredFromCache = false;
  state.submitError = '';
  state.lastSavedAt = '';
  state.lastDurationMs = null;
  renderResults();
  renderHistory();
  showToast('已清空生图历史记录', 'success');
}

function markRestoredDirty() {
  if (!state.restoredFromCache || state.submitting) return;
  state.restoredFromCache = false;
  state.activeHistoryId = '';
  state.lastDurationMs = null;
  renderResults();
  renderHistory();
}

function formatHistoryTime(value) {
  try {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const pad = (part) => String(part).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
    return value;
  } catch {
    return value;
  }
}

function formatHistoryMeta(entry) {
  const modeLabel = entry.form.mode === 'generate' ? '文生图' : entry.form.mode === 'mask' ? '局部重绘' : '图生图';
  const apiModeLabel = normalizeApiMode(entry.form.apiMode) === 'images' ? 'Images API' : 'Responses API';
  const responseModel = entry.form.responseModel || DEFAULT_RESPONSE_MODEL;
  const imageModel = entry.form.model || DEFAULT_IMAGE_MODEL;
  const size = formatHistorySize(entry.form);
  const modelText = normalizeApiMode(entry.form.apiMode) === 'images'
    ? imageModel
    : `${responseModel} · ${imageModel}`;
  return `${apiModeLabel} · ${modeLabel} · ${modelText} · ${size}`;
}

function formatHistorySize(form) {
  if (form.size === CUSTOM_SIZE_VALUE) return `${form.customSizeWidth}x${form.customSizeHeight}`;
  return form.size || DEFAULT_SIZE;
}

function normalizeDurationMs(value) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.round(value);
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.round(parsed);
  }
  return null;
}

function formatDuration(value) {
  const durationMs = normalizeDurationMs(value);
  if (durationMs === null) return '';
  const totalSeconds = durationMs / 1000;
  if (totalSeconds < 1) return `${durationMs} 毫秒`;
  if (totalSeconds < 60) return `${formatDurationNumber(totalSeconds)} 秒`;
  const roundedSeconds = Math.round(totalSeconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;
  return seconds > 0 ? `${minutes} 分 ${seconds} 秒` : `${minutes} 分`;
}

function formatDurationNumber(value) {
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return rounded.toLocaleString('zh-CN', { maximumFractionDigits: 1 });
}

async function copyAllImageLinks() {
  const content = state.resultImages.map((image) => image.url).join('\n');
  if (!content) return;
  try {
    await writeClipboardText(content);
    showToast('已复制全部图片链接', 'success');
  } catch {
    showToast('复制失败，请手动复制链接', 'error');
  }
}

async function copyImageLink(image) {
  try {
    await writeClipboardText(image.url);
    showToast('已复制图片链接', 'success');
  } catch {
    showToast('复制失败，请手动复制链接', 'error');
  }
}

async function writeClipboardText(content) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
      return;
    }
  } catch {
    // fallback below
  }

  const textarea = document.createElement('textarea');
  textarea.value = content;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!copied) throw new Error('copy failed');
}

async function downloadAllImages() {
  for (const [index, image] of state.resultImages.entries()) {
    await downloadImage(image, index);
  }
}

async function downloadImage(image, index) {
  try {
    if (image.url.startsWith('data:')) {
      triggerDownload(image.url, image.fileName);
      return;
    }
    const response = await fetch(image.url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    triggerDownload(objectUrl, image.fileName || `generated-${index + 1}.png`);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    window.open(image.url, '_blank', 'noopener,noreferrer');
    showToast('当前图片已在新标签页打开', 'info');
  }
}

function triggerDownload(url, fileName) {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function openPreview(url, title = '') {
  state.previewImageUrl = url;
  el.previewImage.src = url;
  el.previewImage.alt = title || 'preview';
  el.previewTitle.textContent = title || '预览';
  resetPreviewZoom();
  el.previewModal.classList.add('visible');
}

function closePreview() {
  const closedUrl = state.previewImageUrl;
  state.previewImageUrl = '';
  el.previewModal.classList.remove('visible');
  el.previewImage.removeAttribute('src');
  finishPreviewDrag();
  resetPreviewZoom();
  if (state.maskPreviewObjectUrl && closedUrl === state.maskPreviewObjectUrl) {
    URL.revokeObjectURL(state.maskPreviewObjectUrl);
    state.maskPreviewObjectUrl = '';
  }
}

function handlePreviewWheel(event) {
  if (!state.previewImageUrl) return;
  event.preventDefault();
  const image = el.previewImage;
  const rect = image.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    const originX = ((event.clientX - rect.left) / rect.width) * 100;
    const originY = ((event.clientY - rect.top) / rect.height) * 100;
    state.previewTransformOrigin = `${clampNumber(originX, 0, 100)}% ${clampNumber(originY, 0, 100)}%`;
  }
  const wheelDelta = clampNumber(event.deltaY, -180, 180);
  const nextZoom = state.previewZoom * Math.exp(-wheelDelta * 0.0006);
  state.previewZoom = clampNumber(nextZoom, 0.25, 8);
  if (state.previewZoom <= 1) {
    state.previewOffset = { x: 0, y: 0 };
    finishPreviewDrag();
  }
  applyPreviewTransform();
}

function handlePreviewPointerDown(event) {
  if (event.button !== 0 || state.previewZoom <= 1) return;
  event.preventDefault();
  state.previewDrag = {
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startOffsetX: state.previewOffset.x,
    startOffsetY: state.previewOffset.y
  };
  el.previewImage.setPointerCapture(event.pointerId);
  applyPreviewCursor();
}

function handlePreviewPointerMove(event) {
  const drag = state.previewDrag;
  if (!drag || event.pointerId !== drag.pointerId) return;
  event.preventDefault();
  state.previewOffset = {
    x: drag.startOffsetX + event.clientX - drag.startClientX,
    y: drag.startOffsetY + event.clientY - drag.startClientY
  };
  applyPreviewTransform();
}

function finishPreviewDrag(event) {
  const drag = state.previewDrag;
  if (!drag || (event && event.pointerId !== drag.pointerId)) return;
  if (el.previewImage.hasPointerCapture(drag.pointerId)) {
    el.previewImage.releasePointerCapture(drag.pointerId);
  }
  state.previewDrag = null;
  applyPreviewCursor();
}

function resetPreviewZoom() {
  state.previewZoom = 1;
  state.previewTransformOrigin = '50% 50%';
  state.previewOffset = { x: 0, y: 0 };
  state.previewDrag = null;
  applyPreviewTransform();
  applyPreviewCursor();
}

function nudgePreviewZoom(multiplier) {
  state.previewZoom = clampNumber(state.previewZoom * multiplier, 0.25, 8);
  if (state.previewZoom <= 1) {
    state.previewOffset = { x: 0, y: 0 };
    finishPreviewDrag();
  }
  applyPreviewTransform();
  applyPreviewCursor();
}

function applyPreviewTransform() {
  el.previewImage.style.transform = `translate3d(${state.previewOffset.x}px, ${state.previewOffset.y}px, 0) scale(${state.previewZoom})`;
  el.previewImage.style.transformOrigin = state.previewTransformOrigin;
  updatePreviewZoomControl();
}

function applyPreviewCursor() {
  el.previewImage.style.cursor = state.previewZoom > 1 ? (state.previewDrag ? 'grabbing' : 'grab') : 'default';
}

function updatePreviewZoomControl() {
  el.previewZoomResetButton.textContent = `${Math.round(state.previewZoom * 100)}%`;
}

function handleGlobalKeydown(event) {
  if (event.key !== 'Escape') return;
  if (state.activeTooltipTrigger) {
    hideHelpTooltip();
    return;
  }
  if (state.promptPolishModalOpen) {
    closePromptPolishModal();
    return;
  }
  if (state.previewImageUrl) {
    closePreview();
    return;
  }
  if (state.maskEditorExpanded) exitMaskEditorFullscreen();
}

function normalizeImageStreamMode(value) {
  return DEFAULT_IMAGE_STREAM_MODE;
}

function parseIntegerString(value) {
  const normalized = trimmedStringValue(value);
  if (!/^-?\d+$/.test(normalized)) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function extractImagesErrorMessage(responseText, status) {
  if (!String(responseText || '').trim()) return `请求失败 (${status})`;
  try {
    const parsed = JSON.parse(responseText);
    return parsed.error?.message || parsed.message || parsed.detail || `请求失败 (${status})`;
  } catch {
    return responseText;
  }
}

function extractImagesErrorCode(responseText) {
  if (!String(responseText || '').trim()) return '';
  try {
    return extractImagesErrorCodeFromPayload(JSON.parse(responseText));
  } catch {
    return '';
  }
}

function extractImagesErrorCodeFromPayload(payload) {
  if (!isRecord(payload)) return '';
  return trimmedStringValue(payload.code) ||
    trimmedStringValue(payload.error?.code) ||
    trimmedStringValue(payload.error?.type);
}

function resolveMimeType(format) {
  const normalized = String(format || '').trim().toLowerCase();
  switch (normalized) {
    case 'jpg':
    case 'jpeg':
    case 'image/jpeg':
      return 'image/jpeg';
    case 'webp':
    case 'image/webp':
      return 'image/webp';
    case 'png':
    case 'image/png':
    default:
      return 'image/png';
  }
}

function detectMimeTypeFromUrl(url, fallback) {
  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;]+);/);
    return match?.[1] || fallback;
  }
  try {
    const pathname = new URL(url, window.location.href).pathname.toLowerCase();
    if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
    if (pathname.endsWith('.webp')) return 'image/webp';
    if (pathname.endsWith('.png')) return 'image/png';
  } catch {
    // fallback below
  }
  return fallback;
}

function buildImageFileName(index, url, mimeType) {
  const extension = mimeType.split('/')[1] || 'png';
  if (!url.startsWith('data:')) {
    try {
      const pathname = new URL(url).pathname;
      const candidate = pathname.split('/').pop();
      if (candidate) return candidate;
    } catch {
      // ignore
    }
  }
  return `generated-${index + 1}.${extension}`;
}

function showToast(message, type = 'info', timeout = 4200) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  el.toastHost.appendChild(toast);
  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(6px)';
    toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    window.setTimeout(() => toast.remove(), 220);
  }, timeout);
}

function extractErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) return error.message;
  if (isRecord(error)) {
    return stringValue(error.message) || stringValue(error.detail) || stringValue(error.error) || fallback;
  }
  return fallback;
}

function isQuotaExceededError(error) {
  return error instanceof DOMException && (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  );
}

function isRecord(value) {
  return typeof value === 'object' && value !== null;
}

function stringValue(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function trimmedStringValue(value) {
  return stringValue(value).trim();
}

function firstConfigString(...values) {
  for (const value of values) {
    const normalized = trimmedStringValue(value);
    if (normalized) return normalized;
  }
  return '';
}

function normalizeApiBaseUrl(value, apiPathPrefix = FALLBACK_API_PATH_PREFIX) {
  let normalized = trimmedStringValue(value);
  if (!normalized) return '';
  normalized = normalized.replace(/\/+$/, '');
  normalized = normalized.replace(/\/(?:responses|models)$/i, '');
  const prefix = normalizeApiPathPrefix(apiPathPrefix);
  if (prefix) normalized = normalized.replace(new RegExp(`${escapeRegExp(prefix)}$`, 'i'), '');
  normalized = normalized.replace(/\/+$/, '');
  return normalized;
}

function normalizeApiPathPrefix(value) {
  const normalized = trimmedStringValue(value).replace(/^\/+|\/+$/g, '');
  return normalized ? `/${normalized}` : '';
}

function normalizeExternalLink(value) {
  const normalized = trimmedStringValue(value);
  if (!normalized) return '';
  try {
    const url = new URL(normalized, window.location.href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function readBooleanSearchParam(name) {
  try {
    return new URLSearchParams(window.location.search).get(name) === 'true';
  } catch {
    return false;
  }
}

function readSearchParam(name) {
  try {
    return trimmedStringValue(new URLSearchParams(window.location.search).get(name));
  } catch {
    return '';
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function greatestCommonDivisor(left, right) {
  let a = Math.abs(Number(left)) || 1;
  let b = Math.abs(Number(right)) || 1;
  while (b) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a || 1;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
