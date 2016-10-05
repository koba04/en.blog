---
type: post
author: koba04
email: koba0004@gmail.com
tags: react.js
slug: react-shallow-render-internals
title: React ShallowRender internals
description: React ShallowRender internals
---

This post is tracing ReactShallowRender flow.
ReactShallowRender is a "shallow" render for unit testing, which returns a "shallow" ReactElement tree.

"shallow" means that it renders its ReactElement tree only one level.

You can use it like this.

```js
import assert from 'assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';

const Child = ({foo}) => <div>{foo}</div>;

const MyComponent = () => (
    <div>
        <Child foo="bar" />
        <p>test</p>
    </div>
);

const renderer = new TestUtils.createRenderer();
const result = renderer.render(<MyComponent />);

assert(result.props.children[0].props.foo === 'bar');
assert(result.props.children[1].props.children === 'test');
```

Let's get into the internal of ReactShallowRenderer!

this is based on React v15.3.2.

https://github.com/facebook/react/tree/v15.3.2


## Instantiate ReactShallowRenderer

At first, `const renderer = new TestUtils.createRenderer();` returns an instance of `ReactShallowRenderer`.

* https://github.com/facebook/react/blob/v15.3.2/src/test/ReactTestUtils.js#L361-L363

```js
  createRenderer: function() {
    return new ReactShallowRenderer();
  },
```

`ReactShallowRenderer` is a class, which of constructor assigns null to `this._instance`.

* https://github.com/facebook/react/blob/v15.3.2/src/test/ReactTestUtils.js#L372-L374

```js
var ReactShallowRenderer = function() {
  this._instance = null;
};
```


## Render test target components

`ReactShallowRenderer#render` returns a ReactElement tree.

* https://github.com/facebook/react/blob/v15.3.2/src/test/ReactTestUtils.js#L436-L464

```js
ReactShallowRenderer.prototype.render = function(element, context) {
  // Ensure we've done the default injections. This might not be true in the
  // case of a simple test that only requires React and the TestUtils in
  // conjunction with an inline-requires transform.
  ReactDefaultInjection.inject();

  // ...

  if (!context) {
    context = emptyObject;
  }
  ReactUpdates.batchedUpdates(_batchedRender, this, element, context);

  return this.getRenderOutput();
};
```

`render` is for injecting settings for `ReactShallowRenderer`, rendering the element as a batch and returning a rendered ReactElement.


## ReactDefaultInjection.inject

`ReactDefaultInjection` is for to register event systems, host components(`ReactDOMComponent`, `ReactDOMTextComponent`...) and update mechanisms(`ReconcilerTransaction`, `batchStrategy`...).

I might write about React injection system as a another entry.

* https://github.com/facebook/react/blob/v15.3.2/src/renderers/dom/shared/ReactDefaultInjection.js#L36-L93

```js
function inject() {
  if (alreadyInjected) {
    // TODO: This is currently true because these injections are shared between
    // the client and the server package. They should be built independently
    // and not share any injection state. Then this problem will be solved.
    return;
  }
  alreadyInjected = true;

  ReactInjection.EventEmitter.injectReactEventListener(
    ReactEventListener
  );

  /**
   * Inject modules for resolving DOM hierarchy and plugin ordering.
   */
  ReactInjection.EventPluginHub.injectEventPluginOrder(DefaultEventPluginOrder);
  ReactInjection.EventPluginUtils.injectComponentTree(ReactDOMComponentTree);
  ReactInjection.EventPluginUtils.injectTreeTraversal(ReactDOMTreeTraversal);

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  ReactInjection.EventPluginHub.injectEventPluginsByName({
    SimpleEventPlugin: SimpleEventPlugin,
    EnterLeaveEventPlugin: EnterLeaveEventPlugin,
    ChangeEventPlugin: ChangeEventPlugin,
    SelectEventPlugin: SelectEventPlugin,
    BeforeInputEventPlugin: BeforeInputEventPlugin,
  });

  ReactInjection.HostComponent.injectGenericComponentClass(
    ReactDOMComponent
  );

  ReactInjection.HostComponent.injectTextComponentClass(
    ReactDOMTextComponent
  );

  ReactInjection.DOMProperty.injectDOMPropertyConfig(HTMLDOMPropertyConfig);
  ReactInjection.DOMProperty.injectDOMPropertyConfig(SVGDOMPropertyConfig);

  ReactInjection.EmptyComponent.injectEmptyComponentFactory(
    function(instantiate) {
      return new ReactDOMEmptyComponent(instantiate);
    }
  );

  ReactInjection.Updates.injectReconcileTransaction(
    ReactReconcileTransaction
  );
  ReactInjection.Updates.injectBatchingStrategy(
    ReactDefaultBatchingStrategy
  );

  ReactInjection.Component.injectEnvironment(ReactComponentBrowserEnvironment);
}
```

