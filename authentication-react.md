# Authentication in React Guide

## Start a React application

Use `create-react-app` to start a new React app:

```
npx create-react-app auth-example
cd auth-example
```

Next, install `react-router-dom` in the project:

```
npm install react-router-dom
```

Next, add a proxy setting at the _bottom_ of the `package.json` file:

```json
"proxy": "http://localhost:8000"
```

> NOTE: if you add the proxy after the react app is already running, it will not take effect until you **restart** the app.
> 
> ALSO, make sure the backend running on port 8000 is already running before starting up the frontend with proxy.

Finally, you can start up the react app:

```
npm start
```

## React Router Auth Example

We will build a simple login form and protected routes on our frontend by building on React Routers Auth Example code found here: 

https://reacttraining.com/react-router/web/example/auth-workflow

First, familiarize your self with the code in the example. Then, copy the example code and paste it into a new file `src/AuthExample.js`:

```js
import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
  withRouter
} from "react-router-dom";

////////////////////////////////////////////////////////////
// 1. Click the public page
// 2. Click the protected page
// 3. Log in
// 4. Click the back button, note the URL each time

function AuthExample() {
  return (
    <Router>
      <div>
        <AuthButton />
        <ul>
          <li>
            <Link to="/public">Public Page</Link>
          </li>
          <li>
            <Link to="/protected">Protected Page</Link>
          </li>
        </ul>
        <Route path="/public" component={Public} />
        <Route path="/login" component={Login} />
        <PrivateRoute path="/protected" component={Protected} />
      </div>
    </Router>
  );
}

const fakeAuth = {
  isAuthenticated: false,
  authenticate(cb) {
    this.isAuthenticated = true;
    setTimeout(cb, 100); // fake async
  },
  signout(cb) {
    this.isAuthenticated = false;
    setTimeout(cb, 100);
  }
};

const AuthButton = withRouter(
  ({ history }) =>
    fakeAuth.isAuthenticated ? (
      <p>
        Welcome!{" "}
        <button
          onClick={() => {
            fakeAuth.signout(() => history.push("/"));
          }}
        >
          Sign out
        </button>
      </p>
    ) : (
      <p>You are not logged in.</p>
    )
);

function PrivateRoute({ component: Component, ...rest }) {
  return (
    <Route
      {...rest}
      render={props =>
        fakeAuth.isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
}

function Public() {
  return <h3>Public</h3>;
}

function Protected() {
  return <h3>Protected</h3>;
}

class Login extends React.Component {
  state = { redirectToReferrer: false };

  login = () => {
    fakeAuth.authenticate(() => {
      this.setState({ redirectToReferrer: true });
    });
  };

  render() {
    let { from } = this.props.location.state || { from: { pathname: "/" } };
    let { redirectToReferrer } = this.state;

    if (redirectToReferrer) return <Redirect to={from} />;

    return (
      <div>
        <p>You must log in to view the page at {from.pathname}</p>
        <button onClick={this.login}>Log in</button>
      </div>
    );
  }
}

export default AuthExample;
```

Now, modify your `src/App.js` by removing the example code, with code that loads up the AuthExample component:

```js
import React, { Component } from 'react';
import './App.css';
import AuthExample from './AuthExample';

class App extends Component {
  render() {
    return (
      <AuthExample />
    );
  }
}

export default App;
```

At this point, you should verify that the example is working on your local machine the same as it was on the React Router example page.

### Implementing REAL authentication

In the above example, clicking on the "Log in" button will automatically successfully log in the user. What we actually want is a realistic authentication workflow, where we ask the user for an email and password, and we then make a _call to our backend_ to verify if the user credentials are correct. 

First, we add the login fields to the `Login` component:

```js
    <input type="text" placeholder="Email" value={this.state.email} onChange={this.emailChanged} />
    <input type="text" placeholder="Password" value={this.state.password} onChange={this.passwordChanged} />
```

We also need to add `email` and `password` to the state of the `Login` component:

```js
state = {
  redirectToReferrer: false,
  email: "",
  password: "",
};
```

And we need to add the `onChange` handlers for the two fields:

```js
  emailChanged = (event) => {
    this.setState({ email: event.target.value });
  }

  passwordChanged = (event) => {
    this.setState({ password: event.target.value });
  }
```

