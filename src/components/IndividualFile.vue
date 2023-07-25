<script>
import { filesize } from 'filesize';

export default {
    data() {
        return {
            isMounted: false,
            requestUploadSlotInterval: null,
            progressBarState: 'throbber',
            throbberAnimationOffset: null,
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
            this.$emit('unlockUploadSpot', this.fileUploading.id);
        },
        async startUploadProcess() {
            clearTimeout(this.requestUploadSlotInterval);

            try {
                if (this.fileUploading.file.size > 52_428_800) {  // 50MB limit.
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
                this.$emit('unlockUploadSpot', this.fileUploading.id);
            } catch (error) {
                this.progressBarState = 'none';
                this.errorMessage = `${error.message}${!!error.request.statusText ? ` - ${error.request.statusText}` : ''}`;
                this.$emit('unlockUploadSpot', this.fileUploading.id);
            }
        },
    },
    expose: ['startUploadProcess'],
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
            if (!this.isMounted)
                return;

            return {
                '--progress-bar-progress': `${this.uploadProgress * 100}%`,
                '--throbber-container-width': `${this.$refs.componentRef.clientWidth}px`,
                '--throbber-swig-width': `${this.$refs.componentRef.clientWidth * 0.2}px`,
                '--throbber-animation-offset': `${this.throbberAnimationOffset}s`,
            };
        },
    },
    mounted() {
        this.isMounted = true;
        this.throbberAnimationOffset = (Math.random() - 1.0) * 2.0;
        this.requestUploadSlotInterval =
            setInterval(
                () => {
                    this.$emit('requestUploadSpot', this.fileUploading.id);
                },
                1000
            );
    },
    unmounted() {
        clearTimeout(this.requestUploadSlotInterval);
    },
};
</script>

<template>
    <div ref="componentRef">
        <div :class="['individual-file', {'bottom-sharp-corners': errorMessage}]">
            <div :style="progressBarCssVars" :class="['upload-progress-bar', progressBarState]"></div>
            <div class="content">
                <span>{{ fileUploadingFilename }}</span>
                <span class="filesize">{{ fileUploadingFilesize }}</span>
                <i v-if="progressBarState === 'progress-bar'"  class="fa-regular fa-circle-stop remove-file-button" @click="stopFileUpload"></i>
                <i v-else class="fa-solid fa-circle-xmark remove-file-button" @click="removeFile"></i>
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
            animation: throbber_bar 1s ease-in-out infinite alternate;
            animation-delay: var(--throbber-animation-offset);
            background: linear-gradient(to right, var(--vt-c-blue-background) 0%, var(--vt-c-blue-darker) 0%, var(--vt-c-blue-darker) 20%, var(--vt-c-blue-background) 20%);
        }
        
        &.progress-bar {
            background: linear-gradient(to right, var(--vt-c-blue-darker) var(--progress-bar-progress), var(--vt-c-blue-background) var(--progress-bar-progress));
        }
        
        @keyframes throbber_bar {
            0% { background-position: 0px; }
            100% { background-position: calc(var(--throbber-container-width) - var(--throbber-swig-width)); }
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
