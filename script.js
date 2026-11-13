const terms = window.insuranceTerms;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const easeOut = "cubic-bezier(0.23, 1, 0.32, 1)";

function createContentSwapper(element) {
  let animation;
  let version = 0;
  return async update => {
    version += 1;
    const currentVersion = version;
    if (reduceMotion.matches) {
      animation?.cancel();
      update();
      return;
    }
    const opacity = Number(getComputedStyle(element).opacity);
    animation?.cancel();
    const exit = element.animate([{ opacity }, { opacity: 0 }], { duration: 120, easing: easeOut, fill: "forwards" });
    animation = exit;
    await exit.finished.catch(() => {});
    if (currentVersion !== version) return;
    update();
    exit.cancel();
    animation = element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: easeOut });
  };
}

const translationExamples = {
  "免赔额": { original: "“在一个保单年度内，符合约定的医疗费用，需先扣除年度免赔额，再按约定比例给付……”", headline: "先自己承担的一部分", example: "免赔额 1 万元，符合条件的费用 3 万元，先扣掉 1 万元，再按合同约定计算剩余部分。" },
  "等待期": { original: "“自本合同生效之日起三十日内为等待期。等待期内发生约定疾病保险事故，本公司不承担给付保险金责任……”", headline: "保障开始前的一段约定时间", example: "等待期 30 天，投保后第 10 天因疾病住院，通常不在疾病医疗保障范围内；意外是否受限要看合同。" },
  "既往症": { original: "“既往症指被保险人在本合同生效前已经确诊或出现症状，且符合本合同约定定义的疾病或健康异常……”", headline: "投保前已经存在的健康问题", example: "投保前已确诊并持续治疗的疾病，可能属于既往症，是否承保或赔付要看健康告知和合同定义。" }
};

const translationDemo = document.querySelector("#translation-demo");
const translationStage = document.querySelector("#translation-stage");
const translationToggle = document.querySelector("#translate-toggle");
const translationState = document.querySelector("#translation-state");
const originalLayer = document.querySelector("#original-layer");
const plainLayer = document.querySelector("#plain-layer");
const swapTranslation = createContentSwapper(translationStage);
let translationInteracted = false;

function setTranslationState(translated) {
  translationDemo.classList.toggle("is-translated", translated);
  translationToggle.setAttribute("aria-pressed", String(translated));
  translationToggle.querySelector("span").textContent = translated ? "再看一次原文" : "翻译成大白话";
  translationState.textContent = translated ? "已说成人话" : "条款原文";
  originalLayer.setAttribute("aria-hidden", String(translated));
  plainLayer.setAttribute("aria-hidden", String(!translated));
  plainLayer.inert = !translated;
}

translationToggle.addEventListener("click", () => {
  translationInteracted = true;
  setTranslationState(!translationDemo.classList.contains("is-translated"));
});

document.querySelectorAll("[data-translation-term]").forEach(button => {
  button.addEventListener("click", () => {
    translationInteracted = true;
    const term = button.dataset.translationTerm;
    if (button.classList.contains("active")) return;
    document.querySelectorAll("[data-translation-term]").forEach(item => item.classList.toggle("active", item === button));
    setTranslationState(false);
    swapTranslation(() => {
      const content = translationExamples[term];
      document.querySelector("#translation-original").textContent = content.original;
      document.querySelector("#translation-term").textContent = term;
      document.querySelector("#translation-headline").textContent = content.headline;
      document.querySelector("#translation-example").textContent = content.example;
      document.querySelector("#translation-more").dataset.openTerm = term;
    });
  });
});

if (!reduceMotion.matches) window.setTimeout(() => { if (!translationInteracted) setTranslationState(true); }, 1200);

document.addEventListener("click", event => {
  const termButton = event.target.closest("[data-open-term]");
  if (termButton) window.location.href = `dictionary.html?term=${encodeURIComponent(termButton.dataset.openTerm)}`;
});

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#site-search");
const searchResults = document.querySelector("#search-results");

function appendResult({ href, icon, title, detail }) {
  const link = document.createElement("a");
  link.href = href;
  link.innerHTML = `<svg aria-hidden="true"><use href="icons.svg#${icon}"></use></svg><span><strong>${title}</strong><small>${detail}</small></span><svg aria-hidden="true"><use href="icons.svg#i-arrow"></use></svg>`;
  link.addEventListener("click", () => { searchResults.hidden = true; });
  searchResults.append(link);
}

function showSearchResults(query) {
  const normalized = query.trim();
  searchResults.replaceChildren();
  if (!normalized) {
    showPopularSearches();
    return;
  }
  const matchedTerms = Object.entries(terms).filter(([term, content]) => term.includes(normalized) || content.plain.includes(normalized) || normalized.includes(term));
  matchedTerms.forEach(([term, content]) => appendResult({ href: `dictionary.html?term=${encodeURIComponent(term)}`, icon: "i-book", title: term, detail: content.plain }));
  if (/忽悠|靠谱|话术|什么都保|骗|分红|收益/.test(normalized)) appendResult({ href: "pitfalls.html", icon: "i-message", title: "避坑指南", detail: "查看话术拆解、冰山图和追问三问" });
  if (/理赔|出险|报销|拒赔|投诉/.test(normalized)) appendResult({ href: "claims.html", icon: "i-health", title: "理赔流程", detail: "查看时间轴、材料清单与投诉渠道" });
  if (/险种|怎么选|选择|保障|教育金|养老金/.test(normalized)) appendResult({ href: "direction.html", icon: "i-compass", title: "险种查询", detail: "通过五步问答了解关注方向" });
  if (!searchResults.children.length) {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = `暂未找到“${normalized}”，可试试“免赔额”或“被忽悠了怎么办”。`;
    searchResults.append(empty);
  }
  searchResults.hidden = false;
}

