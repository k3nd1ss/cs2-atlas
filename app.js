'use strict';
const atlas = window.atlas;
const byId = id => document.getElementById(id);
const form = byId('filters');
const cards = byId('cards');
const detail = byId('detail');
const kinds = {call:'Колл',smoke:'Смок',flash:'Флешка',molotov:'Огонь'};
const zones = {A:'Плент A',B:'Плент B',M:'Мид'};
const aliases = [
  /\bwindow\b|окн[оауе]/i,
  /\bbanana\b|банан/i,
  /\bjungle\b|джангл|джунгл/i,
  /\bconnector\b|коннектор/i,
  /\bcoffins\b|гроб/i,
  /\bshort\b|шорт/i,
  /\blong\b|лонг|длин[ануы]/i,
  /\bpalace\b|палас|дворец/i,
  /\bramp\b|рамп/i,
  /\bsmokes?\b|смок|дым/i,
  /\bflash(?:bang)?s?\b|флеш|флэш/i,
  /\bmolotovs?\b|молотов|молик|зажигательн/i,
  /dust\s*(ii|2)|даст/i,
  /mirage|мираж/i,
  /inferno|инферно/i
];
const normalize = value => value.toLowerCase().replaceAll('ё','е');
const searchable = new Map(atlas.map(item => [item.id, normalize([
  item.id,item.title,item.map,item.side,kinds[item.kind],...item.zones.map(zone => zones[zone]),
  item.voice,item.when,item.how,item.alt,item.method,item.command,item.side === 'T' ? 'атака' : 'защита'
].filter(Boolean).join(' '))]));
const size = 24;
let page = 0;
function filterAtlas(filters) {
  const tokens = normalize(filters.q || '').trim().split(/\s+/).filter(Boolean);
  return atlas.filter(item => {
    if (filters.map && item.map !== filters.map) return false;
    if (filters.side && item.side !== filters.side) return false;
    if (filters.zone && !item.zones.includes(filters.zone)) return false;
    if (filters.kind === 'nade' ? item.kind === 'call' : filters.kind && item.kind !== filters.kind) return false;
    const haystack = searchable.get(item.id);
    return tokens.every(token => haystack.includes(token) ||
      aliases.some(alias => alias.test(token) && alias.test(haystack)));
  });
}
function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function badges(item) {
  const block = el('div', '', 'tags');
  block.append(el('span',item.map,'tag'),el('span',item.side,'tag '+item.side.toLowerCase()));
  for (const zone of item.zones) block.append(el('span',zones[zone],'tag'));
  block.append(el('span',kinds[item.kind],'tag'));
  return block;
}
function image(item, className) {
  const pic = el('img', '', className);
  pic.src = item.img;
  pic.alt = item.kind === 'call' ? item.caption : 'Игровой кадр для броска '+item.title;
  pic.decoding = 'async';
  if (className) pic.loading = 'lazy';
  return pic;
}
function external(label, url) {
  const link = el('a',label);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}
function showDetail(item) {
  const content = byId('detail-content');
  const title = el('h2',item.title);
  title.id = 'detail-title';
  const figure = el('figure');
  const caption = el('figcaption',item.caption+' · ');
  caption.append(external(item.kind === 'call' ? 'Источник изображения' : 'Оригинал с видео',item.source));
  figure.append(image(item),caption);
  content.replaceChildren(badges(item),title,figure);
  function section(label,body) {
    if (body) content.append(el('h3',label),el('p',body));
  }
  if (item.kind === 'call') {
    section('Колл в голосовом чате',item.voice);
    section('Когда использовать',item.when);
    section('Как разыграть',item.how);
    section('Если план меняется',item.alt);
  } else {
    section('Как бросить',item.method);
    section('Когда использовать',item.how);
    if (item.command) content.append(el('h3','Команда для тренировочного сервера'),el('pre',item.command));
  }
  detail.showModal();
  detail.scrollTop = 0;
}
function card(item) {
  const article = el('article','','card');
  const body = el('div','','body');
  const button = el('button','Открыть карточку','open');
  button.type = 'button';
  button.setAttribute('aria-label','Открыть карточку: '+item.title);
  button.addEventListener('click',()=>showDetail(item));
  body.append(badges(item),el('h2',item.title),el('p',item.voice || item.method),button);
  article.append(image(item,'art'),body);
  return article;
}
function render() {
  document.querySelectorAll('[data-map]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.map === form.elements.map.value)));
  const matching = filterAtlas(Object.fromEntries(new FormData(form)));
  const pages = Math.ceil(matching.length / size);
  page = Math.min(page,Math.max(0,pages-1));
  byId('status').textContent = 'Найдено: '+matching.length+' из '+atlas.length;
  cards.replaceChildren(...matching.slice(page*size,(page+1)*size).map(card));
  if (!matching.length) cards.append(el('p','По этим фильтрам ничего не найдено.','muted'));
  byId('page').textContent = (page+1)+' / '+pages;
  byId('prev').parentElement.hidden = pages <= 1;
  byId('prev').disabled = page === 0;
  byId('next').disabled = page+1 >= pages;
}
function filterChanged() { page = 0; render(); }
form.addEventListener('submit',event=>event.preventDefault());
form.addEventListener('input',filterChanged);
form.addEventListener('change',filterChanged);
byId('reset').addEventListener('click',()=>{form.reset();filterChanged();});
for (const [id,delta] of [['prev',-1],['next',1]]) {
  byId(id).addEventListener('click',()=>{page+=delta;render();byId('status').scrollIntoView({block:'center'});});
}
byId('close').addEventListener('click',()=>detail.close());
render();

document.querySelectorAll('[data-map]').forEach(button => button.addEventListener('click', () => { form.elements.map.value = button.dataset.map; filterChanged(); }));
