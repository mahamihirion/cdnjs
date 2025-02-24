'use strict';

let timerDebounce = undefined;
function debounce(duration, callback) {
  clearTimeout(timerDebounce);
  timerDebounce = setTimeout(function () {
    callback();
  }, duration);
  return timerDebounce;
}
function transitionAsPromise(triggeringFunc, el) {
  return new Promise(resolve => {
    const handleTransitionEnd = () => {
      el.removeEventListener('transitionend', handleTransitionEnd);
      resolve();
    };

    el.addEventListener('transitionend', handleTransitionEnd);
    const classesBefore = el.getAttribute('class');
    const stylesBefore = el.getAttribute('style');
    triggeringFunc();

    if (classesBefore === el.getAttribute('class') && stylesBefore === el.getAttribute('style')) {
      handleTransitionEnd();
    }
  });
}
function loadImage(src, image) {
  if ('decode' in image) {
    image.src = src;
    return image.decode();
  } else {
    return new Promise(function (resolve, reject) {
      image.onload = resolve;
      image.onerror = resolve;
      image.src = src;
    });
  }
}
function fit(options) {
  let height;
  let width;
  const {
    imgHeight,
    imgWidth,
    containerHeight,
    containerWidth,
    canvasWidth,
    canvasHeight,
    imageSize
  } = options;
  const canvasRatio = canvasHeight / canvasWidth;
  const containerRatio = containerHeight / containerWidth;
  const imgRatio = imgHeight / imgWidth;

  if (imageSize == 'cover') {
    if (imgRatio < containerRatio) {
      height = containerHeight;
      width = height / imgRatio;
    } else {
      width = containerWidth;
      height = width * imgRatio;
    }
  } else if (imageSize == 'native') {
    height = imgHeight;
    width = imgWidth;
  } else {
    if (imgRatio > canvasRatio) {
      height = canvasHeight;
      width = height / imgRatio;
    } else {
      width = canvasWidth;
      height = width * imgRatio;
    }

    if (imageSize === 'scale-down' && (width >= imgWidth || height >= imgHeight)) {
      width = imgWidth;
      height = imgHeight;
    }
  }

  return {
    height: height,
    width: width
  };
}
function openFullScreen(wrapper) {
  if (wrapper.requestFullscreen) {
    wrapper.requestFullscreen();
    return true;
  } else if (wrapper.webkitRequestFullscreen) {
    wrapper.webkitRequestFullscreen();
    return true;
  } else if (wrapper.msRequestFullscreen) {
    wrapper.msRequestFullscreen();
    return true;
  } else {
    return false;
  }
}
function exitFullScreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
    return false;
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
    return false;
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
    return false;
  } else {
    return true;
  }
}

const defaults = {
  container: document.body,
  // window or element
  className: undefined,
  imageSize: 'scale-down',
  // 'scale-down', 'contain', 'cover' or 'native'
  fullScreen: false,
  loop: false,
  linkImages: true,
  setIndex: 0,
  firstImageIndex: 0,
  lastImageIndex: false,
  currentImageIndex: undefined,
  allowZoom: true,
  closeOnBackgroundClick: true,
  setTitle: function () {
    return '';
  },
  description: function () {
    return this.images[this.settings.currentImageIndex].title;
  },
  pagination: function () {
    const last = this.settings.lastImageIndex + 1;
    const position = this.settings.currentImageIndex + 1;
    return position + '/' + last;
  },

  afterInitialize() {},

  afterMarkup() {},

  afterImageLoad() {},

  zoomedPaddingX: function (canvasWidth, imgWidth) {
    return 0;
  },
  zoomedPaddingY: function (canvasHeight, imgHeight) {
    return 0;
  }
};
class Chocolat {
  constructor(elements, settings) {
    this.settings = settings;
    this.elems = {};
    this.images = [];
    this.events = [];
    this.state = {
      fullScreenOpen: false,
      initialZoomState: null,
      initialized: false,
      timer: false
    };
    this._cssClasses = ['chocolat-open', 'chocolat-in-container', 'chocolat-cover', 'chocolat-zoomable', 'chocolat-zoomed'];

    if (NodeList.prototype.isPrototypeOf(elements) || HTMLCollection.prototype.isPrototypeOf(elements)) {
      elements.forEach((el, i) => {
        this.images.push({
          title: el.getAttribute('title'),
          src: el.getAttribute('href'),
          height: undefined,
          width: undefined
        });
        this.off(el, 'click.chocolat');
        this.on(el, 'click.chocolat', e => {
          this.init(i);
          e.preventDefault();
        });
      });
    } else {
      this.images = elements;
    }

    if (this.settings.container instanceof Element || this.settings.container instanceof HTMLElement) {
      this.elems.container = this.settings.container;
    } else {
      this.elems.container = document.body;
    }

    this.api = {
      open: i => {
        i = parseInt(i) || 0;
        return this.init(i);
      },
      close: () => {
        return this.close();
      },
      next: () => {
        return this.change(1);
      },
      prev: () => {
        return this.change(-1);
      },
      goto: i => {
        return this.open(i);
      },
      current: () => {
        return this.settings.currentImageIndex;
      },
      position: () => {
        return this.position(this.elems.img);
      },
      destroy: () => {
        return this.destroy();
      },
      set: (property, value) => {
        this.settings[property] = value;
        return value;
      },
      get: property => {
        return this.settings[property];
      },
      getElem: name => {
        return this.elems[name];
      }
    };
  }