function showPopularSearches() {
  searchResults.replaceChildren();
  const label = document.createElement("p");
  label.className = "search-section-label";
  label.textContent = "热门搜索";
  searchResults.append(label);
  ["免赔额", "等待期", "被忽悠了怎么办"].forEach(query => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<svg aria-hidden="true"><use href="icons.svg#i-search"></use></svg><span><strong>${query}</strong></span><svg aria-hidden="true"><use href="icons.svg#i-arrow"></use></svg>`;
    button.addEventListener("click", () => { searchInput.value = query; showSearchResults(query); });
    searchResults.append(button);
  });
  searchResults.hidden = false;
}

searchInput.addEventListener("focus", () => { if (!searchInput.value.trim()) showPopularSearches(); });
searchInput.addEventListener("input", () => { if (!searchInput.value.trim()) showPopularSearches(); else searchResults.hidden = true; });
new MutationObserver(() => searchInput.setAttribute("aria-expanded", String(!searchResults.hidden))).observe(searchResults, { attributes: true, attributeFilter: ["hidden"] });
searchForm.addEventListener("submit", event => { event.preventDefault(); showSearchResults(searchInput.value); });
document.addEventListener("click", event => { if (!event.target.closest(".search-area")) searchResults.hidden = true; });
searchInput.addEventListener("keydown", event => { if (event.key === "Escape") searchResults.hidden = true; });

const elderToggle = document.querySelector("#elder-toggle");
const elderToolbar = document.querySelector("#elder-toolbar");
const elderReadButton = document.querySelector("#elder-read-page");
const elderCopy = new Map([
  ["#hero-title", "保险知识，<br>讲明白。"],
  [".hero-description", "不卖保险，没有广告。"],
  [".hero-search > label", "搜索保险知识"],
  [".search-control .primary-button", "查询"],
  ["#tasks-title", "选择功能"],
  [".task-card.direction strong", "险种查询"],
  [".task-card.warning strong", "避坑指南"],
  [".task-card.dictionary strong", "大白话词典"],
  [".task-card.claims strong", "理赔流程"]
]);

function resetElderReadButton() {
  elderReadButton.setAttribute("aria-pressed", "false");
  elderReadButton.querySelector("span").textContent = "朗读本页";
}

function setElderCopy(enabled) {
  elderCopy.forEach((simplified, selector) => {
    const element = document.querySelector(selector);
    if (!element.dataset.standardHtml) element.dataset.standardHtml = element.innerHTML;
    element.innerHTML = enabled ? simplified : element.dataset.standardHtml;
  });
  searchInput.placeholder = enabled ? "例如：免赔额" : "输入名词或问题";
}

elderToggle.addEventListener("click", () => {
  const enabled = document.documentElement.classList.toggle("elder-mode");
  elderToggle.setAttribute("aria-pressed", String(enabled));
  elderToggle.querySelector("span").textContent = enabled ? "退出长辈模式" : "长辈模式";
  elderToolbar.hidden = !enabled;
  setElderCopy(enabled);
  document.querySelector("#main-nav").classList.remove("open");
  window.speechSynthesis?.cancel();
  resetElderReadButton();
  window.scrollTo({ top: 0, behavior: "instant" });
});

elderReadButton.addEventListener("click", () => {
  if (!("speechSynthesis" in window)) { showToast("当前浏览器暂不支持语音朗读。"); return; }
  if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); resetElderReadButton(); return; }
  const text = document.querySelector("#main").innerText.replace(/\s+/g, " ").trim();
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.9;
  utterance.onend = resetElderReadButton;
  utterance.onerror = resetElderReadButton;
  elderReadButton.setAttribute("aria-pressed", "true");
  elderReadButton.querySelector("span").textContent = "停止朗读";
  window.speechSynthesis.speak(utterance);
});

const menuToggle = document.querySelector("#menu-toggle");
const mainNav = document.querySelector("#main-nav");
menuToggle.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
  menuToggle.querySelector("use").setAttribute("href", open ? "#i-close" : "#i-menu");
});
mainNav.addEventListener("click", event => {
  if (!event.target.closest("a")) return;
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.querySelector("use").setAttribute("href", "#i-menu");
});

const correctionDialog = document.querySelector("#correction-dialog");
document.querySelectorAll(".correction-open").forEach(button => button.addEventListener("click", () => correctionDialog.showModal()));
document.querySelectorAll("[data-close-dialog]").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });
});

let toastTimer;
function showToast(message) {
  const toast = document.querySelector("#toast");
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

document.querySelector("#correction-form").addEventListener("submit", event => {
  event.preventDefault();
  correctionDialog.close();
  event.target.reset();
  showToast("外观原型演示完成，未发送或保存任何数据。");
});
