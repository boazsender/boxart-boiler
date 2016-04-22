import 'core-js/modules/es6.object.assign';

import React, {Children} from 'react';

import Component from '../update-ancestor';

/**
 * Batch
 *
 * Common and useful optimization over a batch of elements reducing
 * object creation.
 *
 * Make sure to localize all data an item under this component needs to be
 * represented is in its member of the passed array. As long as that is true
 * this optimization won't get in the way.
 */
export default class Batch extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      items: this.props.items.map(this.renderItem),
      subbatchs: {},
      subbatchElements: [],
    };
    if (this.props.subbatch) {
      this.props.items.forEach((item, index, items) => {
        const subbatch = this.props.subbatch(item, index, items);
        const subbatchIndex = this.props.subbatchIndex(item, index, items);
        if (!this.state.subbatchs[subbatch]) {
          this.state.subbatchs[subbatch] = [];
        }
        this.state.subbatchs[subbatch][subbatchIndex] = this.state.items[index];
      });
      Object.keys(this.state.subbatchs).forEach(subbatchKey => {
        const subbatch = this.state.subbatchs[subbatchKey];
        this.state.subbatchElements[subbatchKey] = <SubBatch key={subbatchKey}>{subbatch}</SubBatch>;
      });
    }
    this.keyedItems = {};
    this.keyedElements = {};
    this.state.items.forEach((batchItem, index) => {
      if (batchItem.key) {
        this.keyedItems[batchItem.key] = this.props.items[index];
        this.keyedElements[batchItem.key] = batchItem;
      }
    });
  }

  componentWillReceiveProps(newProps) {
    if (this.props !== newProps) {
      const change = {items: {$splice: []}, subbatchs: {}, subbatchElements: {$splice: []}};
      const removeKeys = {};
      if (this.props.subbatch) {
        for (let i = 0; i < this.props.items.length; i++) {
          removeKeys[this.props.items[i].key] = true;
        }
      }
      const map = newProps.children;
      for (let i = 0; i < newProps.items.length; i++) {
        const itemKey = newProps.items[i].key;
        if (this.props.items[i] !== newProps.items[i]) {
          let element;
          if (this.props.subbatch) {
            const oldItem = this.keyedItems[itemKey];
            const oldElement = this.keyedElements[itemKey];
            const oldBatch = this.props.subbatch(oldItem);
            const oldBatchIndex = this.props.subbatchIndex(oldItem);
            if (!change.subbatchs[oldBatch]) {
              change.subbatchs[oldBatch] = {$set: (this.state.subbatchs[oldBatch] || []).slice()};
            }
            if (change.subbatchs[oldBatch].$set[oldBatchIndex] === oldElement) {
              change.subbatchs[oldBatch].$set[oldBatchIndex] = '';
            }
          }
          if (
            itemKey in this.keyedItems &&
            this.keyedItems[itemKey] !== newProps.items[i]
          ) {
            element = this.renderItem(newProps.items[i], i, newProps.items, map);
            this.keyedItems[itemKey] = newProps.items[i];
            this.keyedElements[itemKey] = element;
          }
          else if (itemKey in this.keyedItems) {
            element = this.keyedElements[itemKey];
          }
          else {
            element = this.renderItem(newProps.items[i], i, newProps.items, map);
          }
          change.items.$splice.push(
            [i, 1, element]
          );
          if (this.props.subbatch) {
            const newBatch = this.props.subbatch(newProps.items[i], i, newProps.items);
            const newBatchIndex = this.props.subbatchIndex(newProps.items[i], i, newProps.items);
            if (!change.subbatchs[newBatch]) {
              change.subbatchs[newBatch] = {$set: (this.state.subbatchs[newBatch] || []).slice()};
            }
            change.subbatchs[newBatch].$set[newBatchIndex] = element;
            removeKeys[itemKey] = false;
          }
        }
        else if (this.props.subbatch) {
          removeKeys[itemKey] = false;
        }
      }
      if (this.props.subbatch) {
        for (const removeKey in removeKeys) {
          if (removeKeys[removeKey]) {
            const item = this.keyedItems[removeKey];
            const subbatch = this.props.subbatch(item);
            const subbatchIndex = this.props.subbatchIndex(item);
            if (!change.subbatchs[subbatch]) {
              change.subbatchs[subbatch] = {$set: (this.state.subbatchs[subbatch] || []).slice()};
            }
            if (change.subbatchs[subbatch].$set[subbatchIndex] === this.keyedElements[removeKey]) {
              change.subbatchs[subbatch].$set[subbatchIndex] = '';
            }
            this.keyedItems[removeKey] = null;
            this.keyedElements[removeKey] = null;
          }
        }
        for (const subbatchKey in change.subbatchs) {
          change.subbatchElements.$splice.push(
            [subbatchKey, 1, <SubBatch key={subbatchKey}>{change.subbatchs[subbatchKey].$set}</SubBatch>]
          );
        }
      }
      if (this.props.items.length > newProps.items.length) {
        change.items.$splice.push([
          newProps.items.length,
          this.props.items.length - newProps.items.length,
        ]);
      }
      if (change.items.$splice.length > 0) {
        this.updateState(change);
      }
    }
  }

  shouldComponentUpdate(newProps, newState) {
    return (
      this.props !== newProps && this.props.items === newProps.items ||
      this.state.items !== newState.items
    );
  }

  renderItem(item, index, items, map = this.props.children) {
    const itemEl = map(item);
    return <BatchItem key={itemEl.key} item={item}>{itemEl}</BatchItem>;
  }

  render() {
    const children = this.props.subbatch ? this.state.subbatchElements : this.state.items;
    const props = Object.assign({}, this.props);
    const Tag = props.tag || 'div';
    return (<Tag {...props}>{children}</Tag>);
  }
}

class SubBatch extends Component {
  shouldComponentUpdate(newProps) {
    return (this.props.children !== newProps.children);
  }

  render() {
    return (<span>{this.props.children}</span>);
  }
}

class BatchItem extends Component {
  shouldComponentUpdate(newProps) {
    return (this.props.item !== newProps.item);
  }

  render() {
    return Children.only(this.props.children);
  }
}