  init(i) {
    if (!this.state.initialized) {
      this.markup();
      this.attachListeners();
      this.settings.lastImageIndex = this.images.length - 1;
      this.state.initialized = true;
    }

    this.settings.afterInitialize.call(this);
    return this.load(i);
  }

  load(i) {
    if (this.settings.fullScreen) {
      this.state.fullScreenOpen = openFullScreen(this.elems.wrapper);
    }

    if (this.settings.currentImageIndex === i) {
      return Promise.resolve();
    }

    setTimeout(() => {
      this.elems.overlay.classList.add('chocolat-visible');
      this.elems.wrapper.classList.add('chocolat-visible');
    }, 0);
    this.elems.container.classList.add('chocolat-open');
    this.state.timer = setTimeout(() => {
      if (this.elems !== undefined) {
        this.elems.loader.classList.add('chocolat-visible');
      }
    }, 300);
    const imgLoader = new Image();
    return loadImage(this.images[i].src, imgLoader).then(() => {
      const nextIndex = i + 1;

      if (this.images[nextIndex] != undefined) {
        loadImage(this.images[nextIndex].src, new Image());
      }

      this.settings.currentImageIndex = i;
      const position = this.position(imgLoader);
      const appear = this.appear(i);
      return Promise.all([position, appear]);
    }).then(() => {
      this.zoomable();
      this.settings.afterImageLoad.call(this);
    });
  }

  position(image) {
    this.elems.description.textContent = this.settings.description.call(this);
    this.elems.pagination.textContent = this.settings.pagination.call(this);
    this.arrows();
    const fitOptions = {
      imgHeight: image.naturalHeight,
      imgWidth: image.naturalWidth,
      containerHeight: this.elems.container.clientHeight,
      containerWidth: this.elems.container.clientWidth,
      canvasWidth: this.elems.imageCanvas.clientWidth,
      canvasHeight: this.elems.imageCanvas.clientHeight,
      imageSize: this.settings.imageSize
    };
    const {
      width,
      height
    } = fit(fitOptions);
    return this.center(width, height);
  }

  center(width, height) {
    return transitionAsPromise(() => {
      Object.assign(this.elems.imageWrapper.style, {
        width: width + 'px',
        height: height + 'px'
      });
    }, this.elems.imageWrapper);
  }

  appear(i) {
    clearTimeout(this.state.timer);

    if (!this.elems.loader.classList.contains('chocolat-visible')) {
      return loadImage(this.images[i].src, this.elems.img);
    }

    return transitionAsPromise(() => {
      this.elems.loader.classList.remove('chocolat-visible');
    }, this.elems.loader).then(() => {
      return loadImage(this.images[i].src, this.elems.img);
    });
  }

  change(step) {
    this.zoomOut();
    this.zoomable();
    const requestedImage = this.settings.currentImageIndex + parseInt(step);

    if (requestedImage > this.settings.lastImageIndex) {
      if (this.settings.loop) {
        return this.load(this.settings.firstImageIndex);
      }
    } else if (requestedImage < this.settings.firstImageIndex) {
      if (this.settings.loop) {
        return this.load(this.settings.lastImageIndex);
      }
    } else {
      return this.load(requestedImage);
    }
  }

