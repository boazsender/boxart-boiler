import React, {Children} from 'react';

import Component from '../auto-bind-ancestor';

export default class Animated extends Component {
  componentDidMount() {
    this.context.animationAgent.updateAnimated(this);
  }

  componentDidUpdate() {
    this.context.animationAgent.updateAnimated(this);
  }

  getAnimateKey() {
    return this.props.animateKey;
  }

  render() {
    return Children.only(this.props.children);
  }
}

Animated.contextTypes = {
  animationAgent: React.PropTypes.any,
};
