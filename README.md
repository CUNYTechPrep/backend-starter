# Backend Starter Code


## Setup

- Edit `package.json`
    + Add your project name, version, description, authors
    + Add any other packages you may need

- Edit `config/config.json`
    + Add your username, password, and database names


## Explanations

- `/config/config.json`
    + This file contains the credentials for connecting to your postgres database. You need to make sure these details match your DB setup.
- `/controllers`
    + This is where you should store all the logic handling URL routes and business logic for your app.
    + `index.js` is where you load up the different files
    + You can write your controller code in many styles. I've provided you two options in the `home.js` and the `alt.js` files. Pick one style and use it for all of your controllers. This is really a matter of preference.
- `/models`
    + This is where your sequelize models will go.
    + `index.js`: you **do not** have to modify this file. This file connects to the Postgres database for you, loads up all models in the folder, and sets up all associations.
- `app.js`
    + This file sets up the basic packages for our projects. Feel free to add more as you see fit.
    + This file already loads up your controllers, so no additional loading is necessary for that to work.

## Optional

- If you want to add views and handlebars to your server side
    + Uncomment the corresponding code in `app.js`
    + Add a `/views` folder and the appropriate templates