  arrows() {
    if (this.settings.loop) {
      this.elems.left.classList.add('active');
      this.elems.right.classList.add('active');
    } else if (this.settings.linkImages) {
      this.elems.right.classList.toggle('active', this.settings.currentImageIndex !== this.settings.lastImageIndex);
      this.elems.left.classList.toggle('active', this.settings.currentImageIndex !== this.settings.firstImageIndex);
    } else {
      this.elems.left.classList.remove('active');
      this.elems.right.classList.remove('active');
    }
  }

  close() {
    if (this.state.fullScreenOpen) {
      this.state.fullScreenOpen = exitFullScreen();
      return;
    }

    this.settings.currentImageIndex = undefined;
    const promiseOverlay = transitionAsPromise(() => {
      this.elems.overlay.classList.remove('chocolat-visible');
    }, this.elems.overlay);
    const promiseWrapper = transitionAsPromise(() => {
      this.elems.wrapper.classList.remove('chocolat-visible');
    }, this.elems.wrapper);
    return Promise.all([promiseOverlay, promiseWrapper]).then(() => {
      this.elems.container.classList.remove('chocolat-open');
    });
  }

  destroy() {
    for (let i = this.events.length - 1; i >= 0; i--) {
      const {
        element,
        eventName
      } = this.events[i];
      this.off(element, eventName);
    }

    if (!this.state.initialized) {
      return;
    }

    if (this.state.fullScreenOpen) {
      this.state.fullScreenOpen = exitFullScreen();
    }

    this.settings.currentImageIndex = undefined;
    this.state.initialized = false;
    this.elems.container.classList.remove(...this._cssClasses);
    this.elems.wrapper.parentNode.removeChild(this.elems.wrapper);
  }

  markup() {
    this.elems.container.classList.add('chocolat-open', this.settings.className);

    if (this.settings.imageSize == 'cover') {
      this.elems.container.classList.add('chocolat-cover');
    }

    if (this.elems.container !== document.body) {
      this.elems.container.classList.add('chocolat-in-container');
    }

    this.elems.wrapper = document.createElement('div');
    this.elems.wrapper.setAttribute('id', 'chocolat-content-' + this.settings.setIndex);
    this.elems.wrapper.setAttribute('class', 'chocolat-wrapper');
    this.elems.container.appendChild(this.elems.wrapper);
    this.elems.overlay = document.createElement('div');
    this.elems.overlay.setAttribute('class', 'chocolat-overlay');
    this.elems.wrapper.appendChild(this.elems.overlay);
    this.elems.loader = document.createElement('div');
    this.elems.loader.setAttribute('class', 'chocolat-loader');
    this.elems.wrapper.appendChild(this.elems.loader);
    this.elems.layout = document.createElement('div');
    this.elems.layout.setAttribute('class', 'chocolat-layout');
    this.elems.wrapper.appendChild(this.elems.layout);
    this.elems.top = document.createElement('div');
    this.elems.top.setAttribute('class', 'chocolat-top');
    this.elems.layout.appendChild(this.elems.top);
    this.elems.center = document.createElement('div');
    this.elems.center.setAttribute('class', 'chocolat-center');
    this.elems.layout.appendChild(this.elems.center);
    this.elems.left = document.createElement('div');
    this.elems.left.setAttribute('class', 'chocolat-left');
    this.elems.center.appendChild(this.elems.left);
    this.elems.imageCanvas = document.createElement('div');
    this.elems.imageCanvas.setAttribute('class', 'chocolat-image-canvas');
    this.elems.center.appendChild(this.elems.imageCanvas);
    this.elems.imageWrapper = document.createElement('div');
    this.elems.imageWrapper.setAttribute('class', 'chocolat-image-wrapper');
    this.elems.imageCanvas.appendChild(this.elems.imageWrapper);
    this.elems.img = document.createElement('img');
    this.elems.img.setAttribute('class', 'chocolat-img');
    this.elems.imageWrapper.appendChild(this.elems.img);
    this.elems.right = document.createElement('div');
    this.elems.right.setAttribute('class', 'chocolat-right');
    this.elems.center.appendChild(this.elems.right);
    this.elems.bottom = document.createElement('div');
    this.elems.bottom.setAttribute('class', 'chocolat-bottom');
    this.elems.layout.appendChild(this.elems.bottom);
    this.elems.close = document.createElement('span');
    this.elems.close.setAttribute('class', 'chocolat-close');
    this.elems.top.appendChild(this.elems.close);
    this.elems.description = document.createElement('span');
    this.elems.description.setAttribute('class', 'chocolat-description');
    this.elems.bottom.appendChild(this.elems.description);
    this.elems.pagination = document.createElement('span');
    this.elems.pagination.setAttribute('class', 'chocolat-pagination');
    this.elems.bottom.appendChild(this.elems.pagination);
    this.elems.setTitle = document.createElement('span');
    this.elems.setTitle.setAttribute('class', 'chocolat-set-title');
    this.elems.setTitle.textContent = this.settings.setTitle();
    this.elems.bottom.appendChild(this.elems.setTitle);
    this.elems.fullscreen = document.createElement('span');
    this.elems.fullscreen.setAttribute('class', 'chocolat-fullscreen');
    this.elems.bottom.appendChild(this.elems.fullscreen);
    this.settings.afterMarkup.call(this);
  }

