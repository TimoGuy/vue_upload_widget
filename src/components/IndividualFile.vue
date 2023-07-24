<script>
import { filesize } from 'filesize';

export default {
    data() {
        return {
            progressBarState: 'none',
            uploadProgress: 0.0,
            uploadSuccess: false,
            abortController: new AbortController(),
            errorMessage: '',
            actualFilename: null,
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
                this.$emit('removeFilePrompted', this.removeFileEventPayload);
            } else {
                this.$emit('removeFileImmediate', this.removeFileEventPayload);
            }
        },
        stopFileUpload() {
            this.abortController.abort();  // @NOTE: this cancels the upload to the server.
            this.$emit('removeFileImmediate', this.removeFileEventPayload);
        }
    },
    computed: {
        removeFileEventPayload() {
            return {
                id: this.fileUploading.id,
                file: {
                    name: this.fileUploadingFilename,
                    size: this.fileUploading.file.size,
                },
            };
        },
        fileUploadingFilename() {
            return this.actualFilename || this.fileUploading.file.name;
        },
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
            let config = {
                headers: {'Content-Type': 'multipart/form-data'},
                onUploadProgress: e => {
                    console.log(e);
                    this.progressBarState = 'progress-bar';
                    this.uploadProgress = e.progress;
                },
                signal: this.abortController.signal,
            };

            let resp = await this.axios.post('/upload', uploadData, config);
            if (resp.data && resp.data.renamed_fname) {
                this.actualFilename = resp.data.renamed_fname;
            }

            this.progressBarState = 'none';
            this.uploadSuccess = true;
        } catch (error) {
            this.progressBarState = 'none';
            this.errorMessage = `${error.message}${!!error.request.statusText ? ' - ' : ''}${error.request.statusText}`;
        }
    },
    unmounted() {
    },
};
</script>

<template>
    <div class="individual-file">
        <div :style="progressBarCssVars" :class="['upload-progress-bar', progressBarState]"></div>
        <div class="content">
            <span>{{ fileUploadingFilename }}</span>
            <span class="filesize">{{ fileUploadingFilesize }}</span>
            <i v-if="progressBarState === 'none'" class="fa-solid fa-circle-xmark remove-file-button" @click="removeFile"></i>
            <i v-else class="fa-regular fa-circle-stop remove-file-button" @click="stopFileUpload"></i>
        </div>
        <div class="error-message" v-if="errorMessage">
            <i class="fa-solid fa-bomb"></i>
            <span class="error-header">Upload Failed</span>
            <span class="error-content">{{ errorMessage }}</span>
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