For your reference, the following is the `ReactDefaultInjection` for `react-native`.

* https://github.com/facebook/react/blob/v15.3.2/src/renderers/native/ReactNativeDefaultInjection.js#L44-L107

```js
function inject() {
  /**
   * Register the event emitter with the native bridge
   */
  RCTEventEmitter.register(ReactNativeEventEmitter);

  /**
   * Inject module for resolving DOM hierarchy and plugin ordering.
   */
  EventPluginHub.injection.injectEventPluginOrder(ReactNativeEventPluginOrder);
  EventPluginUtils.injection.injectComponentTree(ReactNativeComponentTree);
  EventPluginUtils.injection.injectTreeTraversal(ReactNativeTreeTraversal);

  ResponderEventPlugin.injection.injectGlobalResponderHandler(
    ReactNativeGlobalResponderHandler
  );

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  EventPluginHub.injection.injectEventPluginsByName({
    'ResponderEventPlugin': ResponderEventPlugin,
    'ReactNativeBridgeEventPlugin': ReactNativeBridgeEventPlugin,
  });

  ReactUpdates.injection.injectReconcileTransaction(
    ReactNativeComponentEnvironment.ReactReconcileTransaction
  );

  ReactUpdates.injection.injectBatchingStrategy(
    ReactDefaultBatchingStrategy
  );

  ReactComponentEnvironment.injection.injectEnvironment(
    ReactNativeComponentEnvironment
  );

  var EmptyComponent = (instantiate) => {
    // Can't import View at the top because it depends on React to make its composite
    var View = require('View');
    return new ReactSimpleEmptyComponent(
      ReactElement.createElement(View, {
        collapsable: true,
        style: { position: 'absolute' },
      }),
      instantiate
    );
  };

  ReactEmptyComponent.injection.injectEmptyComponentFactory(EmptyComponent);

  ReactHostComponent.injection.injectTextComponentClass(
    ReactNativeTextComponent
  );
  ReactHostComponent.injection.injectGenericComponentClass(function(tag) {
    // Show a nicer error message for non-function tags
    var info = '';
    if (typeof tag === 'string' && /^[a-z]/.test(tag)) {
      info += ' Each component name should start with an uppercase letter.';
    }
    invariant(false, 'Expected a component class, got %s.%s', tag, info);
  });
}
```


## batchedRender

This is for rendering ReactElement as a batch.

```js
ReactUpdates.batchedUpdates(_batchedRender, this, element, context);
```

