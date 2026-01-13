const header = {
  section: document.querySelector('#header'),
  
  init() {
    if (!this.section) return;
    window.addEventListener('scroll', this.handleScroll.bind(this));
  },
  
  handleScroll() {
    if (window.scrollY > 0) {
      this.section.classList.add('fixed');
    } else {
      this.section.classList.remove('fixed');
    }
  }
};

const hero = {
  section: document.querySelector('.hero'),
  switchBtn: document.querySelector('.hero .switch .switch-input'),
  
  state: false,
  done: false,
  locked: false,
  touchStartY: 0,
  wheelSum: 0,
  wheelTimer: null,
  blockUntil: 0,
  
  init() {
    if (!this.section) return;
    
    this.createIntroTimeline();
    this.playIntro();
    
    this.switchBtn?.addEventListener('change', () => {
      this.state = this.switchBtn.checked;
      this.applyState();
      
      if (document.body.classList.contains('hero-lock')) {
        this.unlockPage();
        this.unbindInput();
      }
    });
    
    if (window.scrollY <= 0) {
      this.state = false;
      this.applyState();
      this.lockPage();
      this.bindInputOnce();
    } else {
      this.scrollToTopAndInit();
    }

    window.addEventListener('scroll', ()=>{
      if (window.scrollY <= 0) {
        this.state = false;
        this.applyState();
        this.lockPage();
        this.bindInputOnce();
      } 
    });
  },
  
  scrollToTopAndInit() {
    this.state = false;
    this.applyState();
    
    gsap.to(window, {
      scrollTo: { y: 0 },
      duration:0,
      ease: 'power2.out',
      onComplete: () => {
        this.lockPage();
        this.bindInputOnce();
      }
    });
  },
  
  playIntro() {
    this.introTl?.play();
  },
  
  applyState() {
    this.section.classList.toggle('on', this.state);
    if (this.switchBtn) {
      this.switchBtn.checked = this.state;
    }
  },
  
  lockPage() {
    const freezeY = window.scrollY || 0;
    document.documentElement.classList.add('hero-lock');
    document.body.classList.add('hero-lock');
    document.body.style.top = `-${freezeY}px`;
  },
  
  unlockPage() {
    document.body.style.top = '';
    document.body.classList.remove('hero-lock');
    document.documentElement.classList.remove('hero-lock');
  },
  
  isInHeroStage() {
    const rect = this.section.getBoundingClientRect();
    return rect.top <= 90 && rect.bottom > 90;
  },
  
  bindInputOnce() {
    this._onWheel = (e) => {
      const now = performance.now();
      
      if (now < this.blockUntil) {
        e.preventDefault();
        return;
      }
      
      if (this.done || this.locked) return;
      if (!this.isInHeroStage()) return;
      
      e.preventDefault();
      
      this.wheelSum += e.deltaY;
      clearTimeout(this.wheelTimer);
      this.wheelTimer = setTimeout(() => {
        this.wheelSum = 0;
      }, 140);
      
      if (this.wheelSum > 80) {
        this.wheelSum = 0;
        this.fireStepAndRelease();
      }
    };
    
    this._onTouchStart = (e) => {
      this.touchStartY = e.touches[0].clientY;
    };
    
    this._onTouchMove = (e) => {
      const now = performance.now();
      
      if (now < this.blockUntil) {
        e.preventDefault();
        return;
      }
      
      if (this.done || this.locked) return;
      if (!this.isInHeroStage()) return;
      
      e.preventDefault();
      
      const delta = this.touchStartY - e.touches[0].clientY;
      if (delta > 18) {
        this.fireStepAndRelease();
      }
    };
    
    window.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('touchstart', this._onTouchStart, { passive: false });
    window.addEventListener('touchmove', this._onTouchMove, { passive: false });
  },
  
  unbindInput() {
    window.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('touchstart', this._onTouchStart);
    window.removeEventListener('touchmove', this._onTouchMove);
  },
  
  fireStepAndRelease() {
    if (this.done) return;
    
    this.locked = true;
    this.state = !this.state;
    this.applyState();
    this.done = true;
    
    const BLOCK_MS = 450;
    this.blockUntil = performance.now() + BLOCK_MS;
    
    requestAnimationFrame(() => {
      this.unlockPage();
      this.locked = false;
      
      setTimeout(() => {
        this.unbindInput();
      }, BLOCK_MS);
    });
  },
  
  createIntroTimeline() {
    const h2 = this.section.querySelector('.text h2');
    const p = this.section.querySelector('.text p');
    const sw = this.section.querySelector('.text .switch');
    const img = this.section.querySelector('.img');
    
    if (!h2) return;
    
    gsap.set([h2, p, sw, img], { autoAlpha: 0, y: 50 });
    
    this.introTl = gsap.timeline({
      paused: true,
      defaults: { duration: 0.8, ease: 'power3.out' }
    });
    
    this.introTl.to([h2, p, sw, img], {
      autoAlpha: 1,
      y: 0,
      stagger: 0.15
    });
  }
};

