import 'core-js/modules/es6.object.assign';

import React, {Children} from 'react';
import {findDOMNode} from 'react-dom';

import Component from '../update-ancestor';

function position(element, root, target) {
  let el = element;
  let top = 0;
  let left = 0;
  while (el && el !== root) {
    top += el.offsetTop;
    left += el.offsetLeft;
    el = el.offsetParent;
  }
  target[0] = left;
  target[1] = top;
  return target;
}

function copyPosition(dst, src) {
  dst[0] = src[0];
  dst[1] = src[1];
  return dst;
}

const _tmpUpdateAnimatedOld = [0, 0];
const _tmpUpdateAnimatedNew = [0, 0];

export default class AnimationAgent extends Component {
  constructor(...args) {
    super(...args);
    this.positions = {};
  }

  getChildContext() {
    return {animationAgent: this};
  }

  updateAnimated(animated) {
    const key = animated.getAnimateKey();

    if (this.positions[key]) {
      const animatedEl = findDOMNode(animated);
      const oldPosition = this.positions[key].slice();
      const newPosition = position(animatedEl, findDOMNode(this), this.positions[key]);

      Promise.resolve()
      .then(() => new Promise(requestAnimationFrame))
      .then(() => {
        Object.assign(animatedEl.style, {
          transform: `translate3d(${oldPosition[0] - newPosition[0]}px, ${oldPosition[1] - newPosition[1]}px, 0)`,
          transition: 'none',
          zIndex: 1,
        });
        return new Promise(requestAnimationFrame);
      })
      .then(() => {
        animatedEl.style.transition = 'transform 0.3s';
        Object.assign(animatedEl.style, {
          transform: 'translateZ(0)',
          zIndex: 1,
        });
        return new Promise(resolve => setTimeout(resolve, 300));
      })
      .then(() => {
        Object.assign(animatedEl.style, {
          transform: '',
          transition: '',
          zIndex: '',
        });
      });
    }
    else {
      this.positions[key] = [0, 0];
      position(findDOMNode(animated), findDOMNode(this), this.positions[key]);
    }
  }

  render() {
    return Children.only(this.props.children);
  }
}

AnimationAgent.childContextTypes = {
  animationAgent: React.PropTypes.any,
};
