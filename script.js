const terms = {
  "免赔额": {
    plain: "保险公司开始按约定赔付前，需要你自己先承担的一部分费用。",
    example: "免赔额是 1 万元，符合报销条件的医疗费用是 3 万元，通常先扣除 1 万元，再按合同约定计算剩余费用如何赔付。",
    misconception: "免赔额不等于所有花费都能累计，也不是每次理赔都重新扣除；要看合同约定的是年度免赔额还是次免赔额。",
    related: ["等待期", "既往症"]
  },
  "等待期": {
    plain: "合同生效后的一段约定时间，期间发生某些保险事故，保险公司可能不按约定赔付。",
    example: "某医疗险约定等待期 30 天。投保后第 10 天因疾病住院，通常不在疾病医疗保障范围内；意外是否受限要看具体合同。",
    misconception: "等待期不等于保单没有生效，也不代表所有事故都一律不赔。不同责任、不同产品的约定可能不同。",
    related: ["免赔额", "既往症"]
  },
  "犹豫期": {
    plain: "投保并收到合同后，可以按约定冷静考虑、申请解除合同的一段时间。",
    example: "买到长期保险后发现保障内容与理解不一致，可以在合同约定的犹豫期内申请退保，按约定退还已交保费。",
    misconception: "犹豫期不是随时都能无损失退保。超过约定期限后解除合同时，通常按现金价值处理。",
    related: ["现金价值", "等待期"]
  },
  "现金价值": {
    plain: "长期人身保险在解除合同时，按照合同约定计算、可能退还给投保人的金额。",
    example: "一份长期保险交了几年后申请退保，退回金额可能低于累计已交保费，具体数额可查看合同中的现金价值表。",
    misconception: "现金价值不等于已交保费，也不是银行账户余额。它会随保单年度和合同规则变化。",
    related: ["犹豫期", "等待期"]
  },
  "既往症": {
    plain: "通常指投保前已经存在、符合合同约定定义的疾病、症状或健康异常。",
    example: "投保前已经确诊并持续治疗的疾病，可能属于合同所说的既往症，是否承保或赔付要看健康告知和合同条款。",
    misconception: "不能自行判断“没住院就不算既往症”。应如实回答健康告知，并以合同中的具体定义为准。",
    related: ["等待期", "免赔额"]
  }
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const easeOut = "cubic-bezier(0.23, 1, 0.32, 1)";

function createContentSwapper(element, axis = "y") {
  let animation;
  let version = 0;

  return async (update, direction = 1, immediate = false) => {
    version += 1;
    const currentVersion = version;
    if (immediate || reduceMotion.matches) {
      animation?.cancel();
      update();
      return;
    }

    const computed = getComputedStyle(element);
    const currentOpacity = Number(computed.opacity);
    const currentTransform = computed.transform === "none" ? "translateY(0)" : computed.transform;
    animation?.cancel();

    const exitTransform = axis === "x" ? `translateX(${-8 * direction}px)` : "translateY(-5px)";
    const exit = element.animate([
      { opacity: currentOpacity, transform: currentTransform },
      { opacity: 0, transform: exitTransform }
    ], { duration: 120, easing: easeOut, fill: "forwards" });
    animation = exit;
    await exit.finished.catch(() => {});
    if (currentVersion !== version) return;

    update();
    exit.cancel();
    const enterTransform = axis === "x" ? `translateX(${10 * direction}px)` : "translateY(5px)";
    animation = element.animate([
      { opacity: 0, transform: enterTransform },
      { opacity: 1, transform: "translate(0, 0)" }
    ], { duration: 180, easing: easeOut });
  };
}

const translationExamples = {
  "免赔额": {
    original: "“在一个保单年度内，符合约定的医疗费用，需先扣除年度免赔额，再按约定比例给付……”",
    headline: "先自己承担的一部分",
    example: "比如免赔额是 1 万元，符合报销条件的费用是 3 万元，先扣掉 1 万元，再按合同约定计算剩余部分。"
  },
  "等待期": {
    original: "“自本合同生效之日起三十日内为等待期。等待期内发生约定疾病保险事故，本公司不承担给付保险金责任……”",
    headline: "保障开始前的一段约定时间",
    example: "比如等待期是 30 天，投保后第 10 天因疾病住院，通常不在疾病医疗保障范围内；意外是否受限要看合同。"
  },
  "既往症": {
    original: "“既往症指被保险人在本合同生效前已经确诊或出现症状，且符合本合同约定定义的疾病或健康异常……”",
    headline: "投保前已经存在的健康问题",
    example: "比如投保前已经确诊并持续治疗的疾病，可能属于既往症。是否承保或赔付，要看健康告知和合同定义。"
  }
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

if (!reduceMotion.matches) {
  window.setTimeout(() => {
    if (!translationInteracted) setTranslationState(true);
  }, 1200);
}

const termTitle = document.querySelector("#term-title");
const termPlain = document.querySelector("#term-plain");
const termExample = document.querySelector("#term-example");
const termMisconception = document.querySelector("#term-misconception");
const relatedTerms = document.querySelector("#related-terms");
const termTabs = [...document.querySelectorAll(".term-tab")];
const termArticle = document.querySelector(".term-article");
const swapTerm = createContentSwapper(termArticle);
let activeTerm = "免赔额";

function renderTerm(term, shouldScroll = false) {
  const content = terms[term];
  if (!content) return;
  termTabs.forEach(tab => {
    const selected = tab.dataset.term === term;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });
  if (shouldScroll) {
    window.location.href = `dictionary.html?term=${encodeURIComponent(term)}`;
    return;
  }
  if (activeTerm === term) return;

  swapTerm(() => {
    activeTerm = term;
    termTitle.textContent = term;
    termPlain.textContent = content.plain;
    termExample.textContent = content.example;
    termMisconception.textContent = content.misconception;
    relatedTerms.replaceChildren(...content.related.map(related => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.openTerm = related;
      button.textContent = related;
      return button;
    }));
  });
}

termTabs.forEach(tab => tab.addEventListener("click", () => renderTerm(tab.dataset.term)));

document.addEventListener("click", event => {
  const termButton = event.target.closest("[data-open-term]");
  if (termButton) renderTerm(termButton.dataset.openTerm, true);
});

document.querySelector("#term-filter").addEventListener("input", event => {
  const query = event.target.value.trim();
  termTabs.forEach(tab => {
    tab.hidden = Boolean(query) && !tab.textContent.includes(query);
  });
});

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#site-search");
const searchResults = document.querySelector("#search-results");

function showSearchResults(query) {
  const normalized = query.trim();
  searchResults.replaceChildren();
  if (!normalized) {
    searchResults.hidden = true;
    searchInput.focus();
    return;
  }

  const matchedTerms = Object.entries(terms).filter(([term, content]) =>
    term.includes(normalized) || content.plain.includes(normalized) || normalized.includes(term)
  );
  const isPitfall = /忽悠|靠谱|话术|什么都保|骗/.test(normalized);
  const isClaim = /理赔|出险|报销|拒赔/.test(normalized);

  matchedTerms.forEach(([term, content]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<svg aria-hidden="true"><use href="#i-book"></use></svg><span><strong>${term}</strong><small>${content.plain}</small></span><svg aria-hidden="true"><use href="#i-arrow"></use></svg>`;
    button.addEventListener("click", () => {
      renderTerm(term, true);
      searchResults.hidden = true;
    });
    searchResults.append(button);
  });

  if (isPitfall) {
    const link = document.createElement("a");
    link.href = "pitfalls.html";
    link.innerHTML = `<svg aria-hidden="true"><use href="#i-message"></use></svg><span><strong>这个说法靠谱吗？</strong><small>查看销售话术拆解与追问三问</small></span><svg aria-hidden="true"><use href="#i-arrow"></use></svg>`;
    link.addEventListener("click", () => { searchResults.hidden = true; });
    searchResults.append(link);
  }

  if (isClaim) {
    const link = document.createElement("a");
    link.href = "claims.html";
    link.innerHTML = `<svg aria-hidden="true"><use href="#i-health"></use></svg><span><strong>出险后怎么处理？</strong><small>查看理赔步骤和材料清单</small></span><svg aria-hidden="true"><use href="#i-arrow"></use></svg>`;
    link.addEventListener("click", () => { searchResults.hidden = true; });
    searchResults.append(link);
  }

  if (!searchResults.children.length) {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = `暂未找到“${normalized}”的演示内容，可以试试“免赔额”“等待期”或“被忽悠了怎么办”。`;
    searchResults.append(empty);
  }
  searchResults.hidden = false;
}

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  showSearchResults(searchInput.value);
});

document.querySelectorAll("[data-query]").forEach(button => {
  button.addEventListener("click", () => {
    searchInput.value = button.dataset.query;
    showSearchResults(button.dataset.query);
  });
});

document.addEventListener("click", event => {
  if (!event.target.closest(".search-area")) searchResults.hidden = true;
});

searchInput.addEventListener("keydown", event => {
  if (event.key === "Escape") searchResults.hidden = true;
});

const elderToggle = document.querySelector("#elder-toggle");
const elderToolbar = document.querySelector("#elder-toolbar");
const elderReadButton = document.querySelector("#elder-read-page");
const elderCopy = new Map([
  ["#hero-title", "保险问题，<br>在这里问明白。"],
  [".hero-description", "不卖保险，没有广告。只讲您能听懂的保险知识。"],
  [".hero-search > label", "您想查什么？"],
  [".search-control .primary-button", "查询"],
  [".tasks-section .section-kicker", "四个常用功能"],
  ["#tasks-title", "您想做什么？"],
  [".task-card.direction .task-content strong", "查保险方向"],
  [".task-card.warning .task-content strong", "识别销售话术"],
  [".task-card.dictionary .task-content strong", "查保险名词"],
  [".task-card.claims .task-content strong", "看理赔材料"],
  ["#dictionary-title", "查一个保险词"],
  ["#pitfalls-title", "这些话，先别信。"],
  [".pitfalls-intro > p:not(.section-kicker)", "先问清楚，再做决定。"],
  ["#claims-title", "出险后，准备这些材料"],
  [".disclaimer p", "<strong>公益科普</strong>不推荐产品，不承诺理赔。"]
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
  searchInput.placeholder = enabled ? "例如：免赔额" : "试试“免赔额”或“被忽悠了怎么办”";
}

elderToggle.addEventListener("click", () => {
  const enabled = document.documentElement.classList.toggle("elder-mode");
  elderToggle.setAttribute("aria-pressed", String(enabled));
  elderToggle.querySelector("span").textContent = enabled ? "退出长辈模式" : "长辈模式";
  elderToolbar.hidden = !enabled;
  setElderCopy(enabled);
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  window.speechSynthesis?.cancel();
  resetElderReadButton();
  window.scrollTo({ top: 0, behavior: "instant" });
});

elderReadButton.addEventListener("click", () => {
  if (!("speechSynthesis" in window)) {
    showToast("当前浏览器暂不支持语音朗读。");
    return;
  }
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    resetElderReadButton();
    return;
  }
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

document.querySelector("#read-term").addEventListener("click", () => {
  const toast = document.querySelector("#toast");
  if (!("speechSynthesis" in window)) {
    showToast("当前浏览器暂不支持语音朗读。");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(`${activeTerm}。${terms[activeTerm].plain}`);
  utterance.lang = "zh-CN";
  window.speechSynthesis.speak(utterance);
  toast.hidden = true;
});

const materialInputs = [...document.querySelectorAll(".material-list input")];
const materialProgress = document.querySelector("#material-progress");
materialInputs.forEach(input => input.addEventListener("change", () => {
  const checked = materialInputs.filter(item => item.checked).length;
  materialProgress.textContent = `已准备 ${checked} / ${materialInputs.length} 项`;
}));

const directionDialog = document.querySelector("#direction-dialog");
const wizardContent = document.querySelector("#wizard-content");
const wizardProgressBar = document.querySelector("#wizard-progress-bar");
const swapWizard = createContentSwapper(wizardContent, "x");
const wizardSteps = [
  { question: "你目前处于哪个年龄段？", options: ["18—25 岁", "26—35 岁", "36—45 岁", "46 岁及以上"] },
  { question: "你目前主要承担哪些家庭责任？", options: ["主要照顾自己", "需要照顾子女", "需要照顾父母", "同时照顾子女和父母"] },
  { question: "你目前是否有基本社会保险？", options: ["有职工社保", "有居民医保", "暂时没有", "不太清楚"] }
];
let wizardStep = 0;
const wizardAnswers = [];

function updateWizard() {
  if (wizardStep >= wizardSteps.length) {
    wizardContent.innerHTML = `<div class="wizard-result"><span>演示结果</span><h3>先了解基础保障，再看风险缺口</h3><p>你已完成 3 步示例问答。正式版本会依据选择解释关注原因，不提供产品推荐。</p><ul><li>先确认基本医保或社保状态</li><li>了解医疗费用的保障与报销规则</li><li>结合家庭责任了解意外与身故风险</li></ul><button class="secondary-button" id="wizard-restart" type="button">重新体验</button></div>`;
    document.querySelector("#wizard-restart").addEventListener("click", () => {
      wizardStep = 0;
      wizardAnswers.length = 0;
      renderWizard(-1);
    });
    return;
  }
  const step = wizardSteps[wizardStep];
  wizardContent.innerHTML = `<span class="wizard-step-label">第 ${wizardStep + 1} 步，共 3 步</span><p class="wizard-question">${step.question}</p><div class="wizard-options">${step.options.map(option => `<button type="button" data-answer="${option}">${option}</button>`).join("")}</div>`;
  wizardContent.querySelectorAll("[data-answer]").forEach(button => {
    button.addEventListener("click", () => {
      wizardAnswers[wizardStep] = button.dataset.answer;
      wizardStep += 1;
      renderWizard(1);
    });
  });
}

function renderWizard(direction = 1, immediate = false) {
  wizardProgressBar.style.transform = `scaleX(${((wizardStep + 1) / 4)})`;
  swapWizard(updateWizard, direction, immediate);
}

document.querySelector("#direction-open").addEventListener("click", () => {
  window.location.href = "direction.html";
});

const correctionDialog = document.querySelector("#correction-dialog");
document.querySelectorAll(".correction-open").forEach(button => {
  button.addEventListener("click", () => correctionDialog.showModal());
});

document.querySelectorAll("[data-close-dialog]").forEach(button => {
  button.addEventListener("click", () => button.closest("dialog").close());
});

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
