/* ============================================================
   Fullscreen lightbox (live build; kept in the repo so rebuilds never drop it) — click a gallery photo to
   open it full screen; arrows / keyboard / swipe to move; ESC or
   tap-outside to close. Soft eased slide between photos.
   Self-contained: no markup changes, reads the existing thumbnails.
   ============================================================ */
(function () {
  var main = document.querySelector('.vp-main');
  var thumbs = document.getElementById('vp-thumbs');
  if (!main || !thumbs) return;
  var btns = Array.prototype.slice.call(thumbs.querySelectorAll('.thumbbtn'));
  if (!btns.length) return;
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!main.querySelector('.vp-zoomhint')) {
    var hint = document.createElement('div');
    hint.className = 'vp-zoomhint';
    hint.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/></svg>';
    main.appendChild(hint);
    var HR = 29, tx = 0, ty = 0, cx = 0, cy = 0, inside = false, raf = null, seeded = false;
    var loop = function () {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      hint.style.transform = 'translate(' + (cx - HR) + 'px,' + (cy - HR) + 'px)';
      if (inside || Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) raf = requestAnimationFrame(loop);
      else raf = null;
    };
    var track = function (e) { var r = main.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; if (!raf) raf = requestAnimationFrame(loop); };
    main.addEventListener('mouseenter', function (e) { track(e); if (!seeded) { cx = tx; cy = ty; seeded = true; } inside = true; hint.style.opacity = '1'; });
    main.addEventListener('mousemove', track);
    main.addEventListener('mouseleave', function () { inside = false; hint.style.opacity = '0'; });
  }
  var big = function (u) {
    return u.replace(/pxc_size=\d+,\d+/, 'pxc_size=1600,1067')
            .replace(/-640\.(jpg|png)$/, '-1600.$1')
            .replace(/_sm-rotated\.(jpg|png)$/, '-rotated.$1')
            .replace(/_sm\.(jpg|png)$/, '.$1');
  };
  var srcs = btns.map(function (b) {
    var sp = b.querySelector('span');
    var m = sp && sp.style.backgroundImage.match(/url\("?(.*?)"?\)/);
    return m ? big(m[1]) : '';
  });
  var n = srcs.length;

  var css = document.createElement('style');
  css.textContent = [
    '@media(hover:hover){.vp-main,.vp-main img{cursor:none}}',
    '.wl-lb{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;',
      'background:rgba(8,10,12,.94);opacity:0;transition:opacity .28s cubic-bezier(.23,1,.32,1);touch-action:none}',
    '.wl-lb.on{opacity:1}',
    '.wl-lb-stage{position:absolute;inset:0;overflow:hidden}',
    '.wl-lb-img{position:absolute;inset:0;margin:auto;max-width:92vw;max-height:88vh;width:auto;height:auto;',
      'object-fit:contain;user-select:none;-webkit-user-drag:none;will-change:transform,opacity}',
    '.wl-lb-btn{position:absolute;top:50%;transform:translateY(-50%);width:56px;height:56px;border-radius:50%;',
      "background:#fff;border:1px solid #E4E1DC;cursor:pointer;display:flex;align-items:center;justify-content:center;",
      "font:400 30px/1 'Gordita',sans-serif;color:#12171C!important;z-index:2;",
      'transition:transform .16s cubic-bezier(.23,1,.32,1)}',
    '.wl-lb-btn:hover,.wl-lb-btn:focus{background:#DB7627;border-color:#DB7627;color:#fff!important;outline:none}',
    '.wl-lb-btn:active{background:#DB7627;border-color:#DB7627;color:#fff!important;transform:translateY(-50%) scale(.94)}',
    '.wl-lb-prev{left:22px}.wl-lb-next{right:22px}',
    '.wl-lb-close{position:absolute;top:20px;right:22px;width:48px;height:48px;border-radius:50%;',
      "background:#fff;border:1px solid #E4E1DC;cursor:pointer;display:flex;align-items:center;justify-content:center;",
      "font:400 20px/1 'Gordita',sans-serif;color:#12171C!important;z-index:2;transition:transform .16s cubic-bezier(.23,1,.32,1)}",
    '.wl-lb-close:hover,.wl-lb-close:focus{background:#DB7627;border-color:#DB7627;color:#fff!important;outline:none}',
    '.wl-lb-close:active{background:#DB7627;border-color:#DB7627;color:#fff!important;transform:scale(.94)}',
    '.vp-main{position:relative}',
    '.vp-zoomhint{position:absolute;top:0;left:0;width:58px;height:58px;',
      'border-radius:50%;background:rgba(219,118,39,.35);display:flex;align-items:center;justify-content:center;',
      'opacity:0;pointer-events:none;z-index:5;box-shadow:0 4px 18px rgba(8,10,12,.22);will-change:transform;',
      'transition:opacity .25s cubic-bezier(.23,1,.32,1)}',
    '@media(hover:none){.vp-zoomhint{display:none}}',
    '.wl-lb-count{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);color:#fff;',
      "font:400 13px/1 'Gordita',sans-serif;letter-spacing:.08em;background:rgba(6,9,12,.55);padding:9px 15px;border-radius:3px;z-index:2}",
    '@media(max-width:700px){.wl-lb-btn{width:44px;height:44px;font-size:24px}.wl-lb-prev{left:8px}.wl-lb-next{right:8px}',
      '.wl-lb-img{max-width:96vw;max-height:82vh}.wl-lb-close{top:12px;right:12px}}',
    '@media(prefers-reduced-motion:reduce){.wl-lb,.wl-lb *{transition:none!important}}'
  ].join('');
  document.head.appendChild(css);

  var lb, stage, countEl, lbi = 0, anim = false, built = false, warmed = {};
  function warm(i){var k=(i+n)%n;if(warmed[k])return;warmed[k]=true;var im=new Image();im.src=srcs[k];}
  function mkBtn(cls,label,txt){var b=document.createElement('button');b.type='button';b.className=cls;
    b.setAttribute('aria-label',label);b.textContent=txt;return b;}
  function mkImg(src){var im=document.createElement('img');im.className='wl-lb-img';im.src=src;im.alt='';im.draggable=false;return im;}
  function build(){
    lb=document.createElement('div');lb.className='wl-lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
    stage=document.createElement('div');stage.className='wl-lb-stage';lb.appendChild(stage);
    var prev=mkBtn('wl-lb-btn wl-lb-prev','Previous photo','‹');
    var next=mkBtn('wl-lb-btn wl-lb-next','Next photo','›');
    var close=mkBtn('wl-lb-close','Close','✕');
    countEl=document.createElement('span');countEl.className='wl-lb-count';
    lb.appendChild(prev);lb.appendChild(next);lb.appendChild(close);lb.appendChild(countEl);
    document.body.appendChild(lb);
    prev.addEventListener('click',function(e){e.stopPropagation();nav(-1)});
    next.addEventListener('click',function(e){e.stopPropagation();nav(1)});
    close.addEventListener('click',function(e){e.stopPropagation();closeLB()});
    lb.addEventListener('click',function(e){if(e.target===lb||e.target===stage)closeLB()});
    var sx=null;
    stage.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
    stage.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;
      if(Math.abs(dx)>45)nav(dx<0?1:-1);sx=null},{passive:true});
    built=true;
  }
  function setCount(){countEl.textContent=(lbi+1)+' / '+n;}
  function openLB(i){
    if(!built)build();
    lbi=(i+n)%n;
    stage.innerHTML='';stage.appendChild(mkImg(srcs[lbi]));setCount();warm(lbi+1);warm(lbi-1);
    document.body.style.overflow='hidden';lb.style.display='flex';
    requestAnimationFrame(function(){requestAnimationFrame(function(){lb.classList.add('on')})});
    document.addEventListener('keydown',onKey);
  }
  function closeLB(){
    lb.classList.remove('on');
    document.removeEventListener('keydown',onKey);
    var done=false,fin=function(){if(done)return;done=true;lb.style.display='none';document.body.style.overflow='';
      stage.innerHTML='';lb.removeEventListener('transitionend',fin)};
    if(REDUCE)fin();else{lb.addEventListener('transitionend',fin);setTimeout(fin,420)}
    var b=btns[lbi];if(b)b.click();  // leave the inline gallery on the last-viewed photo
  }
  function nav(dir){
    if(anim||n<2)return;
    var ni=(lbi+dir+n)%n;if(ni===lbi)return;
    var cur=stage.querySelector('.wl-lb-img');
    var nx=mkImg(srcs[ni]);
    lbi=ni;setCount();warm(ni+dir);
    if(REDUCE){stage.innerHTML='';stage.appendChild(nx);return;}
    var enter=function(){
      anim=true;
      nx.style.transform='translateX('+(dir*42)+'%)';nx.style.opacity='0';stage.appendChild(nx);
      requestAnimationFrame(function(){requestAnimationFrame(function(){
        var E='transform .42s cubic-bezier(.23,1,.32,1),opacity .42s cubic-bezier(.23,1,.32,1)';
        nx.style.transition=E;if(cur)cur.style.transition=E;
        nx.style.transform='translateX(0)';nx.style.opacity='1';
        if(cur){cur.style.transform='translateX('+(-dir*42)+'%)';cur.style.opacity='0';}
        var d2=false,end=function(){if(d2)return;d2=true;if(cur&&cur.parentNode)cur.remove();anim=false};
        nx.addEventListener('transitionend',end);setTimeout(end,560);
      })});
    };
    if(nx.decode)nx.decode().then(enter,enter);else{nx.onload=enter;nx.onerror=enter;}
  }
  function onKey(e){if(e.key==='Escape')closeLB();else if(e.key==='ArrowRight')nav(1);else if(e.key==='ArrowLeft')nav(-1);}
  main.addEventListener('click',function(e){
    if(e.target.closest('[data-nav]')||e.target.closest('button'))return;
    var idx=btns.findIndex(function(b){return b.classList.contains('on')});
    openLB(idx<0?0:idx);
  });
})();

