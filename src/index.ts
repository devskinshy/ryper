import {
  ActionsType,
  app,
  Children,
  Component,
  h,
  View,
  VNode,
} from "hyperapp";

declare global {
  interface Window {
    hooks: any;
    rootActios: any;
    tree: any;
  }
}
interface Ref<Value> {
  current: Value;
}
interface Effect<Value> {
  depArray: Array<Value>;
  effectCallback?: Function;
}
interface Hook<State, Actions, StateValue, RefValue, EffectValue> {
  type: RyperComponent<State, Actions>;
  key: string | number | null;
  states: Array<StateValue>;
  refs: Array<Ref<RefValue>>;
  effects: Array<Effect<EffectValue>>;
  el?: VNode<RyperAttributes>;
}

type RyperResult<State, Actions> =
  | RyperView<State, Actions>
  | VNode
  | V2VNode
  | any;
interface RyperAttributes {
  oncreate?: null | ((_el: Element) => void);
  onupdate?: null | ((_el: Element) => void);
  ondestroy?: null | ((_el: Element) => void);
  ref?: null | Ref<any>;
  key?: string | number | null;
  [key: string]: any;
}
interface V2VNode {
  type: any;
  props: any;
  children: any;
  node: any;
  tag: any;
  key: any;
  memo?: any;
  events?: any;
}
interface RyperView<State, Actions> extends View<State, Actions> {
  (
    state?: State,
    actions?: Actions,
    props?: RyperAttributes,
    children?: Array<Children | Children[]>
  ): VNode<RyperAttributes>;
  key: symbol;
}
interface RyperComponent<State, Actions> extends Component {
  (
    attributes: RyperAttributes,
    children: Array<Children | Children[]>
  ): RyperResult<State, Actions>;
}

