<script>
import { filesize } from 'filesize';

export default {
    data() {
        return {
            progressBarState: 'none',
            uploadProgress: 0.0,
            uploadSuccess: false,
            errorMessage: '',
        };
    },
    props: {
        fileUploading: {
            type: Object,
            required: true,
        }
    },
    methods: {
        removeFile() {
            if (this.uploadSuccess) {
                this.$emit('removeFilePrompted');
            } else {
                this.$emit('removeFileImmediate');
            }
        },
    },
    computed: {
        fileUploadingFilesize() {
            return filesize(this.fileUploading.file.size);
        },
        progressBarCssVars() {
            return {  // @TODO: this css var is crunchy.
                '--progress-bar-progress': `calc(${this.uploadProgress * 100}% + (${this.uploadProgress} * 20px))`,
            };
        },
    },
    async mounted() {
        console.log(this.fileUploading);
        try {
            const uploadData = new FormData();
            uploadData.append('files', this.fileUploading.file);
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/upload', true);
            xhr.upload.onprogress = e => {
                console.log(e);
                this.progressBarState = 'progress-bar';
                this.uploadProgress = e.loaded / e.total;
            };
            xhr.upload.onabort = e => {
                this.progressBarState = 'none';
                this.errorMessage = 'ABORT occurred.';
            };
            xhr.upload.ontimeout = e => {
                this.progressBarState = 'none';
                this.errorMessage = 'TIMEOUT occurred.';
            };
            xhr.upload.onerror = e => {
                this.progressBarState = 'none';
                this.errorMessage = 'ERROR occurred.';
            };
            xhr.upload.onload = e => {
                this.progressBarState = 'throbber';
            };
            xhr.upload.onloadstart = e => {
                this.progressBarState = 'progress-bar';
                this.uploadProgress = 0.0;
            };
            xhr.upload.onloadend = e => {
                this.progressBarState = 'none';
                this.uploadSuccess = true;
            };
            xhr.send(uploadData);
        } catch (error) {
            console.error('error');
            console.error(error);
        }
    },
    unmounted() {
    },
};
</script>

<template>
    <!-- @TODO: need to figure out how to prevent background flickering (happens for 1 frame)
        when hovering over the <label> inside this div. -->
    <!-- @REPLY: it seems like the solution atm is having the return animation be slow enough where the user doesn't notice? -->
    <!-- @REPLY2: Maybe setting a debounce timer or something? -->
    <div class="individual-file">
        <div :style="progressBarCssVars" :class="['upload-progress-bar', progressBarState]"></div>
        <div class="content">
            <span>{{ fileUploading.file.name }}</span>
            <span class="filesize">{{ fileUploadingFilesize }}</span>
            <i class="fa-solid fa-circle-xmark remove-file-button" @click="removeFile"></i>
        </div>
    </div>
</template>

<style scoped lang="scss">
.individual-file {
    display: flex;
    flex-direction: column;
    padding: 10px;
    background: teal;
    border: 2px red solid;
    border-radius: 8px;

    .upload-progress-bar {
        width: calc(100% + 20px);
        height: 8px;
        margin-top: -10px;
        margin-left: -10px;
        margin-bottom: 2px;
        border-radius: 6px 6px 0 0;
        
        &.none {
            display: none;
        }

        &.throbber {
            background: green;
        }

        &.progress-bar {
            width: var(--progress-bar-progress);
            background: blue;
        }
    }

    .content {
        display: flex;

        input[type="file"] {
            display: none;
        }

        &.hovering-element {
            background: pink;
        }

        &.hovering-body {
            background: greenyellow;
        }

        .filesize {
            margin-left: auto;
            margin-right: 10px;
        }

        .remove-file-button {
            cursor: pointer;
            margin: auto 0;
        }
    }
}

</style>