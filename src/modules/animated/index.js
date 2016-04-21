import React, {Children} from 'react';

import Component from '../auto-bind-ancestor';

export default class Animated extends Component {
  componentDidMount() {
    this.context.animationAgent.mountAnimated(this);
    this.context.animationAgent.updateAnimated(this);
  }

  componentWillUpdate() {
    this.context.animationAgent.willUpdateAnimated(this);
  }

  componentDidUpdate() {
    this.context.animationAgent.updateAnimated(this);
  }

  componentWillUnmount() {
    this.context.animationAgent.unmountAnimated(this);
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

Animated.propTypes = {
  children: React.PropTypes.any,
  animateKey: React.PropTypes.any.isRequired,
  animate: React.PropTypes.any,
};
