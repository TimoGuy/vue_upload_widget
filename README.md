# vue_upload_widget

## @TODO LIST

- [ ] Create initial UI mockup.
    - [x] Simple setup
        - [x] Drag and drop functionality to grab in the files
        - [x] `Browse` button to select (and multiselect) files
        - [x] Add components that each have the progress bar/upload panel for each file added.
    - [x] Progress bar
        - [x] Variable updates progress of the progress bar
        - [x] Hidden mode
        - [x] Throbber mode
    - [ ] Error capture
- [x] Spin up backend server to receive files.
    - [x] Nevermind, uploadserver is all good. Had to set up a proxy thru `vite.config.js` to get around CORS disallowing the Vue app's origin.
    - [x] Create delete endpoint.
- [ ] Connect UI to upload file to server.
    - [x] Create XHR request.
    - [x] Monitor progress of upload.
    - [ ] Confirm upload finished.
    - [ ] Capture any errors that occur.
        - [ ] Have upload process start with 
    - [ ] Delete the files that are uploaded.
        - [x] Get simple DELETE /upload endpoint running with querystrings showing which filename to delete.
        - ~~[ ] NOTE: run the server with the args that files are overwritten.~~
            - This could be bad if the same file gets uploaded twice and then gets deleted twice.
            - The best thing to do is to change the POST endpoint of the /upload endpoint to return the actual filename of the file that got uploaded (since it can auto rename if there is a name collision)
        - [ ] Change POST /update to return name of the auto rename.
- [ ] Make it look good.
    - [ ] Fix progress bar's top right rounded corner (Look up how to have the background color change/scroll across instead of changing the width property maybe?)
    - [ ] Make the delete confirmation modal actually look like something.


## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
