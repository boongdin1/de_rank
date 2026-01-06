const header = {
    section: document.querySelector('#header'),
    init(){
        if (!this.section) return;
        window.addEventListener('scroll', this.handleScroll.bind(this));
    },
    handleScroll(){
        if (window.scrollY > 0) {
            this.section.classList.add('fixed');
        } else {
            this.section.classList.remove('fixed');
        }
    },
}
const hero = {
  section: document.querySelector('.hero'),
  switchBtn: document.querySelector('.hero .switch .switch-input'),

  state: false,

  // hold 관련
  lockScroll: false,
  holdDone: false,
  holdTimer: null,
  lockY: 0,

  init() {
    if (!this.section) return;

    this.createIntroTimeline();
    this.playIntro();

    this.switchBtn.addEventListener('change', () => {
      this.state = this.switchBtn.checked;
      this.applyState();
    });

    this.createScrollTrigger();

    // 스크롤 락 (휠 + 터치)
    this._lockHandler = (e) => {
      if (!this.lockScroll) return;
      e.preventDefault();
    };

    window.addEventListener('wheel', this._lockHandler, { passive: false });
    window.addEventListener('touchmove', this._lockHandler, { passive: false });
  },

  playIntro() {
    if (!this.introTl) return;
    this.introTl.play();
  },

  applyState() {
    this.section.classList.toggle('on', this.state);
    this.switchBtn.checked = this.state;
  },

  createIntroTimeline() {
    const h2 = this.section.querySelector('.text h2');
    const p = this.section.querySelector('.text p');
    const sw = this.section.querySelector('.text .switch');
    const img = this.section.querySelector('.img');

    gsap.set([h2, p, sw, img], {
      autoAlpha: 0,
      y: 100,
    });

    this.introTl = gsap.timeline({
      paused: true,
      defaults: {
        ease: 'power3.out',
        duration: 0.8,
      },
    });

    this.introTl.to([h2, p, sw, img], {
      autoAlpha: 1,
      y: 0,
      stagger: 0.2,
    });
  },

  createScrollTrigger() {
    const headerH = document.querySelector('#header')?.offsetHeight || 0;

    this.st = ScrollTrigger.create({
      trigger: this.section,
      start: `top-=${headerH} top`,
      end: `+=600`,          // 🔥 % 제거 (핵심)
      scrub: false,
      pin: false,

      onUpdate: (self) => {
        const p = self.progress;

        // 배경 상태 전환 (progress 사용 OK)
        if (p > 0.15 && !this.state) {
          this.state = true;
          this.applyState();
        }

        if (p < 0.05 && this.state) {
          this.state = false;
          this.applyState();
        }

        // 🔒 홀드 진입
        if (p >= 0.4 && !this.lockScroll && !this.holdDone) {
          this.lockScroll = true;
          this.lockY = window.scrollY;

          // 즉시 위치 고정
          window.scrollTo(0, this.lockY);

          clearTimeout(this.holdTimer);
          this.holdTimer = setTimeout(() => {
            this.lockScroll = false;
            this.holdDone = true;
          }, 500);
        }

        // 🔒 락 중에는 무조건 되돌림
        if (this.lockScroll) {
          window.scrollTo(0, this.lockY);
        }

        // 다시 위로 올라가면 홀드 리셋
        if (p < 0.3) {
          this.holdDone = false;
        }
      },
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

    render(){
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
  
      boxes.forEach(item => item.classList.add('visible'));
  
      this.loop = horizontalLoop(boxes, {
        repeat: -1,
        draggable: true,
        speed: 1,
        paddingRight: 40,
        center: false,
        snap: false,
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
  
      this.items.forEach((item, i) => {
        item.classList.toggle('visible', i < this.step);
        item.style.transform = 'unset';
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
      deep && populateTimeline();
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
          wasPlaying && tl.play();
        },
  
        onThrowComplete() {
          wasPlaying && tl.play();
        }
      })[0];
  
      tl.draggable = draggable;

      const forceRelease = () => {
        draggable.isDragging && draggable.endDrag();
      };
  
      ['mouseup', 'pointerup', 'touchend', 'pointercancel', 'blur']
        .forEach(evt => window.addEventListener(evt, forceRelease, true));
    }
  
    tl.cleanup = cleanup;
    return tl;
};
  

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

      if(window.innerWidth >= 1280){
        document.querySelector('.intro .text-wrap').removeAttribute('data-aos');
      }
      
      const total = this.cardItems.length;

      this.cardItems.forEach((el, i) => {
        el.classList.toggle('active', i === 0);
      });
      this.textList.forEach((el, i) => {
        el.classList.toggle('active', i === 0);
      });

      this.setItemPosition();
  
      this.st = ScrollTrigger.create({
        trigger: this.section,
        start: () => {
          const h = document.querySelector('#header')?.offsetHeight || 0;
          return `top-=${h} top`;
        },
        end: () =>
          `+=${(window.innerHeight * (total - 1))}`,
        pin: true,
        pinSpacing: true,
        scrub: false,
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
                }, 500);
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
          ,
      });
  
      window.addEventListener('resize', this.handleResize.bind(this));
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
  
    setItemPosition() {
      const title = this.section.querySelector('.sec-title');
      const textList = this.section.querySelector('.text-list');
      const cardList = this.section.querySelector('.card-list');
  
      const topOffset =
        this.getOuterHeight(title) +
        this.getOuterHeight(textList) +
        this.getOuterHeight(textList.querySelector('li.active'));
  
        if(window.innerWidth >= 1280){
            cardList.style.top = 0;
        }else{
            cardList.style.top = `${topOffset + 46}px`;
        }
    },
  
    handleResize() {
      this.setItemPosition();
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
        ease: 'power3.out',
      });
  
      this.cardItems.forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
      this.textList.forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
  
      this.currentIndex = index;
    },
  };

const faq = {
    items: document.querySelectorAll('.faq-item'),
    itemBtns: document.querySelectorAll('.faq-item .faq-title button'),
    init(){
        this.itemBtns.forEach((btn) => {
            btn.addEventListener('click', ()=>{
                this.items.forEach((item) => {
                    if (item === btn.closest('.faq-item')) return;
                    item.classList.remove('active');
                    slide.up(item.querySelector('.faq-content'), 300);
                });
                this.toggle(btn.closest('.faq-item'));
            });
        });
    },
    toggle(item){
        item.classList.toggle('active');
        slide.toggle(item.querySelector('.faq-content'), 300);
    },
}


document.addEventListener('DOMContentLoaded', function() {
    const width = window.innerWidth;
    AOS.init({
        duration: 800,
    });
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({
      ignoreMobileResize: true
    });

    hero.init();

    // 리뷰
    review.init();
    window.addEventListener('resize', review.handleResize.bind(review));

    //intro
    intro.init();

    //feature
    if(width >= 1280){
      document.querySelectorAll('.feature .feature-item').forEach((item, index) => {
        item.setAttribute('data-aos-delay', index * 100);
      });
    }

    //faq
    faq.init();

    //header
    header.init();
});

