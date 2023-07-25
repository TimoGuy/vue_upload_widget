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
            return {
                '--progress-bar-progress': `${this.uploadProgress * 100}%`,
            };
        },
    },
    async mounted() {
        try {
            if (this.fileUploading.file.size > 52_428_800) {  // 50MB
                let error = {
                    message: `File exceeds 50 MB. File size: ${this.fileUploadingFilesize}`,
                    request: {},
                };
                throw error;
            }

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
            this.errorMessage = `${error.message}${!!error.request.statusText ? ` - ${error.request.statusText}` : ''}`;
        }
    },
    unmounted() {
    },
};
</script>

<template>
    <div>
        <div :class="['individual-file', {'bottom-sharp-corners': errorMessage}]">
            <div :style="progressBarCssVars" :class="['upload-progress-bar', progressBarState]"></div>
            <div class="content">
                <span>{{ fileUploadingFilename }}</span>
                <span class="filesize">{{ fileUploadingFilesize }}</span>
                <i v-if="progressBarState === 'none'" class="fa-solid fa-circle-xmark remove-file-button" @click="removeFile"></i>
                <i v-else class="fa-regular fa-circle-stop remove-file-button" @click="stopFileUpload"></i>
            </div>
        </div>
        <div class="error-message" v-if="errorMessage">
            <span class="error-header">
                <i class="fa-solid fa-bomb"></i>
                Upload Failed
            </span>
            <span class="error-content">{{ errorMessage }}</span>
        </div>
    </div>
</template>

<style scoped lang="scss">
.individual-file {
    display: flex;
    flex-direction: column;
    padding: 10px;
    background: var(--color-background-mute);
    border: 2px var(--color-border) solid;
    border-radius: 8px;
    font-weight: 400;
    color: var(--color-text);

    &.bottom-sharp-corners {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        background: var(--vt-c-red-background);
        border: 2px var(--vt-c-red-darker) solid;
    }

    .upload-progress-bar {
        width: calc(100% + 20px);
        height: 5px;
        margin-top: -10px;
        margin-left: -10px;
        margin-bottom: 5px;
        border-radius: 6px 6px 0 0;
        
        &.none {
            display: none;
        }

        &.throbber {
            background: green;
        }

        &.progress-bar {
            background: linear-gradient(to right, var(--vt-c-blue-darker) var(--progress-bar-progress), var(--vt-c-blue-background) var(--progress-bar-progress));
        }
    }

    .content {
        display: flex;

        .filesize {
            margin-left: auto;
            margin-right: 20px;
            font-weight: 400;
            color: var(--color-text-2);
        }

        .remove-file-button {
            cursor: pointer;
            margin: auto 0;

            &:hover {
                opacity: 0.7;
            }
        }
    }
}

.error-message {
    display: flex;
    flex-direction: column;
    padding: 10px;
    background: var(--vt-c-red);
    border: 2px var(--vt-c-red-darker) solid;
    border-top: 0;
    border-radius: 0 0 8px 8px;
    font-weight: 400;
    color: var(--color-text);

    .error-header {
        font-weight: 700;
    }

    .error-content {
        font-weight: 400;
    }
}

</style>