  attachListeners() {
    this.off(document, 'keydown.chocolat');
    this.on(document, 'keydown.chocolat', e => {
      if (this.state.initialized) {
        if (e.keyCode == 37) {
          this.change(-1);
        } else if (e.keyCode == 39) {
          this.change(1);
        } else if (e.keyCode == 27) {
          this.close();
        }
      }
    });
    const right = this.elems.wrapper.querySelector('.chocolat-right');
    this.off(right, 'click.chocolat');
    this.on(right, 'click.chocolat', () => {
      this.change(+1);
    });
    const left = this.elems.wrapper.querySelector('.chocolat-left');
    this.off(left, 'click.chocolat');
    this.on(left, 'click.chocolat', () => {
      this.change(-1);
    });
    this.off(this.elems.close, 'click.chocolat');
    this.on(this.elems.close, 'click.chocolat', this.close.bind(this));
    this.off(this.elems.fullscreen, 'click.chocolat');
    this.on(this.elems.fullscreen, 'click.chocolat', () => {
      if (this.state.fullScreenOpen) {
        this.state.fullScreenOpen = exitFullScreen();
        return;
      }

      this.state.fullScreenOpen = openFullScreen(this.elems.wrapper);
    });

    if (this.settings.closeOnBackgroundClick) {
      this.off(this.elems.overlay, 'click.chocolat');
      this.on(this.elems.overlay, 'click.chocolat', this.close.bind(this));
    }

    this.off(this.elems.wrapper, 'click.chocolat');
    this.on(this.elems.wrapper, 'click.chocolat', this.zoomOut.bind(this));
    const img = this.elems.wrapper.querySelector('.chocolat-img');
    this.off(img, 'click.chocolat');
    this.on(img, 'click.chocolat', e => {
      if (this.state.initialZoomState === null && this.elems.container.classList.contains('chocolat-zoomable')) {
        e.stopPropagation();
        this.zoomIn(e);
      }
    });
    this.on(this.elems.wrapper, 'mousemove.chocolat', e => {
      if (this.state.initialZoomState === null) {
        return;
      }

      if (this.settings.currentImageIndex === undefined) {
        return;
      }

      const rect = this.elems.wrapper.getBoundingClientRect();
      const pos = {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX
      };
      const height = this.elems.wrapper.clientHeight;
      const width = this.elems.wrapper.clientWidth;
      const imgWidth = this.elems.img.width;
      const imgHeight = this.elems.img.height;
      const coord = [e.pageX - width / 2 - pos.left, e.pageY - height / 2 - pos.top];
      let mvtX = 0;

      if (imgWidth > width) {
        const paddingX = this.settings.zoomedPaddingX(imgWidth, width);
        mvtX = coord[0] / (width / 2);
        mvtX = ((imgWidth - width) / 2 + paddingX) * mvtX;
      }

      let mvtY = 0;

      if (imgHeight > height) {
        const paddingY = this.settings.zoomedPaddingY(imgHeight, height);
        mvtY = coord[1] / (height / 2);
        mvtY = ((imgHeight - height) / 2 + paddingY) * mvtY;
      }

      this.elems.img.style.marginLeft = -mvtX + 'px';
      this.elems.img.style.marginTop = -mvtY + 'px';
    });
    this.on(window, 'resize.chocolat', e => {
      if (!this.state.initialized || this.settings.currentImageIndex === undefined) {
        return;
      }

      debounce(50, () => {
        const fitOptions = {
          imgHeight: this.elems.img.naturalHeight,
          imgWidth: this.elems.img.naturalWidth,
          containerHeight: this.elems.wrapper.clientHeight,
          containerWidth: this.elems.wrapper.clientWidth,
          canvasWidth: this.elems.imageCanvas.clientWidth,
          canvasHeight: this.elems.imageCanvas.clientHeight,
          imageSize: this.settings.imageSize
        };
        const {
          width,
          height
        } = fit(fitOptions);
        this.center(width, height);
        this.zoomable();
      });
    });
  }

