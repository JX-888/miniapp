(() => {
  const STORE = 'daily-reflection-layout-demo-v1';
  const now = new Date();
  const TODAY = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const cardCatalog = window.CARD_CATALOG || [];
  const cardSeries = window.CARD_SERIES || [];
  const prompts = [
    '哪件事值得明天继续保持？',
    '今天的一次沟通，有什么可以做得更好？',
    '今天你做对的一个决定是什么？',
    '如果重来一次，你会改变哪一个小动作？'
  ];
  const example = [
    ['2026-09-21','今天开会有点紧张。后来发现先把问题说清楚，比急着给出答案更有效。'],
    ['2026-09-22','把任务拆小以后，我终于开始做了第一步。'],
    ['2026-09-23','今天主动向同事求助，发现提问不是能力不足。'],
    ['2026-09-24','面对反馈时先听完，再决定下一步怎么改。']
  ];
  const echo = { title:'把改变拆小，让它更容易重复。', source:'《原子习惯》· 詹姆斯·克利尔', note:'概念摘述 · 非书中原句 · Demo 示例', explain:'你今天写下的，是一个可以继续尝试的小变化。复盘不必完美，重要的是下一次能想起这个发现。' };
  const MAX_STICKERS = 12;
  const stickerKinds = Object.fromEntries([
    ['smile','😊','开心','心情','快乐 高兴'],['calm','🌿','平静','自然','放松 安静'],['spark','✨','灵感','工作','闪光 发现'],['heart','💗','感谢','心情','喜欢 爱'],['cloud','☁️','有点累','心情','疲倦 阴天'],['paw','🐾','陪伴','生活','宠物 足迹'],
    ['grin','😄','大笑','心情','喜悦'],['laugh','😂','好笑','心情','有趣'],['relieved','😌','释然','心情','安心'],['love','🥰','被爱','心情','温暖'],['sad','😔','低落','心情','失落'],['cry','😢','难过','心情','伤心'],['proud','😎','自信','心情','骄傲'],['sleep','😴','想休息','心情','困 睡觉'],['hug','🫂','拥抱','心情','鼓励'],
    ['idea','💡','新想法','工作','创意'],['work','💻','工作','工作','电脑 职场'],['book','📚','学习','工作','阅读 书'],['memo','📝','记录','工作','笔记 复盘'],['target','🎯','目标','工作','计划'],['rocket','🚀','前进','工作','加油 成长'],['handshake','🤝','合作','工作','沟通 同事'],['check','✅','完成','工作','打卡 成功'],['clock','⏰','时间','工作','提醒'],
    ['coffee','☕','咖啡','生活','提神'],['tea','🍵','热茶','生活','喝茶'],['music','🎵','音乐','生活','听歌'],['cake','🍰','甜点','生活','蛋糕'],['gift','🎁','惊喜','生活','礼物'],['party','🎉','庆祝','生活','开心'],['cat','🐱','小猫','生活','宠物'],['dog','🐶','小狗','生活','宠物'],['walk','🚶','散步','生活','走路'],
    ['flower','🌸','花开','自然','春天'],['sun','☀️','阳光','自然','晴天'],['moon','🌙','月亮','自然','夜晚'],['rain','🌧️','下雨','自然','雨天'],['star','⭐','星星','自然','希望'],['fire','🔥','热情','自然','动力'],['leaf','🍃','新开始','自然','叶子'],['rainbow','🌈','彩虹','自然','美好'],['ocean','🌊','海浪','自然','海边']
  ].map(([id,icon,label,category,tags])=>[id,{icon,label,category,tags}]));
  const quickStickers = ['smile','calm','spark','heart','cloud','paw'];
  const stickerCategories = ['全部','心情','工作','生活','自然'];
  const pastedEmoji = text => {
    const value=String(text||'').trim();
    const clusters=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('zh',{granularity:'grapheme'}).segment(value)].map(item=>item.segment):Array.from(value);
    return clusters.length===1&&/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(value)?value:'';
  };
  const initial = () => ({ tab:'write', composerOpen:false, prompt:0, draft:'', stickers:[], stickerPickerOpen:false, stickerCategory:'全部', stickerSearch:'', records:Object.fromEntries(example.map(([date,text]) => [date,{text,echo}])), cardCollection:{}, cardFilter:'all', pendingMatch:null, reminder:false, archiveOpen:false, selectedMonth:'2026-09', modal:null, search:'', user:null, obStep:'login', obName:'', gender:'' });
  let state;
  try { state = { ...initial(), ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { state = initial(); }
  if(!Array.isArray(state.stickers)) state.stickers=[];
  if(!state.selectedMonth) state.selectedMonth='2026-09';
  if(typeof state.composerOpen!=='boolean') state.composerOpen=false;
  if(!state.cardCollection||typeof state.cardCollection!=='object') state.cardCollection={};
  if(!state.cardFilter) state.cardFilter='all';
  if(state.tab==='pet') state.tab='cards';
  const root = document.getElementById('app');
  const syncPetAnimation=()=>{};
  const persist = () => localStorage.setItem(STORE,JSON.stringify(state));
  const safe = text => String(text ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const date = key => { const [y,m,d]=key.split('-').map(Number); return new Date(y,m-1,d); };
  const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const add = (day,n) => {const d=date(day);d.setDate(d.getDate()+n);return key(d);};
  const dates = Object.keys(state.records);
  const hasToday = () => !!state.records[TODAY];
  const weekStart = add(TODAY,-((date(TODAY).getDay()+6)%7));
  const weekDays = Array.from({length:7},(_,i)=>add(weekStart,i));
  const weekCount = () => weekDays.filter(day=>state.records[day]).length;
  const monthCount = (month='2026-09') => Object.keys(state.records).filter(day=>day.startsWith(month)).length;
  const streak = () => {let day=hasToday()?TODAY:add(TODAY,-1),n=0;while(state.records[day]){n++;day=add(day,-1);}return n;};
  const monthOptions = ['2026-07','2026-08','2026-09','2026-10','2026-11'];
  const monthDays = month => {
    const [y,m]=month.split('-').map(Number);
    const total=new Date(y,m,0).getDate();
    return Array.from({length:total},(_,i)=>`${y}-${String(m).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`);
  };
  const monthTitle = month => { const [y,m]=month.split('-').map(Number); return `${y} 年 ${m} 月`; };
  const monthOptionLabel = month => { const [y,m]=month.split('-').map(Number); return `${y}年${m}月`; };
  const rangeDoneCount = days => days.filter(day=>state.records[day]).length;
  const gridOffset = days => (date(days[0]).getDay()+6)%7;
  const jigsawShape = (index,total,offset) => {
    const shapes = [
      {t:'out',r:'in',b:'out',l:'flat'},
      {t:'in',r:'out',b:'flat',l:'out'},
      {t:'out',r:'out',b:'in',l:'in'},
      {t:'flat',r:'in',b:'out',l:'out'},
      {t:'in',r:'flat',b:'out',l:'in'},
      {t:'out',r:'in',b:'in',l:'out'}
    ];
    const shape = { ...shapes[index % shapes.length] };
    const visualIndex = index + offset;
    const col = visualIndex % 7;
    const row = Math.floor(visualIndex / 7);
    const lastRow = Math.floor((offset + total - 1) / 7);
    if(col === 0) shape.l = 'flat';
    if(col === 6) shape.r = 'flat';
    if(row === 0) shape.t = 'flat';
    if(row === lastRow) shape.b = 'flat';
    return shape;
  };
  const jigsawPath = (index,total,offset) => {
    const s = jigsawShape(index,total,offset);
    const top = s.t === 'flat' ? 'L93 7' : s.t === 'out' ? 'L38 7 C38 -6 62 -6 62 7 L93 7' : 'L38 7 C38 20 62 20 62 7 L93 7';
    const right = s.r === 'flat' ? 'L93 93' : s.r === 'out' ? 'L93 38 C106 38 106 62 93 62 L93 93' : 'L93 38 C80 38 80 62 93 62 L93 93';
    const bottom = s.b === 'flat' ? 'L7 93' : s.b === 'out' ? 'L62 93 C62 106 38 106 38 93 L7 93' : 'L62 93 C62 80 38 80 38 93 L7 93';
    const left = s.l === 'flat' ? 'L7 7' : s.l === 'out' ? 'L7 62 C-6 62 -6 38 7 38 L7 7' : 'L7 62 C20 62 20 38 7 38 L7 7';
    return `M7 7 ${top} ${right} ${bottom} ${left} Z`;
  };
  const nav = () => `<nav class="nav" aria-label="底部导航">${[['write','写反思'],['cards','卡牌'],['calendar','日历拼图'],['profile','个人空间']].map(([id,label])=>`<button data-act="tab" data-value="${id}" class="${state.tab===id?'active':''}" aria-current="${state.tab===id?'page':'false'}">${label}</button>`).join('')}</nav>`;
  const onboard = () => state.obStep==='login'
    ? `<div class="onboard-hero"><div class="onboard-logo">DR</div><h1>每天复盘一点点</h1><p>写下今天的重要发现，让相似经历在时间里汇成一张不断成长的卡牌。</p><button class="wx-login" data-act="login"><span aria-hidden="true">✦</span>微信一键登录</button><p class="onboard-note">演示环境 · 不会真实调用微信授权</p></div>`
    : `<div class="onboard-form"><p class="eyebrow">CREATE PROFILE</p><h1>先认识一下你</h1><div class="ob-block"><label class="tiny-title" for="ob-name">你的昵称</label><input id="ob-name" class="ob-input" maxlength="12" placeholder="想被怎么称呼？" value="${safe(state.obName)}" aria-label="你的昵称" /></div><div class="ob-block"><span class="tiny-title">性别</span><div class="ob-gender">${['男','女','保密'].map(g=>`<button data-act="gender" data-value="${g}" class="${state.gender===g?'active':''}" aria-pressed="${state.gender===g}">${g}</button>`).join('')}</div></div><button class="main-action" data-act="start">确认，开始复盘 →</button><p class="onboard-note">卡牌会从你的反思中慢慢生长 · 昵称仅自己可见</p></div>`;
  const wxAvatar = () => `<div class="wx-avatar" role="img" aria-label="微信头像"><svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#E5E6EB"/><circle cx="24" cy="19" r="7.5" fill="#B9BCC4"/><path d="M9 43c1.8-7.5 7.9-11.5 15-11.5S37.2 35.5 39 43Z" fill="#B9BCC4"/></svg></div>`;
  const stickerMarks = () => state.stickers.map(s=>{
    const sticker=stickerKinds[s.kind]||(s.kind==='custom'&&pastedEmoji(s.icon)?{icon:s.icon,label:'自选表情'}:null);
    return sticker?`<button type="button" class="placed-sticker" data-sticker-id="${safe(s.id)}" style="left:${Math.max(7,Math.min(93,Number(s.x)||50))}%;top:${Math.max(10,Math.min(84,Number(s.y)||45))}%" aria-label="拖动${sticker.label}贴纸调整位置" title="拖动调整 · 点 × 移除"><span>${safe(sticker.icon)}</span><i data-remove-sticker="${safe(s.id)}" aria-label="移除贴纸">×</i></button>`:'';
  }).join('');
  const stickerResults = () => {
    const query=(state.stickerSearch||'').trim().toLowerCase();
    const matching=Object.entries(stickerKinds).filter(([,s])=>query?`${s.label} ${s.tags} ${s.category} ${s.icon}`.toLowerCase().includes(query):state.stickerCategory==='全部'||s.category===state.stickerCategory);
    const custom=pastedEmoji(query)&&!matching.some(([,s])=>s.icon===query)?`<button type="button" class="custom-sticker" data-sticker-kind="custom" data-icon="${safe(query)}" ${state.stickers.length>=MAX_STICKERS?'disabled':''}><span>${safe(query)}</span>把粘贴的 Emoji 贴上去 →</button>`:'';
    return `${custom}<div class="sticker-grid">${matching.map(([id,s])=>`<button type="button" class="sticker-choice" data-sticker-kind="${id}" aria-label="添加${s.label}贴纸" title="${s.label}" ${state.stickers.length>=MAX_STICKERS?'disabled':''}><span>${s.icon}</span><small>${s.label}</small></button>`).join('')}</div>${!matching.length&&!custom?'<p class="sticker-empty">没有找到，试试别的关键词，或粘贴一个 Emoji。</p>':''}`;
  };
  const stickerPicker = () => `<div class="sticker-library" id="sticker-library"><label class="sticker-search-label" for="sticker-search">搜索或粘贴 Emoji</label><input class="sticker-search" id="sticker-search" type="search" maxlength="40" autocomplete="off" placeholder="例如：开心、咖啡，或直接粘贴 🌻" value="${safe(state.stickerSearch)}" aria-label="搜索或粘贴表情"><div class="sticker-categories">${stickerCategories.map(category=>`<button type="button" data-act="stickerCategory" data-value="${category}" class="${state.stickerCategory===category?'active':''}" aria-pressed="${state.stickerCategory===category}">${category}</button>`).join('')}</div><div id="sticker-results" aria-live="polite">${stickerResults()}</div><p class="sticker-help">支持复制粘贴单个 Emoji；文字搜索不会发送到服务器。</p></div>`;
  const cardById = id => cardCatalog.find(card=>card.id===id);
  const understandingScore = text => ['因为','所以','意识到','发现','其实','本质','边界','以后','下一次','我会','不再','意味着','方法','规律'].filter(word=>text.includes(word)).length;
  const corePoint = text => (text.split(/[。！？\n]/).map(part=>part.trim()).filter(Boolean).sort((a,b)=>b.length-a.length)[0]||text).slice(0,52);
  const matchReflection = (text,day=TODAY) => {
    const normalized=text.toLowerCase();
    const ranked=cardCatalog.map(card=>{
      const hits=card.keywords.filter(word=>normalized.includes(word));
      const history=(state.cardCollection[card.id]?.reflections||[]).map(dateKey=>state.records[dateKey]?.text||'').join(' ');
      const overlap=card.keywords.filter(word=>history.includes(word)&&normalized.includes(word)).length;
      return {card,score:hits.length*4+overlap*3,hits};
    }).sort((a,b)=>b.score-a.score||a.card.id.localeCompare(b.card.id));
    if(!ranked[0]?.score){const seed=[...text].reduce((sum,char)=>sum+char.charCodeAt(0),0);ranked.unshift({card:cardCatalog[seed%cardCatalog.length],score:1,hits:[]});}
    return ranked.filter((item,index,list)=>list.findIndex(other=>other.card.id===item.card.id)===index).slice(0,3).map(({card,score,hits})=>{
      const owned=state.cardCollection[card.id];
      const depth=understandingScore(text);
      const canUpgrade=owned&&owned.level<3&&depth>=Math.max(2,owned.level+1);
      return {cardId:card.id,day,core:corePoint(text),confidence:Math.min(96,58+score*6),action:!owned?'new':canUpgrade?'upgrade':'progress',previousLevel:owned?.level||0,nextLevel:!owned?1:canUpgrade?owned.level+1:owned.level,reason:hits.length?`内容中的“${hits.slice(0,2).join('、')}”与「${card.name}」最接近。`:`这段反思的核心情绪与「${card.name}」最接近。`};
    });
  };
  const applyCardMatch = candidate => {
    const record=state.records[candidate.day];if(!record)return;
    const previous=record.cardMatch?.cardId;
    if(previous&&previous!==candidate.cardId&&state.cardCollection[previous]){
      state.cardCollection[previous].reflections=state.cardCollection[previous].reflections.filter(day=>day!==candidate.day);
      if(!state.cardCollection[previous].reflections.length)delete state.cardCollection[previous];
    }
    const owned=state.cardCollection[candidate.cardId]||{level:0,unlockedAt:candidate.day,updatedAt:candidate.day,reflections:[]};
    if(!owned.reflections.includes(candidate.day))owned.reflections.push(candidate.day);
    owned.level=Math.max(owned.level,candidate.nextLevel);owned.updatedAt=candidate.day;
    state.cardCollection[candidate.cardId]=owned;
    record.cardMatch={cardId:candidate.cardId,level:owned.level,core:candidate.core,reason:candidate.reason,confirmed:true,action:candidate.action};
    state.pendingMatch=null;persist();
  };
  const todayLabel = () => { const [y,m,d]=TODAY.split('-').map(Number); return `${y} 年 ${m} 月 ${d} 日`; };
  const recentReflections = () => {
    const items=Object.entries(state.records).sort(([a],[b])=>b.localeCompare(a)).slice(0,4);
    return items.length?items.map(([day,record])=>`<button class="recent-reflection" data-act="date" data-value="${day}"><span class="recent-date">${Number(day.slice(5,7))}月${Number(day.slice(-2))}日</span><span class="recent-copy"><strong>${safe(record.text.slice(0,18))}${record.text.length>18?'…':''}</strong><small>${safe(record.text.slice(18,62))}${record.text.length>62?'…':''}</small></span><span class="recent-arrow" aria-hidden="true">›</span></button>`).join(''):'<div class="recent-empty">完成第一次复盘后，记录会出现在这里。</div>';
  };
  const reflectionEditor = () => `<div class="card editor-card"><div class="editor-top"><div><span class="tiny-title">今日记录</span><strong>今天复盘</strong></div><span class="counter" id="count">${(state.draft||state.records[TODAY]?.text||'').length} / 500</span></div><div class="text-well" id="sticker-zone"><textarea id="reflection" maxlength="500" placeholder="写下今天的经历、决定、困难，以及你的思考……" aria-label="今天的复盘">${safe(state.draft||state.records[TODAY]?.text||'')}</textarea><div class="sticker-layer">${stickerMarks()}</div><span class="draft-note" id="draft-note">${state.draft?'草稿已保存':'私人记录 · 仅自己可见'}</span><button class="mic-button" id="micButton" data-act="mic" type="button" aria-label="语音输入" aria-pressed="false" title="语音输入">🎙</button></div><div class="sticker-tray"><div class="sticker-caption"><strong>给今天贴个心情</strong><span>${state.stickers.length>=MAX_STICKERS?'贴满啦，移除一枚再添加':`点选或拖进上方 · 最多 ${MAX_STICKERS} 枚`}</span></div><div class="sticker-options">${quickStickers.map(id=>`<button type="button" class="sticker-option" data-sticker-kind="${id}" aria-label="添加${stickerKinds[id].label}贴纸" title="${stickerKinds[id].label}" ${state.stickers.length>=MAX_STICKERS?'disabled':''}>${stickerKinds[id].icon}</button>`).join('')}</div><button type="button" class="sticker-more" data-act="stickerPicker" aria-controls="sticker-library" aria-expanded="${!!state.stickerPickerOpen}">${state.stickerPickerOpen?'收起表情库 ↑':`更多表情 · 搜索 / 粘贴 ${Object.keys(stickerKinds).length} 种 →`}</button>${state.stickerPickerOpen?stickerPicker():''}</div><button class="main-action" data-act="submit">${hasToday()?'保存修改 ✦':'完成今日复盘 ✦'}</button></div>`;
  const homeOverview = () => `<div class="home-page"><div class="home-head">${wxAvatar()}<div class="head-copy"><span class="head-date">${todayLabel()}</span><h1>今天，也照顾一下自己</h1></div><button class="icon-button add-reflection" data-act="openComposer" aria-label="写今日复盘" title="写今日复盘">+</button></div>
    <div class="overview-intro"><span>今日概览</span><strong>${hasToday()?'今天的复盘已经完成':'留一点时间，听听今天的自己'}</strong></div>
    <div class="two-up"><button class="prompt-box" data-act="prompt"><strong>今日提醒</strong><p>${safe(prompts[state.prompt])}</p><span>换一个提示 ↻</span></button><button class="puzzle-box" data-act="tab" data-value="calendar"><strong>本月拼图</strong><b>${monthCount()} / 30</b><span>查看打卡日历 →</span></button></div>
    <section class="card recent-section"><div class="section-heading"><div><span>回看</span><h2>之前的复盘</h2></div><button data-act="openArchive">查看全部</button></div><div class="recent-list">${recentReflections()}</div></section></div>`;
  const homeComposer = () => `<div class="home-page composer-page"><div class="composer-head"><button class="back-icon" data-act="closeComposer" aria-label="返回首页">‹</button><div><span class="head-date">${todayLabel()}</span><h1>${hasToday()?'修改今日复盘':'写下今日复盘'}</h1></div></div><button class="composer-prompt" data-act="prompt"><span>今日提醒</span><strong>${safe(prompts[state.prompt])}</strong><i>换一个 ↻</i></button>${reflectionEditor()}</div>`;
  const home = () => state.composerOpen?homeComposer():homeOverview();
  const calendar = () => {
    const days = monthDays(state.selectedMonth);
    const offset = gridOffset(days);
    const doneCount = rangeDoneCount(days);
    return `<div class="page-head"><div class="page-head-line"><button class="back-icon" data-act="tab" data-value="write" aria-label="返回首页">‹</button><div><p class="eyebrow">DAILY REFLECTION</p><h1>复盘日历 · 拼图版</h1></div></div><div class="stat-row"><div class="stat"><b>${streak()}天</b><span>连续复盘</span></div><div class="stat"><b>${Math.max(4,streak())}天</b><span>最长记录</span></div><div class="stat"><b>${Object.keys(state.records).length}次</b><span>累计记录</span></div></div></div>
      <div class="card monthly-card"><div class="row"><span>这个月已拼好 ${doneCount} / ${days.length} 块</span><span>${Math.round(doneCount/days.length*100)}%</span></div><div class="line-progress"><i style="width:${doneCount/days.length*100}%"></i></div></div>
      <div class="month-toolbar"><h2>${monthTitle(state.selectedMonth)}</h2><label class="month-select-wrap" aria-label="选择年月"><select id="month-select">${monthOptions.map(month=>`<option value="${month}" ${state.selectedMonth===month?'selected':''}>${monthOptionLabel(month)}</option>`).join('')}</select></label></div>
      <div class="calendar-body"><div class="weekdays">${'一二三四五六日'.split('').map(w=>`<span>${w}</span>`).join('')}</div><div class="calendar-grid">${'<span></span>'.repeat(offset)}${days.map((day,index)=>`<button data-act="date" data-value="${day}" class="day piece ${state.records[day]?'done':''} ${day==='2026-09-11'?'protected':''} ${day===TODAY?'today':''} ${day>TODAY?'future':''}" aria-label="${Number(day.slice(5,7))}月${Number(day.slice(-2))}日${state.records[day]?'已记录':'未记录'}"><svg class="piece-svg" viewBox="-8 -8 116 116" aria-hidden="true"><path d="${jigsawPath(index,days.length,offset)}"></path></svg><span class="day-label">${Number(day.slice(-2))}</span></button>`).join('')}</div></div>
      <div class="card mosaic"><strong>整月拼图预览</strong><div class="mosaic-row">${days.map(day=>`<i class="${state.records[day]?'done':''}"></i>`).join('')}</div><p>完成越多，图案越清晰 · 不含任何复盘原文</p></div>`;
  };
  const pet = () => `<div class="page-head"><div class="page-head-line"><button class="back-icon" data-act="tab" data-value="write" aria-label="返回首页">‹</button><div><p class="eyebrow">YOUR COMPANION</p><h1>今天也和${state.pet==='cat'?'布偶猫猫':'柴柴狗狗'}待一会儿</h1></div></div></div><div class="room-stage pet-${state.petSpot}" aria-label="宠物的小房间"><img class="room-bg" src="assets/room.png" alt="温馨的小房间" /><button class="room-hotspot sofa-hotspot" data-act="petSpot" data-value="sofa" aria-label="让${state.pet==='cat'?'小猫':'小狗'}去沙发"></button><button class="room-hotspot tower-hotspot" data-act="petSpot" data-value="tower" aria-label="让${state.pet==='cat'?'小猫':'小狗'}去猫爬架"></button><button class="room-hotspot floor-hotspot" data-act="petSpot" data-value="roam" aria-label="让${state.pet==='cat'?'小猫':'小狗'}继续走动"></button><div class="room-pet-wrap" data-act="petCheer" role="button" tabindex="0" aria-label="摸摸${state.pet==='cat'?'布偶猫猫':'柴柴狗狗'}"><img class="room-pet" src="${state.pet==='cat'?'assets/cat-idle.png':'assets/dog.png'}" alt="${state.pet==='cat'?'布偶猫猫':'柴柴狗狗'}" />${state.claimed?'<span class="pet-scarf" aria-hidden="true">🧣</span>':''}</div><button class="room-bowl bowl-food ${state.fed.food?'fed':''}" data-act="feed" data-value="food" ${!hasToday()||state.fed.food?'disabled':''} aria-label="喂今天的食物"><img src="assets/bowl_food.png" alt="饭盆" /></button><button class="room-bowl bowl-water ${state.fed.water?'fed':''}" data-act="feed" data-value="water" ${!hasToday()||state.fed.water?'disabled':''} aria-label="给今天的水"><img src="assets/bowl_water.png" alt="水盆" /></button></div><div class="feed-row"><button data-act="feed" data-value="food" ${!hasToday()||state.fed.food?'disabled':''}><span class="feed-icon feed-food" aria-hidden="true"></span>食物 ${supplyCount('food')} 份</button><button data-act="feed" data-value="water" ${!hasToday()||state.fed.water?'disabled':''}><span class="feed-icon feed-water" aria-hidden="true"></span>水 ${supplyCount('water')} 份</button></div><div class="card reward"><h3>本周连续复盘 5 天</h3><p>真实记录才算数，保护日不会计算在内。</p><div class="weekly">${weekDays.map(d=>`<span class="${state.records[d]?'done':''} ${d===TODAY?'today':''}">${state.records[d]?'✓':Number(d.slice(-2))}</span>`).join('')}</div><div class="skin"><span class="emoji">🧣</span><div><strong>本周 · 软软小围巾</strong><small>${state.claimed?'已领取 · 永久保留':weekCount()>=5?'已达成，可以领取':'还差 '+(5-weekCount())+' 天'}</small></div><button data-act="claim" ${weekCount()<5||state.claimed?'disabled':''}>${state.claimed?'已穿戴':'领取'}</button></div></div>`;
  const cardsPage = () => {
    const owned=Object.keys(state.cardCollection).length;
    const filtered=(state.cardFilter==='all'?cardCatalog:cardCatalog.filter(card=>card.seriesId===state.cardFilter)).slice().sort((a,b)=>Number(!!state.cardCollection[b.id])-Number(!!state.cardCollection[a.id]));
    const maxed=Object.values(state.cardCollection).filter(card=>card.level===3).length;
    return `<div class="card-page"><div class="card-page-head"><p class="eyebrow">REFLECTION DECK</p><h1>我的成长卡册</h1><p>每一次更深的理解，都会让同一张卡继续生长。</p><div class="deck-stats"><span><b>${owned}</b><small>已解锁 / 64</small></span><span><b>${maxed}</b><small>已满级</small></span><span><b>${Object.values(state.cardCollection).reduce((sum,item)=>sum+item.reflections.length,0)}</b><small>关联反思</small></span></div></div><div class="series-tabs"><button data-act="cardFilter" data-value="all" class="${state.cardFilter==='all'?'active':''}">全部</button>${cardSeries.map(series=>`<button data-act="cardFilter" data-value="${series.id}" class="${state.cardFilter===series.id?'active':''}" style="--series:${series.color}">${series.name}</button>`).join('')}</div><div class="card-grid">${filtered.map(card=>{const item=state.cardCollection[card.id],level=item?.level||0;return `<button class="collection-card ${level?'owned':'locked'}" data-act="cardDetail" data-value="${card.id}" style="--series:${card.color}" aria-label="${card.seriesName}系列 ${card.name} ${level?`等级${level}`:'未解锁'}">${level?`<img src="${card.levels[level-1].image}" alt="${card.name} Lv.${level}">`:`<span class="card-back">✦</span>`}<span><b>${card.name}</b><small>${card.seriesName} · ${level?`Lv.${level}`:'未解锁'}</small></span></button>`;}).join('')}</div></div>`;
  };
  const profile = () => `<div class="page-head"><div class="page-head-line"><button class="back-icon" data-act="tab" data-value="write" aria-label="返回首页">‹</button><div><p class="eyebrow">YOUR OWN SPACE</p><h1>我的</h1></div></div></div>
    <div class="user-chip"><div class="user-avatar">${safe([...(state.user?.name||'朋友')][0])}</div><div><strong>${safe(state.user?.name||'朋友')}</strong><small>${safe(state.user?.gender||'保密')} · 正在收集自己的成长轨迹</small></div></div>
    <div class="stat-row profile-stats"><div class="stat"><b>${Object.keys(state.records).length}</b><span>累计记录</span></div><div class="stat"><b>${streak()}</b><span>连续天数</span></div><div class="stat"><b>${Object.keys(state.cardCollection).length}</b><span>已解锁卡牌</span></div></div>
    <h2 class="section-title">我的记录</h2><div class="card profile-list"><button class="profile-row" data-act="archive" aria-expanded="${!!state.archiveOpen}" aria-controls="archive-panel"><span class="row-symbol archive-symbol" aria-hidden="true">▤</span><span class="row-copy"><strong>全部反思</strong><small>${Object.keys(state.records).length} 篇记录 · 搜索与回看</small></span><span class="row-chevron ${state.archiveOpen?'open':''}" aria-hidden="true">⌄</span></button>${state.archiveOpen?`<div class="archive-panel" id="archive-panel"><input class="search" id="search" type="search" placeholder="搜索你写过的关键词" aria-label="搜索反思" value="${safe(state.search)}"><div id="entries">${entries()}</div></div>`:''}</div>
    <h2 class="section-title">偏好与设置</h2><div class="card profile-list"><div class="profile-row reminder-row"><span class="row-symbol notice-symbol" aria-hidden="true">◷</span><span class="row-copy"><strong>22:00 晚间提醒</strong><small>当天未复盘时提醒一次 · 演示开关</small></span><button class="toggle ${state.reminder?'on':''}" data-act="reminder" role="switch" aria-checked="${state.reminder}" aria-label="晚间提醒"></button></div><button class="profile-row" data-act="info" data-value="privacy"><span class="row-symbol privacy-symbol" aria-hidden="true">◇</span><span class="row-copy"><strong>隐私设置</strong><small>记录可见范围与共鸣处理说明</small></span><span class="row-chevron" aria-hidden="true">›</span></button><button class="profile-row" data-act="info" data-value="data"><span class="row-symbol data-symbol" aria-hidden="true">▥</span><span class="row-copy"><strong>数据管理</strong><small>查看本地演示数据与清除入口</small></span><span class="row-chevron" aria-hidden="true">›</span></button></div><p class="profile-footnote">Daily Reflection · 演示版本</p>`;
  function entries(){ const items=Object.entries(state.records).sort(([a],[b])=>b.localeCompare(a)).filter(([,r])=>r.text.includes(state.search));return items.length?items.map(([d,r])=>`<button class="entry" data-act="date" data-value="${d}"><strong>${Number(d.slice(5,7))}月${Number(d.slice(-2))}日 · 查看当日</strong><p>${safe(r.text.slice(0,70))}${r.text.length>70?'…':''}</p></button>`).join(''):'<p style="font-size:12px;color:var(--muted)">没有找到相关的反思记录。</p>'; }
  const modal = () => {
    if(!state.modal) return '';
    let body='',label='TODAY’S CARD',title='今日复盘卡';
    if(state.modal.kind==='loading'){ label='MATCHING'; title='想法正在相遇'; body='<div class="orbit">✦</div><p style="text-align:center">正在生成你的今日复盘卡……</p>'; }
    if(state.modal.kind==='cardMatch'){const pending=state.pendingMatch,candidate=pending?.candidates[pending.index||0],card=candidate&&cardById(candidate.cardId);if(card){label='REFLECTION CARD';title=candidate.action==='new'?'发现一张新的成长卡':candidate.action==='upgrade'?`卡牌升级为 Lv.${candidate.nextLevel}`:'这段经历找到了归处';body=`<div class="card-reveal ${candidate.action==='upgrade'?'upgrading':''}" style="--series:${card.color}"><img src="${card.levels[candidate.nextLevel-1].image}" alt="${card.name} Lv.${candidate.nextLevel}"><div class="match-copy"><span>${card.seriesName}系列 · ${card.tagline}</span><h3>${card.name} · Lv.${candidate.nextLevel}</h3><blockquote>${safe(candidate.core)}</blockquote><p>${safe(candidate.reason)}</p><small>匹配度 ${candidate.confidence}% · ${candidate.action==='progress'?'已加入成长轨迹':'确认后收入卡册'}</small></div><div class="match-actions"><button class="ghost-action" data-act="alternateCard">换一张</button><button class="main-action" data-act="confirmCard">${candidate.action==='new'?'确认收藏':candidate.action==='upgrade'?'确认升级':'加入轨迹'}</button></div></div>`;}}
    if(state.modal.kind==='cardDetail'){const card=cardById(state.modal.cardId),owned=state.cardCollection[state.modal.cardId];if(card){label=`${card.seriesName.toUpperCase()} SERIES`;title=card.name;body=`<div class="card-detail" style="--series:${card.color}">${owned?`<img src="${card.levels[owned.level-1].image}" alt="${card.name} Lv.${owned.level}">`:'<div class="detail-card-back">✦</div>'}<div class="level-track">${[1,2,3].map(level=>`<span class="${owned?.level>=level?'done':''}">Lv.${level}</span>`).join('')}</div><p>${owned?`目前成长到 Lv.${owned.level}，共关联 ${owned.reflections.length} 次反思。`:'这张卡还未被你的反思唤醒。'}</p>${owned?`<div class="reflection-timeline">${owned.reflections.map(day=>`<button data-act="date" data-value="${day}"><b>${Number(day.slice(5,7))}月${Number(day.slice(-2))}日</b><span>${safe(state.records[day]?.cardMatch?.core||state.records[day]?.text?.slice(0,42)||'')}</span></button>`).join('')}</div>`:''}</div>`;}}
    if(state.modal.kind==='date'){ label='YOUR REFLECTION'; const r=state.records[state.modal.day];title=`${Number(state.modal.day.slice(5,7))}月${Number(state.modal.day.slice(-2))}日 · 当日反思`;body=r?`<p class="original">${safe(r.text)}</p><div class="quote"><blockquote>${safe(r.echo?.title||'正在寻找共鸣')}</blockquote><cite>${safe(r.echo?.source||'')}</cite></div>`:'<p>这一天没有留下复盘。没有补签，从今天继续也很好。</p>';}
    if(state.modal.kind==='privacy'){label='PRIVACY';title='隐私设置';body='<div class="info-list"><div><strong>你的复盘默认私密</strong><p>这个浏览器 Demo 将输入、贴纸与记录保存在本机浏览器中，不会同步到微信或云端。</p></div><div><strong>共鸣内容的边界</strong><p>目前展示的是固定演示摘述，不会把你的文字发送给 AI，也不提供诊断或专业建议。</p></div></div>';}
    if(state.modal.kind==='data'){label='YOUR DATA';title='数据管理';body=`<div class="info-list"><div><strong>本机演示数据</strong><p>当前有 ${Object.keys(state.records).length} 篇记录和 ${Object.keys(state.cardCollection).length} 条卡牌成长线。正式版的跨设备同步、导出与删除能力尚未接入。</p></div><div><strong>重新开始演示</strong><p>可清除这台浏览器保存的昵称、草稿、贴纸、记录和卡牌状态；操作前会再次确认。</p></div></div><button class="data-reset" data-act="reset">清除本机演示数据</button>`;}
    return `<div class="overlay" data-act="close"><div class="sheet" role="dialog" aria-modal="true"><div class="sheet-head"><div><small>${label}</small>${title?`<h2>${title}</h2>`:''}</div><button data-act="close" aria-label="关闭">×</button></div>${body}</div></div>`;
  };
  function render(keepScroll=false){ const scroll=keepScroll?root.querySelector('.content')?.scrollTop||0:0;if(!state.user){root.innerHTML=`<div class="viewport onboard-viewport">${onboard()}${modal()}</div>`;return;} const pages={write:home,cards:cardsPage,calendar,profile};root.innerHTML=`<div class="viewport"><main class="content" id="content">${pages[state.tab]?.()||home()}</main>${nav()}${modal()}</div>`;if(keepScroll)root.querySelector('.content').scrollTop=scroll; }
  root.addEventListener('click',event=>{
    const remove=event.target.closest('[data-remove-sticker]');
    if(remove){state.stickers=state.stickers.filter(s=>s.id!==remove.dataset.removeSticker);persist();render();return;}
    const keyboardSticker=event.target.closest('[data-sticker-kind]');
    if(keyboardSticker&&event.detail===0&&state.stickers.length<MAX_STICKERS){addSticker(keyboardSticker.dataset.stickerKind,{x:71-(state.stickers.length%3)*17,y:56+Math.floor(state.stickers.length/3)*10},keyboardSticker.dataset.icon);return;}
    const target=event.target.closest('[data-act]');if(!target)return;
    const act=target.dataset.act,val=target.dataset.value;
    if(act==='login'){state.obStep='profile';persist();render();return;}
    if(act==='gender'){state.gender=val;persist();render();return;}
    if(act==='start'){const name=document.getElementById('ob-name')?.value.trim()||'朋友';state.user={name,gender:state.gender||'保密'};state.obName=name;state.tab='write';persist();render();return;}
    if(act==='tab'){state.tab=val;state.modal=null;if(val==='profile')state.archiveOpen=false;persist();render();return;}
    if(act==='openComposer'){state.composerOpen=true;persist();render();setTimeout(()=>document.getElementById('reflection')?.focus(),0);return;}
    if(act==='closeComposer'){state.composerOpen=false;state.stickerPickerOpen=false;persist();render();return;}
    if(act==='openArchive'){state.tab='profile';state.archiveOpen=true;persist();render();return;}
    if(act==='cardFilter'){state.cardFilter=val;persist();render();return;}
    if(act==='cardDetail'){state.modal={kind:'cardDetail',cardId:val};render();return;}
    if(act==='alternateCard'){if(state.pendingMatch?.candidates?.length){state.pendingMatch.index=((state.pendingMatch.index||0)+1)%state.pendingMatch.candidates.length;persist();render();}return;}
    if(act==='confirmCard'){const candidate=state.pendingMatch?.candidates?.[state.pendingMatch.index||0];if(candidate){applyCardMatch(candidate);state.modal={kind:'cardDetail',cardId:candidate.cardId};state.composerOpen=false;render();}return;}
    if(act==='archive'){state.archiveOpen=!state.archiveOpen;persist();render();return;}
    if(act==='stickerPicker'){state.stickerPickerOpen=!state.stickerPickerOpen;persist();render(true);return;}
    if(act==='stickerCategory'){state.stickerCategory=val;persist();render(true);return;}
    if(act==='info'){state.modal={kind:val};render();return;}
    if(act==='prompt'){state.prompt=(state.prompt+1)%prompts.length;persist();render();return;}
    if(act==='date'){state.modal={kind:'date',day:val};render();return;}
    if(act==='close'){if(target.classList.contains('overlay')&&target!==event.target)return;const completed=state.modal?.kind==='done';state.modal=null;if(completed)state.composerOpen=false;persist();render();return;}
    if(act==='reminder'){state.reminder=!state.reminder;persist();render();return;}
    if(act==='reset'){if(!window.confirm('重新开始演示？本浏览器里的演示输入会清除。'))return;state=initial();persist();render();return;}
    if(act==='mic'){toggleMic();return;}
    if(act==='submit'){const text=document.getElementById('reflection')?.value.trim();if(!text){document.getElementById('reflection')?.focus();return;}const previous=state.records[TODAY]?.cardMatch;state.records[TODAY]={text,echo,cardMatch:previous};state.draft='';state.pendingMatch={day:TODAY,index:0,candidates:matchReflection(text,TODAY)};persist();state.modal={kind:'loading'};render();setTimeout(()=>{if(state.modal?.kind==='loading'&&state.pendingMatch){state.modal={kind:'cardMatch'};render();}},900);}
  });
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const coordinates=(zone,x,y)=>{const r=zone.getBoundingClientRect();return {x:clamp((x-r.left)/r.width*100,7,93),y:clamp((y-r.top)/r.height*100,10,84)};};
  const addSticker=(kind,pos,icon)=>{if(state.stickers.length>=MAX_STICKERS||!stickerKinds[kind]&&!(kind==='custom'&&pastedEmoji(icon)))return;state.stickers.push({id:`s${Date.now()}-${Math.random().toString(36).slice(2,6)}`,kind,...(kind==='custom'?{icon}:{}),...pos});persist();render(true);};
  let stickerDrag=null;
  root.addEventListener('pointerdown',event=>{
    const origin=event.target.closest('[data-sticker-kind], [data-sticker-id]');
    if(!origin||event.target.closest('[data-remove-sticker]'))return;
    const kind=origin.dataset.stickerKind, id=origin.dataset.stickerId;
    if(kind&&state.stickers.length>=MAX_STICKERS)return;
    stickerDrag={origin,kind,id,icon:origin.dataset.icon,startX:event.clientX,startY:event.clientY,moved:false};
    origin.setPointerCapture(event.pointerId);
    if(id){origin.classList.add('moving');event.preventDefault();}
  });
  root.addEventListener('pointermove',event=>{
    if(!stickerDrag)return;
    const drag=stickerDrag;
    if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>5)drag.moved=true;
    if(!drag.moved)return;
    if(drag.id){const zone=document.getElementById('sticker-zone');if(!zone)return;const pos=coordinates(zone,event.clientX,event.clientY);drag.origin.style.left=`${pos.x}%`;drag.origin.style.top=`${pos.y}%`;}
    else {if(!drag.ghost){drag.ghost=document.createElement('span');drag.ghost.className='sticker-ghost';drag.ghost.textContent=stickerKinds[drag.kind]?.icon||drag.icon;document.body.appendChild(drag.ghost);}drag.ghost.style.left=`${event.clientX}px`;drag.ghost.style.top=`${event.clientY}px`;}
  });
  const finishSticker=event=>{
    if(!stickerDrag)return;
    const drag=stickerDrag;stickerDrag=null;
    drag.origin.classList.remove('moving');drag.ghost?.remove();
    const zone=document.getElementById('sticker-zone');if(!zone)return;
    const rect=zone.getBoundingClientRect();
    const inside=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
    if(drag.id){const placed=state.stickers.find(s=>s.id===drag.id);if(placed&&drag.moved){Object.assign(placed,coordinates(zone,event.clientX,event.clientY));persist();render(true);}return;}
    if(!drag.kind||!stickerKinds[drag.kind]&&!(drag.kind==='custom'&&pastedEmoji(drag.icon))||state.stickers.length>=MAX_STICKERS||(drag.moved&&!inside))return;
    const pos=drag.moved?coordinates(zone,event.clientX,event.clientY):{x:71-(state.stickers.length%3)*17,y:56+Math.floor(state.stickers.length/3)*10};
    addSticker(drag.kind,pos,drag.icon);
  };
  root.addEventListener('pointerup',finishSticker);
  root.addEventListener('pointercancel',()=>{stickerDrag?.ghost?.remove();stickerDrag?.origin?.classList.remove('moving');stickerDrag=null;});
  let recognition=null,listening=false;
  function setMic(on){const b=document.getElementById('micButton');if(!b)return;b.classList.toggle('recording',on);b.setAttribute('aria-pressed',on);}
  function toggleMic(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert('当前浏览器不支持语音输入，可以直接打字。');return;}
    if(listening){recognition.stop();return;}
    recognition=new SR();
    recognition.lang='zh-CN';recognition.interimResults=false;recognition.continuous=false;
    recognition.onstart=()=>{listening=true;setMic(true);};
    recognition.onend=()=>{listening=false;setMic(false);};
    recognition.onerror=()=>{listening=false;setMic(false);};
    recognition.onresult=e=>{const text=[...e.results].map(r=>r[0].transcript).join('');const ta=document.getElementById('reflection');if(ta&&text){ta.value+=text;ta.dispatchEvent(new Event('input',{bubbles:true}));}};
    recognition.start();
  }
  root.addEventListener('input',event=>{
    if(event.target.id==='sticker-search'){state.stickerSearch=event.target.value;persist();document.getElementById('sticker-results').innerHTML=stickerResults();}
    if(event.target.id==='month-select'){state.selectedMonth=event.target.value;persist();render();}
    if(event.target.id==='reflection'){state.draft=event.target.value;persist();document.getElementById('count').textContent=`${state.draft.length} / 500`;document.getElementById('draft-note').textContent='草稿已自动保存';}
    if(event.target.id==='ob-name'){state.obName=event.target.value;persist();}
    if(event.target.id==='search'){state.search=event.target.value;persist();document.getElementById('entries').innerHTML=entries();}
  });
  render();
})();
