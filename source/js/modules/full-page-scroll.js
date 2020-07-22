import throttle from 'lodash/throttle';

const ScreenIndex = {
  START: 0,
  HISTORY: 1,
  PRIZES: 2,
  RULES: 3,
  GAME: 4,
};

export default class FullPageScroll {
  constructor() {
    this.THROTTLE_TIMEOUT = 2000;

    this.screenElements = document.querySelectorAll(`.screen:not(.screen--result)`);
    this.menuElements = document.querySelectorAll(`.page-header__menu .js-menu-link`);
    this.fullpageOverlayElement = document.querySelector(`.fullpage-overlay`);

    this.activeScreen = 0;
    this.onScrollHandler = this.onScroll.bind(this);
    this.onUrlHashChanged = this.onUrlHashChanged.bind(this);
    this._pageOverlayAnimationHandler = this._pageOverlayAnimationHandler.bind(this);
    this.changeVisibilityDisplay = this.changeVisibilityDisplay.bind(this);
    this.screenChangedEventHandler = this.screenChangedEventHandler.bind(this);
  }

  init() {
    document.addEventListener(`wheel`, throttle(this.onScrollHandler, this.THROTTLE_TIMEOUT, {trailing: false}));
    window.addEventListener(`popstate`, this.onUrlHashChanged);
    document.body.addEventListener(`screenChanged`, this.screenChangedEventHandler);
    this.onUrlHashChanged();
  }

  _pageOverlayAnimationHandler() {
    this.changeVisibilityDisplay();
    this.changeActiveMenuItem();
    this.fullpageOverlayElement.classList.remove(`fullpage-overlay--animate`);
    this.fullpageOverlayElement.removeEventListener(`animationend`, this._pageOverlayAnimationHandler);
  }


  onScroll(evt) {
    const currentPosition = this.activeScreen;

    this.reCalculateActiveScreenPosition(evt.deltaY);

    if (currentPosition !== this.activeScreen) {
      this.emitChangeDisplayEvent(currentPosition);
    }
  }

  onUrlHashChanged() {
    const currentScreen = this.activeScreen;
    const newIndex = Array.from(this.screenElements).findIndex((screen) => location.hash.slice(1) === screen.id);

    this.activeScreen = (newIndex < 0) ? 0 : newIndex;
    this.emitChangeDisplayEvent(currentScreen);
  }

  changeVisibilityDisplay() {
    this.screenElements.forEach((screen) => {
      screen.classList.add(`screen--hidden`);
      screen.classList.remove(`active`);
    });
    this.screenElements[this.activeScreen].classList.remove(`screen--hidden`);
    this.screenElements[this.activeScreen].classList.add(`active`);
  }

  changeActiveMenuItem() {
    const activeItem = Array.from(this.menuElements).find((item) => item.dataset.href === this.screenElements[this.activeScreen].id);

    if (activeItem) {
      this.menuElements.forEach((item) => item.classList.remove(`active`));
      activeItem.classList.add(`active`);
    }
  }

  emitChangeDisplayEvent(currentPosition) {
    const event = new CustomEvent(`screenChanged`, {
      detail: {
        'screenId': this.activeScreen,
        'previousScreen': currentPosition,
        'screenName': this.screenElements[this.activeScreen].id,
        'screenElement': this.screenElements[this.activeScreen]
      }
    });

    document.body.dispatchEvent(event);
  }

  reCalculateActiveScreenPosition(delta) {
    if (delta > 0) {
      this.activeScreen = Math.min(this.screenElements.length - 1, ++this.activeScreen);
    } else {
      this.activeScreen = Math.max(0, --this.activeScreen);
    }
  }


  screenChangedEventHandler(evt) {
    const {previousScreen, screenId} = evt.detail;

    if (previousScreen === ScreenIndex.HISTORY && screenId === ScreenIndex.PRIZES) {
      this.fullpageOverlayElement.addEventListener(`animationend`, this._pageOverlayAnimationHandler);
      this.fullpageOverlayElement.classList.add(`fullpage-overlay--animate`);
    } else {
      this.changeVisibilityDisplay();
      this.changeActiveMenuItem();
    }
  }
}
