const currentPage = document.body.dataset.page || "home";
const pageLabels = { home: "首页", direction: "险种查询", dictionary: "大白话词典", pitfalls: "避坑指南", claims: "理赔流程" };
const photoLinks = {
  direction: "https://www.pexels.com/photo/antique-compass-on-a-table-6593994/",
  dictionary: "https://www.pexels.com/photo/open-books-on-a-wooden-surface-11197155/",
  pitfalls: "https://www.pexels.com/photo/selective-focus-photo-of-terms-and-conditions-written-on-a-paper-7821937/",
  claims: "https://www.pexels.com/photo/person-working-on-documents-7821540/"
};
const navGroups = [
  { id: "home", label: "首页", href: "index.html" },
  { id: "direction", label: "险种查询", href: "direction.html", children: [
    { id: "wizard", label: "按问题找方向", href: "direction.html?view=wizard", key: "view" },
    { id: "tree", label: "看险种分类", href: "direction.html?view=tree", key: "view" }
  ] },
  { id: "pitfalls", label: "避坑指南", href: "pitfalls.html", children: [
    { id: "yield", label: "收益承诺", href: "pitfalls.html?scenario=yield", key: "scenario" },
    { id: "coverage", label: "保障范围", href: "pitfalls.html?scenario=coverage", key: "scenario" },
    { id: "health", label: "健康告知", href: "pitfalls.html?scenario=health", key: "scenario" }
  ] },
  { id: "dictionary", label: "大白话词典", href: "dictionary.html", children: [
    { id: "免赔额", label: "免赔额", href: "dictionary.html?term=免赔额", key: "term" },
    { id: "等待期", label: "等待期", href: "dictionary.html?term=等待期", key: "term" },
    { id: "健康告知", label: "健康告知", href: "dictionary.html?term=健康告知", key: "term" },
    { id: "免责条款", label: "免责条款", href: "dictionary.html?term=免责条款", key: "term" }
  ] },
  { id: "claims", label: "理赔流程", href: "claims.html", children: [
    { id: "医疗险", label: "医疗险", href: "claims.html?type=医疗险", key: "type" },
    { id: "重疾险", label: "重疾险", href: "claims.html?type=重疾险", key: "type" },
    { id: "意外险", label: "意外险", href: "claims.html?type=意外险", key: "type" }
  ] }
];
const params = new URLSearchParams(window.location.search);

function isChildActive(group, child) {
  if (group.id !== currentPage || !child.key) return false;
  const defaults = { direction: "wizard", pitfalls: "yield", claims: "医疗险", dictionary: "免赔额" };
  return params.get(child.key) === child.id || (!params.has(child.key) && defaults[group.id] === child.id);
}

function buildNavMarkup() {
  return navGroups.map(group => {
    const expanded = group.id === currentPage;
    return `<div class="nav-group${expanded ? " open" : ""}" data-nav-group="${group.id}">
      <div class="nav-parent-row">
        <a class="nav-parent${group.id === currentPage ? " active" : ""}" href="${group.href}"${group.id === currentPage ? ' aria-current="page"' : ""}>${group.label}</a>
        ${group.children ? `<button class="nav-expand" type="button" aria-expanded="${expanded}" aria-label="${expanded ? "收起" : "展开"}${group.label}"><svg><use href="icons.svg#i-chevron"></use></svg></button>` : ""}
      </div>
      ${group.children ? `<div class="nav-children"${expanded ? "" : " hidden"}>${group.children.map(child => `<a class="nav-child${isChildActive(group, child) ? " active" : ""}" href="${child.href}">${child.label}</a>`).join("")}</div>` : ""}
    </div>`;
  }).join("");
}

const sidebar = document.createElement("aside");
sidebar.className = "sidebar-nav";
sidebar.setAttribute("aria-label", "子模块导航");
sidebar.innerHTML = `<div class="sidebar-title">功能导航</div><nav>${buildNavMarkup()}</nav><p class="sidebar-note">纯公益 · 无广告 · 无登录</p>`;
document.querySelector(".site-header").after(sidebar);

const floatingButton = document.createElement("button");
floatingButton.type = "button";
floatingButton.className = "floating-menu-button";
floatingButton.setAttribute("aria-label", "打开功能菜单");
floatingButton.innerHTML = `<svg aria-hidden="true"><use href="icons.svg#i-menu"></use></svg><span>功能菜单</span>`;
document.body.append(floatingButton);

const menuDialog = document.createElement("dialog");
menuDialog.className = "overlay-menu";
menuDialog.setAttribute("aria-labelledby", "overlay-menu-title");
menuDialog.innerHTML = `
  <button class="dialog-close icon-button" type="button" data-overlay-close aria-label="关闭功能菜单"><svg><use href="icons.svg#i-close"></use></svg></button>
  <p class="overlay-kicker">当前页面：${pageLabels[currentPage]}</p>
  <h2 id="overlay-menu-title">功能导航</h2>
  <nav class="overlay-menu-list" aria-label="功能菜单">${buildNavMarkup()}</nav>
  <button class="menu-info-button" id="menu-info-open" type="button"><svg><use href="icons.svg#i-info"></use></svg>平台与页面说明</button>`;
document.body.append(menuDialog);

const infoDialog = document.createElement("dialog");
infoDialog.className = "page-info-dialog";
infoDialog.setAttribute("aria-labelledby", "page-info-title");
infoDialog.innerHTML = `
  <button class="dialog-close icon-button" type="button" data-overlay-close aria-label="关闭页面说明"><svg><use href="icons.svg#i-close"></use></svg></button>
  <div class="dialog-badge"><svg><use href="icons.svg#i-shield"></use></svg>纯公益保险科普</div>
  <h2 id="page-info-title">平台与页面说明</h2>
  <dl class="page-info-list">
    <div><dt>服务边界</dt><dd>只做知识科普，不推荐具体产品，不提供投保代办，不承诺理赔结果。</dd></div>
    <div><dt>内容与隐私</dt><dd>当前为界面评审原型，示例内容仅供参考。无需登录，不收集敏感隐私。</dd></div>
    ${photoLinks[currentPage] ? `<div><dt>图片素材</dt><dd>本页照片来自 <a href="${photoLinks[currentPage]}" target="_blank" rel="noopener">Pexels 免费图库</a>。</dd></div>` : ""}
  </dl>
  <button class="secondary-button" id="info-correction-open" type="button">我要纠错</button>`;
document.body.append(infoDialog);

document.addEventListener("click", event => {
  const toggle = event.target.closest(".nav-expand");
  if (!toggle) return;
  const group = toggle.closest(".nav-group");
  const children = group.querySelector(".nav-children");
  const expanded = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(expanded));
  group.classList.toggle("open", expanded);
  children.hidden = !expanded;
});

floatingButton.addEventListener("click", () => menuDialog.showModal());
document.querySelector("#menu-info-open").addEventListener("click", () => { menuDialog.close(); infoDialog.showModal(); });
infoDialog.addEventListener("close", () => floatingButton.focus());
document.querySelector("#info-correction-open").addEventListener("click", () => { infoDialog.close(); document.querySelector("#correction-dialog").showModal(); });
document.querySelectorAll("[data-overlay-close]").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
menuDialog.querySelectorAll("a").forEach(link => link.addEventListener("click", () => menuDialog.close()));
[menuDialog, infoDialog].forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });
});