const React = (() => {
  let createRyperViewKey = Symbol();
  let rootActions: any;

  let target: any = null;
  let root: any;

  // let hooksIdx = 0;
  // let statesIdx = 0;
  // let effectsIdx = 0;
  // let refsIdx = 0;
  let hooks: Array<Hook<any, any, any, any, any>> = [];
  // let hook: Hook<any, any, any> | null = null;

  // const isEmpty = (arr: Array<any>, index: number): boolean => {
  //   return arr.length - 1 < index;
  // };

  // const isNotSameComponent = <
  //   State,
  //   Actions,
  //   StateValue,
  //   RefValue,
  //   EffectValue
  // >(
  //   type: RyperComponent<State, Actions>,
  //   key: string | number | null,
  //   hook: Hook<State, Actions, StateValue, RefValue, EffectValue>
  // ): boolean => {
  //   return type !== hook.type || key !== hook.key;
  // };
  const isComponent = (type: Component | string): type is Component => {
    return typeof type === "function";
  };
  const isRyperView = <State, Actions>(
    elFn: RyperView<State, Actions> | V2VNode | any
  ): elFn is RyperView<State, Actions> => {
    return typeof elFn === "function" && elFn.key === createRyperViewKey;
  };
  const isV2VNode = (el: V2VNode | any): el is V2VNode => {
    const V2NodeKeys = ["type", "props", "children", "node", "tag", "key"];
    return (
      typeof el === "object" &&
      V2NodeKeys.every((key) => Object.keys(el).includes(key))
    );
  };
  // const isVNode = (el: VNode | any): el is VNode => {
  //   const VNodeKeys = ["nodeName", "attributes", "children", "key"];
  //   return (
  //     typeof el === "object" &&
  //     VNodeKeys.every((key) => Object.keys(el).includes(key))
  //   );
  // };

  const versionDown = <State, Actions>(newEl: V2VNode): VNode => {
    const { key, children, tag, props } = newEl;
    const el = {
      nodeName: tag,
      attributes: props,
      children: children.map((child: RyperResult<State, Actions>) =>
        typeof child !== "boolean" ? child : ""
      ),
      key,
    };

    return el;
  };
  const convertVersion = (newEl: V2VNode | VNode) => {
    return isV2VNode(newEl) ? versionDown(newEl) : newEl;
  };
  const getEl = <State, Actions>(newEl: RyperResult<State, Actions>) => {
    const el: VNode = isRyperView(newEl)
      ? newEl({ key: Math.random() })
      : newEl;
    return convertVersion(el);
  };

  // const componentInit = <State, Actions, StateValue, RefValue, EffectValue>(
  //   type: RyperComponent<State, Actions>,
  //   props: RyperAttributes
  // ): Hook<State, Actions, StateValue, RefValue, EffectValue> => {
  //   const _hooksIdx = hooksIdx++;
  //   let _hooks: Hook<State, Actions, StateValue, RefValue, EffectValue> = {
  //     type,
  //     key: props.key || Math.random(),
  //     states: [],
  //     refs: [],
  //     effects: [],
  //   };

  //   if (!oldTree) {
  //     hooks.splice(_hooksIdx, 0, _hooks);
  //   } else {
  //     _hooks = hooks[_hooksIdx];
  //   }

  //   return _hooks;
  // };
  // const componentFinal = () => {
  //   // statesIdx = 0;
  //   // effectsIdx = 0;
  //   // refsIdx = 0;
  //   // hook = null;
  // };

  const componentInit = () => {
    target = getParent(target);
  };
  const componentFinal = (el: any) => {
    target = getParent(el);
  };
  const getVNode = <State, Actions>(
    type: RyperComponent<State, Actions>,
    props: RyperAttributes,
    children: Array<Children | Children[]>
  ): VNode => {
    let newEl: RyperResult<State, Actions> = h(type, props, ...children);
    const el = getEl(newEl);

    return el;
  };

  const getParent = (el: any): any => {
    let result;

    if (!el || el.children.some((child: any) => child.isComponent)) {
      result = el;
    } else {
      result = getParent(el.parent);
    }

    return result;
  };

  const componentRender = <State, Actions>(
    type: RyperComponent<State, Actions>,
    props: RyperAttributes,
    children: Array<Children | Children[]>
  ): VNode<RyperAttributes> => {
    // const _hook = componentInit(type, props);
    componentInit();

    console.log("setTarget", target);

    const el: any = getVNode(type, props, children);
    !el.key && props.key && (el.key = props.key);
    el.type = type;
    el.parent = target;

    console.log("now", el);

    !root && (root = el);
    console.log("root", root);

    const elementProps: RyperAttributes = el.attributes || (el.attributes = {});

    const oldCreate = elementProps.oncreate;
    elementProps.oncreate = (_el) => {
      oldCreate && oldCreate(_el);
    };

    const oldUpdate = elementProps.onupdate;
    elementProps.onupdate = (_el) => {
      // console.log("onupdate", _el);
      oldUpdate && oldUpdate(_el);
    };

    const oldDestroy = elementProps.ondestroy;
    elementProps.ondestroy = (_el) => {
      // console.log("ondestroy", _el);
      oldDestroy && oldDestroy(_el);
    };

    componentFinal(el);
    return el;
  };
  const elementRender = (
    type: string,
    props: RyperAttributes,
    children: Array<Children | Children[]>
  ): VNode<RyperAttributes> => {
    const oldCreate = props.oncreate;
    props.oncreate = (_el) => {
      props.ref && (props.ref.current = _el);
      oldCreate && oldCreate(_el);
    };

    const oldUpdate = props.onupdate;
    props.onupdate = (_el) => {
      props.ref && (props.ref.current = _el);
      oldUpdate && oldUpdate(_el);
    };

    const oldDestroy = props.ondestroy;
    props.ondestroy = (_el) => {
      oldDestroy && oldDestroy(_el);
    };

    // console.log("=", type, children);
    const el = h(type, props, ...children);
    // console.log("==", type, el);

    return el;
  };
  const createElement = <State, Actions, Attributes>(
    type: RyperComponent<State, Actions> | string,
    props: Attributes,
    ...children: Array<Children | Children[]>
  ): RyperView<State, Actions> => {
    const createRyperView = (
      ...params: [
        state?: State,
        actions?: Actions,
        props?: RyperAttributes,
        children?: Array<Children | Children[]>
      ]
    ) => {
      const [, , addProps = {}, addChildren = []] = params;
      const newProps = { ...props, ...addProps };
      const newChildren = [...children, ...addChildren];

      return isComponent(type)
        ? componentRender(type, newProps, newChildren)
        : elementRender(type, newProps, newChildren);
    };

    createRyperView.key = createRyperViewKey;
    createRyperView.isComponent = isComponent(type);

    return createRyperView;
  };
  const createActions = <State, Actions>(
    actions: ActionsType<State, Actions>
  ): ActionsType<State, Actions> => {
    return {
      ...actions,
      change: () => (state) => ({ ...state }),
      getState: () => (state) => state,
    };
  };
  const init = <State, Actions>(
    el: RyperResult<State, Actions>
  ): RyperResult<State, Actions> => {
    window.rootActios = rootActions;
    window.hooks = hooks;

    target = null;
    // hooksIdx = 0;
    // statesIdx = 0;
    // effectsIdx = 0;
    // refsIdx = 0;
    // hook = null;

    // return getEl(el);
    // return getEl(el);
    return el;
  };
  const render = <State, Actions>(
    state: State,
    actions: ActionsType<State, Actions>,
    view: VNode,
    container: Element | null
  ) => {
    rootActions = app<State, Actions>(
      state,
      createActions(actions),
      () => init(view),
      container
    );
  };

  // const useState = <Value>(
  //   initValue: Value
  // ): [value: Value, setState: (newValue: Value) => void] => {
  //   if (hook === null) {
  //     throw "[useState]: hook is null";
  //   }

  //   const _statesIdx = statesIdx++;
  //   const _states = hook.states;

  //   const setState = (newValue: Value, flag = true) => {
  //     if (flag && _states[_statesIdx] === newValue) {
  //       return;
  //     }

  //     _states[_statesIdx] = newValue;

  //     flag && rootActions.change();
  //   };
  //   isEmpty(_states, _statesIdx) && setState(initValue, false);

  //   const _state = _states[_statesIdx];
  //   return [_state, setState];
  // };
  // const useEffect = <Value>(effect: Function, depArray: Array<Value>) => {
  //   if (hook === null) {
  //     throw "[useState]: hook is null";
  //   }

  //   const _effectsIdx = effectsIdx++;
  //   const _effects = hook.effects;
  //   let newEffect: Effect<Value> = { depArray };

  //   let hasChange = true;

  //   if (!isEmpty(_effects, _effectsIdx)) {
  //     newEffect.effectCallback = _effects[_effectsIdx].effectCallback;

  //     const oldDepArray = _effects[_effectsIdx].depArray;
  //     hasChange = depArray.some((dep, i) => !Object.is(dep, oldDepArray[i]));
  //   }

  //   if (hasChange) {
  //     setTimeout(async () => {
  //       newEffect.effectCallback = await effect();
  //     });
  //   }

  //   _effects[_effectsIdx] = newEffect;
  // };
  // const useRef = <Value>(value: Value): Ref<Value> => {
  //   if (hook === null) {
  //     throw "[useState]: hook is null";
  //   }

  //   const _refsIdx = refsIdx++;
  //   const _refs = hook.refs;
  //   const newRef: Ref<Value> = { current: value };

  //   isEmpty(_refs, _refsIdx) && (_refs[_refsIdx] = newRef);

  //   return _refs[_refsIdx];
  // };

  const getState = <State, Target>(
    selector?: (state: State) => Target
  ): Target => {
    const state = rootActions.getState();
    return selector ? selector(state) : state;
  };
  const getActions = <Actions, Target>(
    selector?: (state: Actions) => Target
  ): Target => {
    return selector ? selector(rootActions) : rootActions;
  };

  return {
    render,
    createElement,
    // useState,
    // useRef,
    // useEffect,
    getState,
    getActions,
  };
})();

// export const { useState, useRef, useEffect, getState, getActions } = React;
export const { getState, getActions } = React;

export default React;