const review = {
  step: 5,
  visibleCount: 5,
  wrap: document.querySelector('.review .review-list'),
  items: document.querySelectorAll('.review .review-item'),
  moreBtn: document.querySelector('.review .more-btn'),
  loop: null,
  
  init() {
    if (!this.items.length) return;
    
    this.moreBtn?.addEventListener('click', () => {
      this.more();
      ScrollTrigger.refresh();
    });
    
    this.handleLayout();
    this.render();
    AOS.refresh();
    window.addEventListener('resize', this.handleResize.bind(this));
  },
  
  more() {
    this.visibleCount += this.step;
    this.render();
    AOS.refresh();
  },
  
  render() {
    this.items.forEach((item, index) => {
      item.classList.toggle('visible', index < this.visibleCount);
    });
    
    if (this.visibleCount >= this.items.length) {
      this.moreBtn.style.display = 'none';
    } else {
      this.moreBtn.style.display = 'block';
    }
  },
  
  enableMarquee() {
    if (this.loop) return;
    
    const boxes = gsap.utils.toArray(this.items);
    
    gsap.killTweensOf(boxes);
    gsap.set(boxes, { clearProps: 'all' });
    
    boxes.forEach((item, index) => {
      item.classList.add('visible', index < this.step);
    });
    
    this.loop = horizontalLoop(boxes, {
      repeat: -1,
      draggable: true,
      speed: 1,
      paddingRight: 40,
      center: false,
      snap: false
    });
    
    this.moreBtn.style.display = 'none';
  },
  
  destroyMarquee() {
    if (!this.loop) return;
    
    this.loop.kill();
    
    if (this.loop.draggable) {
      this.loop.draggable.kill();
    }
    
    if (this.loop.cleanup) {
      this.loop.cleanup();
    }
    
    this.loop = null;
    
    gsap.killTweensOf(this.items);
    gsap.set(this.items, {
      clearProps: 'all'
    });
    
    this.items.forEach((item, i) => {
      item.classList.toggle('visible', i < this.step);
      item.style.transform = 'translateX(0)';
    });
    
    this.moreBtn.style.display = 'block';
  },
  
  handleLayout() {
    if (window.innerWidth >= 800) {
      this.enableMarquee();
    } else {
      this.destroyMarquee();
    }
  },
  
  handleResize() {
    this.handleLayout();
  }
};