`ReactUpdates.batchedUpdates` is using injected `batchingStrategy`, which is [ReactDefaultBatchingStrategy](https://github.com/facebook/react/blob/v15.3.2/src/renderers/shared/stack/reconciler/ReactDefaultBatchingStrategy.js)

* https://github.com/facebook/react/blob/v15.3.2/src/renderers/shared/stack/reconciler/ReactUpdates.js#L109-L112

```js
function batchedUpdates(callback, a, b, c, d, e) {
  ensureInjected();
  batchingStrategy.batchedUpdates(callback, a, b, c, d, e);
}
```

In the `callback`, any updates(`setState`, `forceUpdate`) behave as a batch.

* https://github.com/facebook/react/blob/v15.3.2/src/test/ReactTestUtils.js#L466-L470

```js
function _batchedRender(renderer, element, context) {
  var transaction = ReactUpdates.ReactReconcileTransaction.getPooled(true);
  renderer._render(element, transaction, context);
  ReactUpdates.ReactReconcileTransaction.release(transaction);
}
```

`_batchedRender` updates ReactElement with transaction.

* https://github.com/facebook/react/blob/v15.3.2/src/test/ReactTestUtils.js#L486-L499

```js
ReactShallowRenderer.prototype._render = function(element, transaction, context) {
  if (this._instance) {
    ReactReconciler.receiveComponent(
      this._instance,
      element,
      transaction,
      context
    );
  } else {
    var instance = new ShallowComponentWrapper(element);
    ReactReconciler.mountComponent(instance, transaction, null, null, context, 0);
    this._instance = instance;
  }
};
```

`_render` is rendering ReactComponent with `ReactReconciler`.

If the components has already mounted, `_render` updates ReactComponent with `receiveComponent`, otherwise it mounts ReactComponent with `mountComponent`.

Now is a mounting phase, let's get into the mouting part.


## Instantiate ShallowComponentWrapper and call mountComponent

This part is for instantiating `ShallowComponentWrapper` and mounting it, which is the root ReactComponent.

* https://github.com/facebook/react/blob/v15.3.2/src/test/ReactTestUtils.js#L495-L497

```js
    var instance = new ShallowComponentWrapper(element);
    ReactReconciler.mountComponent(instance, transaction, null, null, context, 0);
    this._instance = instance;
```

Its constructor is like this.

* https://github.com/facebook/react/blob/v15.3.2/src/test/ReactTestUtils.js#L413-L434

```js
var ShallowComponentWrapper = function(element) {
  // TODO: Consolidate with instantiateReactComponent
  if (__DEV__) {
    this._debugID = nextDebugID++;
  }

  this.construct(element);
};
Object.assign(
  ShallowComponentWrapper.prototype,
  ReactCompositeComponent.Mixin, {
    _constructComponent:
      ReactCompositeComponent.Mixin._constructComponentWithoutOwner,
    _instantiateReactComponent: function(element) {
      return new NoopInternalComponent(element);
    },
    _replaceNodeWithMarkup: function() {},
    _renderValidatedComponent:
      ReactCompositeComponent.Mixin
        ._renderValidatedComponentWithoutOwnerOrContext,
  }
);
```

`ShallowComponentWrapper` is a `ReactCompositeComponent` for ShallowRenderer, which is based on [ReactCompositeComponent.Mixin](https://github.com/facebook/react/blob/v15.3.2/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js).

In addtion to that, it is customized for ShallowRenderer.
A important part is that `_instantiateReactComponent` returns a instance of `NoopInternalComponent`.

```js
    _instantiateReactComponent: function(element) {
      return new NoopInternalComponent(element);
    },
```


## ShallowComponentWrapper#construct

`ShallowComponentWrapper` calls `this.construct` in its constructor, which is in `ReactCompositeComponent.Mixin`.

* https://github.com/facebook/react/blob/v15.3.2/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js#L134-L164

```js
  construct: function(element) {
    this._currentElement = element;
    this._rootNodeID = 0;
    this._compositeType = null;
    this._instance = null;
    this._hostParent = null;
    this._hostContainerInfo = null;

    // See ReactUpdateQueue
    this._updateBatchNumber = null;
    this._pendingElement = null;
    this._pendingStateQueue = null;
    this._pendingReplaceState = false;
    this._pendingForceUpdate = false;

    this._renderedNodeType = null;
    this._renderedComponent = null;
    this._context = null;
    this._mountOrder = 0;
    this._topLevelWrapper = null;

    // See ReactUpdates and ReactUpdateQueue.
    this._pendingCallbacks = null;

    // ComponentWillUnmount shall only be called once
    this._calledComponentWillUnmount = false;

    if (__DEV__) {
      this._warnedAboutRefsInRender = false;
    }
  },
```

`this.construct` is for initializing properties.
You can see that `element` is assigned to `this.currentElement`.

## ReactReconciler.mountComponent

The next is `ReactReconciler.mountComponent(instance, transaction, null, null, context, 0);`, which is for rendering `ShallowComponentWrapper`.

* https://github.com/facebook/react/blob/v15.3.2/src/test/ReactTestUtils.js#L496

```js
    ReactReconciler.mountComponent(instance, transaction, null, null, context, 0);
```

* https://github.com/facebook/react/blob/v15.3.2/src/renderers/shared/stack/reconciler/ReactReconciler.js#L40-L76

```js
  mountComponent: function(
    internalInstance,
    transaction,
    hostParent,
    hostContainerInfo,
    context,
    parentDebugID // 0 in production and for roots
  ) {
    if (__DEV__) {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onBeforeMountComponent(
          internalInstance._debugID,
          internalInstance._currentElement,
          parentDebugID
        );
      }
    }
    var markup = internalInstance.mountComponent(
      transaction,
      hostParent,
      hostContainerInfo,
      context,
      parentDebugID
    );
    if (internalInstance._currentElement &&
        internalInstance._currentElement.ref != null) {
      transaction.getReactMountReady().enqueue(attachRefs, internalInstance);
    }
    if (__DEV__) {
      if (internalInstance._debugID !== 0) {
        ReactInstrumentation.debugTool.onMountComponent(
          internalInstance._debugID
        );
      }
    }
    return markup;
  },
```

`ReactReconciler.mountComponent` is for creating markup and attach Refs within passing transaction.
(`ReactShallowRender` doesn't use the markup)

Unfortunately, `attachRefs` has been never called in ShallowRenderer because the `mountComponent` is called outside transaction.

```js
    var markup = internalInstance.mountComponent(
      transaction,
      hostParent,
      hostContainerInfo,
      context,
      parentDebugID
    );
```

If `_batchedRender` used `transaction.perform`, `mountCompnent` is called in transaction.
But in transaction, it doesn't work if you use `refs`...

```
+  transaction.perform(this._render, this, element, transaction, context);
-  renderer._render(element, transaction, context);
```

I'd like to try to fix it.

Back to the `mountCompnent`, `internalInstance` is a instance of `ShallowComponentWrapper`.
`ShallowComponentWrapper#mountComponent` is in `ReactCompositeComponent`.

## ReactCompositeComponent#mountComponent

* https://github.com/facebook/react/blob/v15.3.2/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js#L177-L360

(the following code is removed some dev warnings for readability)

```js
  mountComponent: function(
    transaction,
    hostParent,
    hostContainerInfo,
    context
  ) {
    this._context = context;
    this._mountOrder = nextMountID++;
    this._hostParent = hostParent;
    this._hostContainerInfo = hostContainerInfo;

    var publicProps = this._currentElement.props;
    var publicContext = this._processContext(context);

    var Component = this._currentElement.type;

    var updateQueue = transaction.getUpdateQueue();

    // Initialize the public class
    var doConstruct = shouldConstruct(Component);
    var inst = this._constructComponent(
      doConstruct,
      publicProps,
      publicContext,
      updateQueue
    );
    var renderedElement;

    // Support functional components
    if (!doConstruct && (inst == null || inst.render == null)) {
      renderedElement = inst;
      warnIfInvalidElement(Component, renderedElement);
      invariant(
        inst === null ||
        inst === false ||
        ReactElement.isValidElement(inst),
        '%s(...): A valid React element (or null) must be returned. You may have ' +
        'returned undefined, an array or some other invalid object.',
        Component.displayName || Component.name || 'Component'
      );
      inst = new StatelessComponent(Component);
      this._compositeType = CompositeTypes.StatelessFunctional;
    } else {
      if (isPureComponent(Component)) {
        this._compositeType = CompositeTypes.PureClass;
      } else {
        this._compositeType = CompositeTypes.ImpureClass;
      }
    }

    // Removed warnings

    // These should be set up in the constructor, but as a convenience for
    // simpler class abstractions, we set them up after the fact.
    inst.props = publicProps;
    inst.context = publicContext;
    inst.refs = emptyObject;
    inst.updater = updateQueue;

    this._instance = inst;

    // Store a reference from the instance back to the internal representation
    ReactInstanceMap.set(inst, this);

    // Removed warnings

    var initialState = inst.state;
    if (initialState === undefined) {
      inst.state = initialState = null;
    }

    // Removed warnings

    this._pendingStateQueue = null;
    this._pendingReplaceState = false;
    this._pendingForceUpdate = false;

    var markup;
    if (inst.unstable_handleError) {
      markup = this.performInitialMountWithErrorHandling(
        renderedElement,
        hostParent,
        hostContainerInfo,
        transaction,
        context
      );
    } else {
      markup = this.performInitialMount(renderedElement, hostParent, hostContainerInfo, transaction, context);
    }

    if (inst.componentDidMount) {
      if (__DEV__) {
        transaction.getReactMountReady().enqueue(() => {
          measureLifeCyclePerf(
            () => inst.componentDidMount(),
            this._debugID,
            'componentDidMount'
          );
        });
      } else {
        transaction.getReactMountReady().enqueue(inst.componentDidMount, inst);
      }
    }

    return markup;
  },
```

`ReactCompositeComponent#mountCompnent` is for

* instantiate a component
* initialize properties
* mount Component

For your reference, in ShallowRenderer, `componentDidMount` is never called because it's being called outside of transaction.

`_constructComponent` is for creating a Component instance.

* https://github.com/facebook/react/blob/v15.3.2/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js#L362-L388

```js
  _constructComponent: function(
    doConstruct,
    publicProps,
    publicContext,
    updateQueue
  ) {
    if (__DEV__) {
      ReactCurrentOwner.current = this;
      try {
        return this._constructComponentWithoutOwner(
          doConstruct,
          publicProps,
          publicContext,
          updateQueue
        );
      } finally {
        ReactCurrentOwner.current = null;
      }
    } else {
      return this._constructComponentWithoutOwner(
        doConstruct,
        publicProps,
        publicContext,
        updateQueue
      );
    }
  },
```

* https://github.com/facebook/react/blob/v15.3.2/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js#L390-L421

```js
  _constructComponentWithoutOwner: function(
    doConstruct,
    publicProps,
    publicContext,
    updateQueue
  ) {
    var Component = this._currentElement.type;

    if (doConstruct) {
      if (__DEV__) {
        return measureLifeCyclePerf(
          () => new Component(publicProps, publicContext, updateQueue),
          this._debugID,
          'ctor'
        );
      } else {
        return new Component(publicProps, publicContext, updateQueue);
      }
    }

    // This can still be an instance in case of factory components
    // but we'll count this as time spent rendering as the more common case.
    if (__DEV__) {
      return measureLifeCyclePerf(
        () => Component(publicProps, publicContext, updateQueue),
        this._debugID,
        'render'
      );
    } else {
      return Component(publicProps, publicContext, updateQueue);
    }
  },
```

`_constructComponentWithoutOwner` is for creating an instance of Component.


* https://github.com/facebook/react/blob/v15.3.2/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js#L342

The next one is a `performInitialMount`.

```js
markup = this.performInitialMount(renderedElement, hostParent, hostContainerInfo, transaction, context);
```

* https://github.com/facebook/react/blob/v15.3.2/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js#L453-L508

```js
  performInitialMount: function(renderedElement, hostParent, hostContainerInfo, transaction, context) {
    var inst = this._instance;

    var debugID = 0;
    if (__DEV__) {
      debugID = this._debugID;
    }

    if (inst.componentWillMount) {
      if (__DEV__) {
        measureLifeCyclePerf(
          () => inst.componentWillMount(),
          debugID,
          'componentWillMount'
        );
      } else {
        inst.componentWillMount();
      }
      // When mounting, calls to `setState` by `componentWillMount` will set
      // `this._pendingStateQueue` without triggering a re-render.
      if (this._pendingStateQueue) {
        inst.state = this._processPendingState(inst.props, inst.context);
      }
    }

    // If not a stateless component, we now render
    if (renderedElement === undefined) {
      renderedElement = this._renderValidatedComponent();
    }

    var nodeType = ReactNodeTypes.getType(renderedElement);
    this._renderedNodeType = nodeType;
    var child = this._instantiateReactComponent(
      renderedElement,
      nodeType !== ReactNodeTypes.EMPTY /* shouldHaveDebugID */
    );
    this._renderedComponent = child;

    var markup = ReactReconciler.mountComponent(
      child,
      transaction,
      hostParent,
      hostContainerInfo,
      this._processChildContext(context),
      debugID
    );

    if (__DEV__) {
      if (debugID !== 0) {
        var childDebugIDs = child._debugID !== 0 ? [child._debugID] : [];
        ReactInstrumentation.debugTool.onSetChildren(debugID, childDebugIDs);
      }
    }

    return markup;
  },
```

`this._instantiateReactComponent` has been injected already, which returns an instance of `NoopInternalComponent`.
`ReactReconciler.mountComponent` is called recursively with an `NoopInternalComponent` instance as `child`.

```
ReactReconciler#mountCompnent
↓
ShallowComponentWrapper.mountComponent (ReactCompositeComponent)
↓
ReactReconciler#mountCompnent
↓
NoopInternalComponent#mountCompnent
:
???
```

Is it an infinity loop? take a look at `NoopInternalComponent`.

### NoopInternalComponent

* https://github.com/facebook/react/blob/v15.3.2/src/test/ReactTestUtils.js#L382-L411

```js
var NoopInternalComponent = function(element) {
  this._renderedOutput = element;
  this._currentElement = element;

  if (__DEV__) {
    this._debugID = nextDebugID++;
  }
};

NoopInternalComponent.prototype = {

  mountComponent: function() {
  },

  receiveComponent: function(element) {
    this._renderedOutput = element;
    this._currentElement = element;
  },

  getHostNode: function() {
    return undefined;
  },

  unmountComponent: function() {
  },

  getPublicInstance: function() {
    return null;
  },
};
```

`NoopInternalComponent` assigns current ReactElement to `_renderedOutput` and `_currentElement`.

This is the reason why `ReactShallowRender` is `shallow`.

When you use `ReactShallowRenderer`, the root component is a `ShallowComponentWrapper`, which is based on `ReactCompositeComponent`.
the root component calls `mountComponent`, then calls `ReactReconciler.mountComponent`.
`ReactReconciler.mountCompnent` calls `mountCompnent` of `_instantiateReactComponent`.
`_instantiateReactComponent` is a `NoopInternalComponent`, of which `mountCompnent` is a noop function, threfore the its children components are never rendered.

```
ReactReconciler#mountCompnent
↓
ShallowComponentWrapper.mountComponent (ReactCompositeComponent)
↓
ReactReconciler#mountCompnent
↓
NoopInternalComponent#mountCompnent ←　noop function
```

Back to `performInitialMount`.

```js
    if (inst.componentWillMount) {
      if (__DEV__) {
        measureLifeCyclePerf(
          () => inst.componentWillMount(),
          debugID,
          'componentWillMount'
        );
      } else {
        inst.componentWillMount();
      }
      // When mounting, calls to `setState` by `componentWillMount` will set
      // `this._pendingStateQueue` without triggering a re-render.
      if (this._pendingStateQueue) {
        inst.state = this._processPendingState(inst.props, inst.context);
      }
    }

    // If not a stateless component, we now render
    if (renderedElement === undefined) {
      renderedElement = this._renderValidatedComponent();
    }
```

`performInitialMount` calls `componentWillMount`, then calls `_renderValidatedComponent`.
Let's get into `_renderValidatedComponent`.

* https://github.com/facebook/react/blob/v15.3.2/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js#L1059-L1083

```js
  _renderValidatedComponent: function() {
    var renderedComponent;
    if (__DEV__ || this._compositeType !== CompositeTypes.StatelessFunctional) {
      ReactCurrentOwner.current = this;
      try {
        renderedComponent =
          this._renderValidatedComponentWithoutOwnerOrContext();
      } finally {
        ReactCurrentOwner.current = null;
      }
    } else {
      renderedComponent =
        this._renderValidatedComponentWithoutOwnerOrContext();
    }
    invariant(
      // TODO: An `isValidNode` function would probably be more appropriate
      renderedComponent === null || renderedComponent === false ||
      ReactElement.isValidElement(renderedComponent),
      '%s.render(): A valid React element (or null) must be returned. You may have ' +
        'returned undefined, an array or some other invalid object.',
      this.getName() || 'ReactCompositeComponent'
    );

    return renderedComponent;
  },
```

`_renderValidatedComponent` is calling `_renderValidatedComponentWithoutOwnerOrContext`

* https://github.com/facebook/react/blob/v15.3.2/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js#L1029-L1054

```js
  _renderValidatedComponentWithoutOwnerOrContext: function() {
    var inst = this._instance;
    var renderedComponent;

    if (__DEV__) {
      renderedComponent = measureLifeCyclePerf(
        () => inst.render(),
        this._debugID,
        'render'
      );
    } else {
      renderedComponent = inst.render();
    }

    if (__DEV__) {
      // We allow auto-mocks to proceed as if they're returning null.
      if (renderedComponent === undefined &&
          inst.render._isMockFunction) {
        // This is probably bad practice. Consider warning here and
        // deprecating this convenience.
        renderedComponent = null;
      }
    }

    return renderedComponent;
  },
```

`_renderValidatedComponentWithoutOwnerOrContext` returns a rendered ReactElement, which is returned from `render`.

the variable name returned from the function is `renderedComponent`.
But it's a ReactElement. It's confusing. So I fixed it!

* https://github.com/facebook/react/pull/7863  

Finally, you can receive ReactElement from `render`!
`renderedComponent` is assigned to `this._renderedComponent._renderedOutput`.

```js
    // If not a stateless component, we now render
    if (renderedElement === undefined) {
      renderedElement = this._renderValidatedComponent();
    }

    var nodeType = ReactNodeTypes.getType(renderedElement);
    this._renderedNodeType = nodeType;
    var child = this._instantiateReactComponent(
      renderedElement,
      nodeType !== ReactNodeTypes.EMPTY /* shouldHaveDebugID */
    );
    this._renderedComponent = child;
```

You can get the ShallowRender element!

### getRenderOutput

* https://github.com/facebook/react/blob/v15.3.2/src/test/ReactTestUtils.js#L463

```js
return this.getRenderOutput();
```

`this.getRenderOutput` returns `this._instance._renderedComponent._renderedOutput`.
the `_renderedComponent` is an instance of `NoopInternalComponent`.
`_renderedOutput` is a ReactElement, which is equal to `_currentElement`.

* https://github.com/facebook/react/blob/v15.3.2/src/test/ReactTestUtils.js#L472-L478

```js
ReactShallowRenderer.prototype.getRenderOutput = function() {
  return (
    (this._instance && this._instance._renderedComponent &&
     this._instance._renderedComponent._renderedOutput)
    || null
  );
};
```

Finally, ReactShallowRender ends up returning a rendered ReactElement!

I think ReactShallowRender is a good place for starting to understand React rendering cycle.

If you are instested in it, you should read `Codebase Overview`, which is super helpful!!

* https://facebook.github.io/react/contributing/codebase-overview.html 
