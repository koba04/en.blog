---
type: post
author: koba04
email: koba0004@gmail.com
tags: react.js,esdoc
slug: esdoc-documentation-for-react-and-es6
title: Write a documentation React and ES6 project by ESDoc
description: ESDoc is a new documentation tool for ES6 (& React).
---

What do you use documentation generator library? JSDoc? none?

I don't used to write a documentation. Now I start using ESDoc.

## ESDoc

https://esdoc.org/

![ESDoc](/content/images/posts/esdoc-documentation-for-react-and-es6/esdoc.png)

ESDoc feature is

* Generates detailed document.
* Measures document coverage.
* Cross reference of test and document.
* Targets at ES6 class and import/export style.

## Getting Started

* At first, you install ESDoc from npm.

```
npm install -D esdoc
```

* Next, you create `esdoc.json` like below.

```json
{
  "source": "app",
  "destination": "./dist/esdoc"
}
```

`esdoc.json` configuration is here.

   * https://esdoc.org/config.html

And you add `npm run script` setting into your package.json.

```
"scripts": {
  :
  "lint": "eslint app",
  "doc": "esdoc -c esdoc.json",
  "postinstall": "npm run build && npm run doc"
},
```

Last, you can run ESDoc!

```
➜  npm run doc                                                                                                                                   (master)[/Users/koba04/repos/github/react-boilerplate]

> react-boilerplate@0.4.0 doc /Users/koba04/repos/github/react-boilerplate
> esdoc -c esdoc.json

identifiers.html
index.html
class/app/components/App.js~App.html
class/app/components/Artist.js~Artist.html
:
:
file/app/server.js.html
file/app/stores/TrackStore.js.html
./css
./script
./image
script/search_index.js
source.html
==================================
Coverage: 100% (38/38)
==================================
```

## My React boilerplate

I added ESDoc to my react-boilerplate.

https://github.com/koba04/react-boilerplate

My react-boilerplate ESDoc can see this.

http://react-serverside-rendering.herokuapp.com/esdoc/

![My ESDoc](/content/images/posts/esdoc-documentation-for-react-and-es6/my-esdoc.png)

### Documentation for React Component

I wrote ESDoc for my React Component.

```js
import React from 'react';
import {
    fetchByArtist
}
from '../actions/AppTracksActionCreators';

/**
 * input form commponent for artist name
 */
export
default class InputArtist extends React.Component {
    /**
     * constructor
     * @param {object} props
     */
    constructor(props) {
        super(props);
        /**
         * @type {object}
         * @property {string} inputArtist search artist
         */
        this.state = {
            inputArtist: 'radiohead'
        };
    }
    /**
     * handle submit form event
     * @param {SytheticEvent} e
     */
    handleSubmit(e) {
        e.preventDefault();
        const artist = this.state.inputArtist;
        if (artist) fetchByArtist(artist);
    }
    /**
     * handle change event at input form
     * @param {SytheticEvent} e
     */
    onInputChange(e) {
        this.setState({
            inputArtist: e.target.value
        });
    }
    /**
     * render
     * @return {ReactElement} markup
     */
    render() {
        return ( < form className = "form-horizontal"
            role = "form"
            onSubmit = {
                this.handleSubmit.bind(this)
            } > < div className = "form-group" > < label htmlFor = "js-input-location"
            className = "col-sm-1 control-label" > Artist < /label>
          <div className="col-sm-11">
            <input
              type="text"
              className="form-control"
              placeholder="Input Atrist Name"
              value={this.state.inputArtist}
              onChange={this.onInputChange.bind(this)}
              required={true}
            / > < /div>
        </div > < div className = "form-group" > < div className = "col-sm-offset-1 col-sm-11" > < button type = "submit"
            className = "btn btn-primary" > < span className = "glyphicon glyphicon-search" > search < /span></button > < /div>
        </div > < /form>
    );
  }
}
```

#### PropTypes

Prop is a component interface.
I'd like to write a documetation against the Prop.
Because of this, I wrote the Prop documentation at the propTypes.

```js
/**
 * propTypes
 * @property {array} selectable counrty list
 */
static get propTypes() {
  return {
    countries: React.PropTypes.array
  };
}
```

↓

![PropTypes documentation](/content/images/posts/esdoc-documentation-for-react-and-es6/proptypes.png)

#### State

State is a component internal property.
Do you have to write State documetation? It may not require.
But I think it is useful when somebody modifies the component.

```js
/**
 * constructor
 * @param {object} props
 */
constructor(props) {
    super(props);
    /**
     * @type {object}
     * @property {string} inputArtist search artist
     */
    this.state = {
        inputArtist: 'radiohead'
    };
}
```

↓

![State documentation](/content/images/posts/esdoc-documentation-for-react-and-es6/state.png)

## Documentation coverage.

ESDoc measures the documentation coverage.
It makes me write documentations for all 100%!

![Documentation coverage](/content/images/posts/esdoc-documentation-for-react-and-es6/coverage.png)

Writing a documentation is often boring.
But it makes me consider api interface. :)