Next we update the `login()` button handler function to pass the email and password to our `fakeAuth` object:

```js
  login = () => {
    fakeAuth.authenticate(this.state.email, this.state.password, () => {
      this.setState({ redirectToReferrer: true });
    });
  };
```

Now that the `Login` component is ready to receive credentials, we need to update the `fakeAuth` object. We will modify it to actually check the backend to determine if the user should be allowed to login.

```js
authenticate(email, password, cb) {
    fetch('/auth/login', {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      headers: {
          "Content-Type": "application/json; charset=utf-8",
          // "Content-Type": "application/x-www-form-urlencoded",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    }).then(response => {
      if(response.status === 200) {
        this.isAuthenticated = true;
        return response.json();
      }
    }).then(body => {
      console.log(body);
      cb();
    });
  },
```

With the code above, we have updated the `authenticate()` function to receive `email` and `password`. The function then proceeds to make a request to the backend using `fetch()`. If the response status code is 200, we have succeeded at logging in, and the code will log us in. Otherwise, `isAuthenticated` will remain false.

### Resources

React Router Introduction Video:
    - https://reacttraining.com/react-router/

React Router Authentication Example Video (using Fake Authentication)
    - https://tylermcginnis.com/react-router-protected-routes-authentication/

Using `fetch()`: 
    - https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch



### Complete code for AuthExample.js with a REAL login

```js
// AuthExample.js

import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
  withRouter
} from "react-router-dom";

////////////////////////////////////////////////////////////
// 1. Click the public page
// 2. Click the protected page
// 3. Log in
// 4. Click the back button, note the URL each time

function AuthExample() {
  return (
    <Router>
      <div>
        <AuthButton />
        <ul>
          <li>
            <Link to="/public">Public Page</Link>
          </li>
          <li>
            <Link to="/protected">Protected Page</Link>
          </li>
        </ul>
        <Route path="/public" component={Public} />
        <Route path="/login" component={Login} />
        <PrivateRoute path="/protected" component={Protected} />
      </div>
    </Router>
  );
}

const fakeAuth = {
  isAuthenticated: false,
  authenticate(email, password, cb) {
    fetch('/auth/login', {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      headers: {
          "Content-Type": "application/json; charset=utf-8",
          // "Content-Type": "application/x-www-form-urlencoded",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    }).then(response => {
      if(response.status === 200) {
        this.isAuthenticated = true;
        return response.json();
      }
    }).then(body => {
      console.log(body);
      cb();
    });
  },
  signout(cb) {
    this.isAuthenticated = false;
    setTimeout(cb, 100);
  }
};

const AuthButton = withRouter(
  ({ history }) =>
    fakeAuth.isAuthenticated ? (
      <p>
        Welcome!{" "}
        <button
          onClick={() => {
            fakeAuth.signout(() => history.push("/"));
          }}
        >
          Sign out
        </button>
      </p>
    ) : (
      <p>You are not logged in.</p>
    )
);

function PrivateRoute({ component: Component, ...rest }) {
  return (
    <Route
      {...rest}
      render={props =>
        fakeAuth.isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
}

function Public() {
  return <h3>Public</h3>;
}

function Protected() {
  return <h3>Protected</h3>;
}

class Login extends React.Component {
  state = {
    redirectToReferrer: false,
    email: "",
    password: "",
  };

  login = () => {
    fakeAuth.authenticate(this.state.email, this.state.password, () => {
      this.setState({ redirectToReferrer: true });
    });
  };

  emailChanged = (event) => {
    this.setState({ email: event.target.value });
  }

  passwordChanged = (event) => {
    this.setState({ password: event.target.value });
  }

  render() {
    let { from } = this.props.location.state || { from: { pathname: "/" } };
    let { redirectToReferrer } = this.state;

    if (redirectToReferrer) return <Redirect to={from} />;

    return (
      <div>
        <p>You must log in to view the page at {from.pathname}</p>
        <input type="text" placeholder="Email" value={this.state.email} onChange={this.emailChanged} />
        <input type="text" placeholder="Password" value={this.state.password} onChange={this.passwordChanged} />
        <button onClick={this.login}>Log in</button>
      </div>
    );
  }
}

export default AuthExample;
```