function horizontalLoop(items, config = {}) {
  items = gsap.utils.toArray(items);
  
  let cleanup;
  let proxy;
  let tl = gsap.timeline({
    repeat: config.repeat ?? -1,
    paused: config.paused,
    defaults: { ease: 'none' },
    onReverseComplete() {
      tl.totalTime(tl.rawTime() + tl.duration() * 100);
    }
  });
  
  const length = items.length;
  const widths = [];
  const times = [];
  let totalWidth = 0;
  let startX = items[0].offsetLeft;
  let pixelsPerSecond = (config.speed || 0.3) * 100;
  
  let xPercents = [];
  let spaceBefore = [];
  
  function getTotalWidth() {
    return (
      items[length - 1].offsetLeft +
      xPercents[length - 1] / 100 * widths[length - 1] -
      startX +
      spaceBefore[0] +
      items[length - 1].offsetWidth +
      (parseFloat(config.paddingRight) || 0)
    );
  }
  
  function populateWidths() {
    let b1 = items[0].parentNode.getBoundingClientRect();
    let b2;
    
    items.forEach((el, i) => {
      widths[i] = el.offsetWidth;
      xPercents[i] =
        (parseFloat(gsap.getProperty(el, 'x')) / widths[i]) * 100 +
        gsap.getProperty(el, 'xPercent');
      
      b2 = el.getBoundingClientRect();
      spaceBefore[i] = b2.left - (i ? b1.right : b1.left);
      b1 = b2;
    });
    
    gsap.set(items, {
      xPercent: i => xPercents[i]
    });
    
    totalWidth = getTotalWidth();
  }
  
  let timeWrap;
  
  function populateTimeline() {
    tl.clear();
    
    for (let i = 0; i < length; i++) {
      const item = items[i];
      const curX = (xPercents[i] / 100) * widths[i];
      const distanceToStart = item.offsetLeft + curX - startX + spaceBefore[0];
      const distanceToLoop = distanceToStart + widths[i];
      
      tl.to(
        item,
        {
          xPercent: ((curX - distanceToLoop) / widths[i]) * 100,
          duration: distanceToLoop / pixelsPerSecond
        },
        0
      ).fromTo(
        item,
        {
          xPercent: ((curX - distanceToLoop + totalWidth) / widths[i]) * 100
        },
        {
          xPercent: xPercents[i],
          duration:
            (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
          immediateRender: false
        },
        distanceToLoop / pixelsPerSecond
      );
      
      times[i] = distanceToStart / pixelsPerSecond;
    }
    
    timeWrap = gsap.utils.wrap(0, tl.duration());
  }
  
  function refresh(deep) {
    const p = tl.progress();
    tl.progress(0, true);
    populateWidths();
    if (deep) {
      populateTimeline();
    }
    tl.progress(p, true);
  }
  
  gsap.context(() => {
    gsap.set(items, { x: 0 });
    populateWidths();
    populateTimeline();
    
    const onResize = () => refresh(true);
    window.addEventListener('resize', onResize);
    
    cleanup = () => window.removeEventListener('resize', onResize);
  });
  
  tl.progress(1).progress(0);
  
  if (config.draggable && typeof Draggable === 'function') {
    proxy = document.createElement('div');
    
    let startProgress = 0;
    let ratio = 0;
    let wasPlaying = false;
    
    const sync = dx => {
      tl.progress(gsap.utils.wrap(0, 1, startProgress + dx * ratio));
    };
    
    const draggable = Draggable.create(proxy, {
      trigger: items[0].parentNode,
      type: 'x',
      inertia: true,
      throwResistance: 3000,
      maxDuration: 0.4,
      overshootTolerance: 0,
      snap: false,
      
      onPressInit() {
        wasPlaying = !tl.paused();
        tl.pause();
        
        startProgress = tl.progress();
        ratio = 1 / totalWidth;
        gsap.set(proxy, { x: startProgress / -ratio });
      },
      
      onDrag() {
        sync(this.startX - this.x);
      },
      
      onThrowUpdate() {
        sync(this.startX - this.x);
      },
      
      onRelease() {
        if (wasPlaying) {
          tl.play();
        }
      },
      
      onThrowComplete() {
        if (wasPlaying) {
          tl.play();
        }
      }
    })[0];
    
    tl.draggable = draggable;
    
    const forceRelease = () => {
      if (draggable.isDragging) {
        draggable.endDrag();
      }
    };
    
    ['mouseup', 'pointerup', 'touchend', 'pointercancel', 'blur']
      .forEach(evt => window.addEventListener(evt, forceRelease, true));
  }
  
  tl.cleanup = cleanup;
  return tl;
}

const intro = {
  section: document.querySelector('.intro'),
  cardList: document.querySelector('.intro .card-list'),
  cardItems: document.querySelectorAll('.intro .card-list .card-item'),
  textList: document.querySelectorAll('.intro .text-list li'),
  currentIndex: 0,
  st: null,
  lastHold: false,
  
  init() {
    if (!this.section) return;
    const secTitle = this.section.querySelector('.sec-title');
    const textWrap = this.section.querySelector('.text-wrap');
    
    if (secTitle) {
      gsap.set(secTitle, { opacity: 0, y: 50 });
      
      ScrollTrigger.create({
        trigger: secTitle,
        start: 'top 80%',
        onEnter: () => {
          gsap.to(secTitle, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
          });
        },
        onLeaveBack: () => {
          gsap.to(secTitle, {
            opacity: 0,
            y: 50,
            duration: 0.8,
            ease: 'power3.out'
          });
        },
        onEnterBack: () => {
          gsap.to(secTitle, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
          });
        }
      });
    }
    
    if (textWrap) {
      gsap.set(textWrap, { opacity: 0, y: 50 });
      
      ScrollTrigger.create({
        trigger: textWrap,
        start: 'top 80%',
        onEnter: () => {
          gsap.to(textWrap, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            delay: 0.15
          });
        },
        onLeaveBack: () => {
          gsap.to(textWrap, {
            opacity: 0,
            y: 50,
            duration: 0.8,
            ease: 'power3.out'
          });
        },
        onEnterBack: () => {
          gsap.to(textWrap, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            delay: 0.15
          });
        }
      });
    }
    
   
    
    const total = this.cardItems.length;
    
    this.cardItems.forEach((el, i) => {
      el.classList.toggle('active', i === 0);
    });
    this.textList.forEach((el, i) => {
      el.classList.toggle('active', i === 0);
    });
    
    // this.setItemPosition();
    
    this.st = ScrollTrigger.create({
      trigger: this.section,
      start: () => {
        const h = document.querySelector('#header')?.offsetHeight || 0;
        return `top-=${h} top`;
      },
      end: () => `+=400%`,
      pin: false,
      pinSpacing: false,
      scrub: true,
      markers: false,
      onUpdate: (self) => {
        const index = Math.min(
          total - 1,
          Math.floor(self.progress * total)
        );
        
        if (index === total - 1) {
          if (!this.lockScroll && !this.lastHold) {
            this.lockScroll = true;
            
            clearTimeout(this.holdTimer);
            this.holdTimer = setTimeout(() => {
              this.lockScroll = false;
              this.lastHold = true;
            }, 300);
          }
        } else {
          this.lastHold = false;
          this.lockScroll = false;
          clearTimeout(this.holdTimer);
        }
        
        if (index !== this.currentIndex) {
          this.moveToIndex(index);
        }
      }
    });
  },
  
  getOuterHeight(el) {
    if (!el) return 0;
    const style = getComputedStyle(el);
    return (
      el.offsetHeight +
      parseFloat(style.marginTop) +
      parseFloat(style.marginBottom)
    );
  },
  
  // setItemPosition() {
  //   const title = this.section.querySelector('.sec-title');
  //   const textList = this.section.querySelector('.text-list');
  //   const cardList = this.section.querySelector('.card-list');
    
  //   const topOffset =
  //     this.getOuterHeight(title) +
  //     this.getOuterHeight(textList) +
  //     this.getOuterHeight(textList.querySelector('li.active'));
    
  //   if (window.innerWidth >= 1280) {
  //     cardList.style.top = 0;
  //   } else {
  //     cardList.style.top = `${topOffset + 15}px`;
  //   }
  // },
  
  handleResize() {
    // this.setItemPosition();
    console.log('handleResize');
    this.moveToIndex(this.currentIndex, true);
    ScrollTrigger.refresh();
  },
  
  getOffsetUntil(index) {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += this.cardItems[i].offsetHeight + 8;
    }
    return offset;
  },
  
  moveToIndex(index, instant = false) {
    if (index === this.currentIndex && !instant) return;
    
    const targetY = index === 0 ? 0 : -this.getOffsetUntil(index);
    
    gsap.to(this.cardList, {
      y: targetY,
      duration: instant ? 0 : 0.6,
      ease: 'power3.out'
    });
    
    this.cardItems.forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });
    this.textList.forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });
    
    this.currentIndex = index;
  }
};