  zoomable() {
    const currentImageIndex = this.images[this.settings.currentImageIndex];
    const wrapperWidth = this.elems.wrapper.clientWidth;
    const wrapperHeight = this.elems.wrapper.clientHeight;
    const isImageZoomable = this.settings.allowZoom && (this.elems.img.naturalWidth > wrapperWidth || this.elems.img.naturalHeight > wrapperHeight) ? true : false;
    const isImageStretched = this.elems.img.clientWidth > this.elems.img.naturalWidth || this.elems.img.clientHeight > this.elems.img.naturalHeight;

    if (isImageZoomable && !isImageStretched) {
      this.elems.container.classList.add('chocolat-zoomable');
    } else {
      this.elems.container.classList.remove('chocolat-zoomable');
    }
  }

  zoomIn(e) {
    this.state.initialZoomState = this.settings.imageSize;
    this.settings.imageSize = 'native';
    this.elems.container.classList.add('chocolat-zoomed');
    const fitOptions = {
      imgHeight: this.elems.img.naturalHeight,
      imgWidth: this.elems.img.naturalWidth,
      containerHeight: this.elems.wrapper.clientHeight,
      containerWidth: this.elems.wrapper.clientWidth,
      canvasWidth: this.elems.imageCanvas.clientWidth,
      canvasHeight: this.elems.imageCanvas.clientHeight,
      imageSize: this.settings.imageSize
    };
    const {
      width,
      height
    } = fit(fitOptions);
    return this.center(width, height);
  }

  zoomOut(e) {
    if (this.state.initialZoomState === null || this.settings.currentImageIndex === undefined) {
      return;
    }

    this.settings.imageSize = this.state.initialZoomState;
    this.state.initialZoomState = null;
    this.elems.img.style.margin = 0;
    this.elems.container.classList.remove('chocolat-zoomed');
    const fitOptions = {
      imgHeight: this.elems.img.naturalHeight,
      imgWidth: this.elems.img.naturalWidth,
      containerHeight: this.elems.wrapper.clientHeight,
      containerWidth: this.elems.wrapper.clientWidth,
      canvasWidth: this.elems.imageCanvas.clientWidth,
      canvasHeight: this.elems.imageCanvas.clientHeight,
      imageSize: this.settings.imageSize
    };
    const {
      width,
      height
    } = fit(fitOptions);
    return this.center(width, height);
  }

  on(element, eventName, cb) {
    // const eventName = this.settings.setIndex + '-' + eventName
    const length = this.events.push({
      element,
      eventName,
      cb
    });
    element.addEventListener(eventName.split('.')[0], this.events[length - 1].cb);
  }

  off(element, eventName) {
    // const eventName = this.settings.setIndex + '-' + eventName
    const index = this.events.findIndex(event => {
      return event.element === element && event.eventName === eventName;
    });

    if (this.events[index]) {
      element.removeEventListener(eventName.split('.')[0], this.events[index].cb);
      this.events.splice(index, 1);
    }
  }

}

const instances = [];
function main_esm (elements, options) {
  const settings = Object.assign({}, defaults, {
    images: []
  }, options, {
    setIndex: instances.length
  });
  const instance = new Chocolat(elements, settings);
  instances.push(instance);
  return instance;
}

module.exports = main_esm;
