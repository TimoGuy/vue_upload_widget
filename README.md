# vue_upload_widget

## Project Setup

### UI Setup

```sh
npm install
```

#### Compile and Hot-Reload for Development

```sh
npm run dev
```

#### Compile and Minify for Production

```sh
npm run build
```

#### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### API Setup

```sh
cd py_upload_server
python -m venv venv
source venv/bin/activate  # MACOS
source venv/Scripts/activate  # Windows bash
pip install -r requirements.txt
python ./uploadserver_modded.py
```

### Note

If the API server does not start up on port `8000`, go to `vite.config.js` and edit the proxy to point to `localhost:<api port number>`.

## @TODO LIST

- [x] Create initial UI mockup.
    - [x] Simple setup
        - [x] Drag and drop functionality to grab in the files
        - [x] `Browse` button to select (and multiselect) files
        - [x] Add components that each have the progress bar/upload panel for each file added.
    - [x] Progress bar
        - [x] Variable updates progress of the progress bar
        - [x] Hidden mode
        - [x] Throbber mode
    - [x] Error capture
- [x] Spin up backend server to receive files.
    - [x] Nevermind, uploadserver is all good. Had to set up a proxy thru `vite.config.js` to get around CORS disallowing the Vue app's origin.
    - [x] Create delete endpoint.
- [x] Connect UI to upload file to server.
    - [x] Create XHR request.
    - [x] Monitor progress of upload.
    - [x] Confirm upload finished.
    - [x] Pressing X while file is uploading cancels/aborts the upload request to the server.
        - [x] check that uploadserver deletes the temp in-flight file (answer: it does)
    - [x] Capture any errors that occur.
        - It seems like the errors that are produced are really low quality.
        - [x] Make an api endpoint to manually test what UI would look like with a 400/500 error.
            - This is to see where the server message comes from in the response data structure.
        - [x] Show server message in the error message UI.
    - [x] Delete the files that are uploaded.
        - [x] Get simple DELETE /upload endpoint running with querystrings showing which filename to delete.
        - ~~[ ] NOTE: run the server with the args that files are overwritten.~~
            - This could be bad if the same file gets uploaded twice and then gets deleted twice.
            - The best thing to do is to change the POST endpoint of the /upload endpoint to return the actual filename of the file that got uploaded (since it can auto rename if there is a name collision)
        - [x] Change POST /update to return name of the auto rename.
        - [x] Inject the new name into the removeFile events.
- [x] BUG: you can't upload the same file twice????
    - Turns out that the filepath gets saved in the file select input element, so if you select the same file twice, it will not trigger `@change`, so I had to reset the selected file so that the same file selected will still trigger `@change` (NOTE: this doesn't affect dropping a file in bc it doesn't use the file selection dialog)
- [ ] Make it look good.
    - [x] Do basic, overall styling.
    - [x] Fix drag over flickering.
    - [x] Fix progress bar's top right rounded corner (Look up how to have the background color change/scroll across instead of changing the width property maybe?)
    - [x] Make the delete confirmation modal actually look like something.
    - [x] Create animated throbber.
    - [ ] (MAYBE) Figure out how to get progress bar to smoothly animate over.
- [x] Limit filesize to 50mb
    - [x] Make check.
    - [x] Create UI side error message.
- [x] Limit to only 3 uploads at a time.
    - [x] Have `IndividualFile.vue` emit event that their upload finished or failed.
    - [x] Find next pending job and let it upload.
        - https://stackoverflow.com/questions/67371579/vue-3-emit-event-from-parent-to-child-component
        - https://vuejs.org/guide/essentials/template-refs.html#accessing-the-refs
        - Apparently refs in v-for are fixed after v3.2.47 or something like that? It should just work.
    - [x] In UI for the pending files, have the text "pending" after the file name.
        - Instead of pending (since it can use more space than wanted), there's a simple throbber anim.
    - [x] BUG: If you cancel an upload of a file, then it will start another upload process for one of the files that's already in there.
        - It looks like it's trying to fetch a certain file but it's one index off.
        - Fixed it by making `IndividualFile.vue` components poll at an interval to request an uploading spot.
            - [ ] With this method, there may be race conditions. Study JS to see if this is true.