const faq = {
  items: document.querySelectorAll('.faq-item'),
  itemBtns: document.querySelectorAll('.faq-item .faq-title button'),
  
  init() {
    this.itemBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.items.forEach((item) => {
          if (item === btn.closest('.faq-item')) return;
          item.classList.remove('active');
          slide.up(item.querySelector('.faq-content'), 300);
        });
        this.toggle(btn.closest('.faq-item'));
      });
    });
  },
  
  toggle(item) {
    item.classList.toggle('active');
    slide.toggle(item.querySelector('.faq-content'), 300);
  }
};

document.addEventListener('DOMContentLoaded', function() {
  const width = window.innerWidth;
  
  AOS.init({
    duration: 800
  });
  
  gsap.registerPlugin(ScrollTrigger, Observer, ScrollToPlugin);
  
  hero.init();
  review.init();
  intro.init();
  
  if (width >= 1280) {
    document.querySelectorAll('.feature .feature-item').forEach((item, index) => {
      item.setAttribute('data-aos-delay', index * 100);
    });
  }
  
  faq.init();
  header.init();
});

function setVH() {
  let lastWidth = window.innerWidth;
  
  const handleResize = () => {
    const currentWidth = window.innerWidth;
    if (currentWidth !== lastWidth) {
      const h = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${h}px`);
      lastWidth = currentWidth;
    }
  };
  
  const h = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty('--vh', `${h}px`);
  
  window.addEventListener('resize', handleResize);
}

setVH();
