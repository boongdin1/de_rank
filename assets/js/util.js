const slide = {
    up(el, dur = 300) {
      if (el._sliding) return;
      el._sliding = true;
  
      el.style.transition = `height ${dur}ms ease, padding ${dur}ms ease, margin ${dur}ms ease`;
      el.style.height = el.offsetHeight + "px";
      el.offsetHeight;
  
      el.style.overflow = "hidden";
      el.style.height = 0;
      el.style.paddingTop = el.style.paddingBottom = 0;
      el.style.marginTop = el.style.marginBottom = 0;
  
      setTimeout(() => {
        el.style.display = "none";
        this._clear(el);
      }, dur);
    },
  
    down(el, dur = 300) {
      if (el._sliding) return;
      el._sliding = true;
  
      el.style.removeProperty("display");
      let display = getComputedStyle(el).display;
      if (display === "none") display = "block";
      el.style.display = display;
  
      const height = el.offsetHeight;
      el.style.height = 0;
      el.style.paddingTop = el.style.paddingBottom = 0;
      el.style.marginTop = el.style.marginBottom = 0;
      el.style.overflow = "hidden";
      el.offsetHeight;
  
      el.style.transition = `height ${dur}ms ease, padding ${dur}ms ease, margin ${dur}ms ease`;
      el.style.height = height + "px";
      el.style.removeProperty("padding-top");
      el.style.removeProperty("padding-bottom");
      el.style.removeProperty("margin-top");
      el.style.removeProperty("margin-bottom");
  
      setTimeout(() => {
        this._clear(el);
      }, dur);
    },
  
    toggle(el, dur = 300) {
      if (getComputedStyle(el).display === "none") this.down(el, dur);
      else this.up(el, dur);
    },
  
    _clear(el) {
      el.style.removeProperty("height");
      el.style.removeProperty("overflow");
      el.style.removeProperty("transition");
      el.style.removeProperty("padding-top");
      el.style.removeProperty("padding-bottom");
      el.style.removeProperty("margin-top");
      el.style.removeProperty("margin-bottom");
      el._sliding = false;
    },
  };
  