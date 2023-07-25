<script>
import { filesize } from 'filesize';
import IndividualFile from './IndividualFile.vue';
import _ from 'lodash';

export default {
    data() {
        return {
            fileDragOverBody: false,
            fileDragOverElement: false,
            filesUploading: [],
            filesUploadingNextKey: 0,
            filesUploadingUploadingIds: [],
            pendingDeletingFile: null,
            dragOverElementDebounce: null,
            dragOverBodyDebounce: null,
        };
    },
    methods: {
        triggerUploadFromDroppedFiles(e) {
            this.fileDragOverElement = false;
            Array.from(e.dataTransfer.files).forEach(file => this.fileUpload(file));
        },
        async triggerUploadFromFileSelectionDialog() {
            // @NOTE: if you select multiple files then hit open in the dialog,
            //        then none of the folders get put in `this.$refs.fileUploadButton.files`.
            Array.from(this.$refs.fileUploadButton.files).forEach(file => this.fileUpload(file));
            this.$refs.fileUploadButton.value = '';  // @BUGFIX: this reset allows the @change event to fire with the file selection dialog even when the same file is selected multiple times.
        },
        fileUpload(file) {
            let fileUploading = {
                id: this.filesUploadingNextKey++,
                file: file,
            };
            this.filesUploading.push(fileUploading);
        },
        tryStartUploadingProcess(fileId) {
            if (this.filesUploadingUploadingIds.length >= 3)
                return;  // Limit uploads to max 3

            // Trigger starting upload process and add file id to uploading ids.
            for (let i = 0; i < this.filesUploading.length; i++) {
                if (this.filesUploading[i].id === fileId) {
                    this.$refs.individualFiles[i].startUploadProcess();
                    this.filesUploadingUploadingIds.push(fileId);  // @TODO: are JS race conditions a thing? This function might be multithreaded since it came from a `setInterval`-based function.
                    break;
                }
            }
        },
        unlockUploadSpot(fileId) {
            // Remove file id from uploading files list, then try starting an upload process with the next pending file.
            for (let i = 0; i < this.filesUploadingUploadingIds.length; i++) {
                if (this.filesUploadingUploadingIds[i] === fileId) {
                    this.filesUploadingUploadingIds.splice(i, 1);
                    return;
                }
            }

            console.error(`ERROR: fileId ${fileId} not found in uploading files.`);
        },
        onElementDragEnterOver() {
            this.fileDragOverElement = true;
            this.dragOverElementDebounce();
        },
        onPageDragEnterOverListener(e) {
            e.preventDefault();
            e.stopPropagation();
            this.fileDragOverBody = true;
            this.dragOverBodyDebounce();
        },
        onPageDropListener(e) {
            this.fileDragOverBody = false;
        },
        openConfirmRemoveModal(fileUploading) {
            this.pendingDeletingFile = fileUploading;
        },
        removePendingFileUploading() {
            this.removeFile(this.pendingDeletingFile);
            this.pendingDeletingFile = null;
        },
        removeFile(file) {
            for (let i = 0; i < this.filesUploading.length; i++) {
                if (this.filesUploading[i].id === file.id) {
                    this.filesUploading.splice(i, 1);
                    break;
                }
            }

            this.axios.delete(`/upload?fname=${encodeURIComponent(file.file.name)}`);
        },
    },
    computed: {
        fileDragOverCSSClass() {
            if (this.fileDragOverElement) {
                return 'hovering-element';
            }
            if (this.fileDragOverBody) {
                return 'hovering-body';
            }
            return '';
        },
        pendingDeletingFileFilesize() {
            return filesize(this.pendingDeletingFile.file.size);
        }
    },
    mounted() {
        document.body.addEventListener('dragenter', this.onPageDragEnterOverListener, false);
        document.body.addEventListener('dragover', this.onPageDragEnterOverListener, false);
        document.body.addEventListener('drop', this.onPageDropListener, false);

        this.dragOverElementDebounce =
            _.debounce(() => {
                this.fileDragOverElement = false;
            }, 100);
        this.dragOverBodyDebounce =
            _.debounce(() => {
                this.fileDragOverBody = false;
            }, 100);
    },
    unmounted() {
        document.body.removeEventListener('dragenter', this.onPageDragEnterOverListener, false);
        document.body.removeEventListener('dragover', this.onPageDragEnterOverListener, false);
        document.body.removeEventListener('drop', this.onPageDropListener, false);
    },
    components: {
        IndividualFile,
    },
};
</script>

<template>
    <div>
        <IndividualFile ref="individualFiles" style="margin-bottom: 8px;" :fileUploading="fileUploading" v-for="fileUploading in filesUploading" :key="fileUploading.id" @removeFilePrompted="openConfirmRemoveModal" @removeFileImmediate="removeFile" @requestUploadSpot="tryStartUploadingProcess" @unlockUploadSpot="unlockUploadSpot" />
        <div
            :class="['file-uploader', fileDragOverCSSClass]"
            @dragenter.prevent.stop="onElementDragEnterOver"
            @dragover.prevent.stop="onElementDragEnterOver"
            @drop.prevent.stop="triggerUploadFromDroppedFiles"
        >
            <i :class="['fa-solid', 'fa-paperclip', {'wiggle': fileDragOverBody || fileDragOverElement}]"></i>
            <div class="file-uploader-content">
                <div class="main-content">
                    Drag and drop or 
                    <input type="file" id="file-upload-button" ref="fileUploadButton" @change="triggerUploadFromFileSelectionDialog" multiple />
                    <label for="file-upload-button" class="link">browse</label>
                </div>
                <div class="sub-content">50 MB max file size. Most file types are accepted.</div>
            </div>
        </div>

        <!-- Confirm deleting upload file modal -->
        <div class="modal" v-if="pendingDeletingFile">
            <div class="modal-background"></div>
            <div class="content">
                <div class="header">
                    Are you sure you want to delete this file?
                    <i class="fa-solid fa-circle-xmark exit-button" @click="pendingDeletingFile = null"></i>
                </div>
                <div class="body">
                    <div class="pending-file">
                        <span class="filename">{{ pendingDeletingFile.file.name }}</span>
                        <span class="filesize">{{ pendingDeletingFileFilesize }}</span>
                    </div>
                    <span class="warning-message">This operation cannot be undone.</span>
                </div>
                <div class="footer">
                    <div class="button ghost" @click="removePendingFileUploading">Delete File</div>
                    <div class="button" @click="pendingDeletingFile = null">Cancel</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.file-uploader {
    padding: 10px;
    background: var(--color-background-mute);
    border: 2px var(--color-border) dashed;
    border-radius: 8px;
    display: flex;
    align-items: center;
    transition: background 0.25s ease,
                border-color 0.25s ease;

    &.hovering-element {
        background: var(--vt-c-blue-background-light);
        border-color: var(--vt-c-blue-background-light);
    }

    &.hovering-body {
        background: var(--vt-c-blue-background);
        border-color: var(--vt-c-blue-background);
    }

    .file-uploader-content {
        margin-left: 10px;

        .main-content {
            font-weight: 500;
            color: var(--color-text);
        }

        .sub-content {
            font-weight: 400;
            color: var(--color-text-2);
        }

        input[type="file"] {
            display: none;
        }
    }
}

.modal {
    position: fixed;

    .modal-background {
        z-index: 1;
        background: #00000052;
        animation: fade_in 0.15s ease-in;
        position: fixed;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
    }

    @keyframes fade_in {
        0% { opacity: 0.0; }
        100% { opacity: 1.0; }
    }

    .content {
        border-radius: 8px;
        z-index: 2;
        background: var(--vt-c-red);
        position: fixed;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 480px;

        .header {
            display: flex;
            align-items: center;
            border-bottom: 1px var(--vt-c-red-border) solid;
            padding: 10px 20px;
            font-weight: 600;
            font-size: 1.2em;

            .exit-button {
                cursor: pointer;
                margin-left: auto;

                &:hover {
                    opacity: 0.7;
                }
            }
        }

        .body {
            padding: 16px 20px;  // I just felt like 16px looked better than 15px.
            display: flex;
            flex-direction: column;

            .pending-file {
                display: flex;
                background: var(--vt-c-white-soft);
                color: var(--vt-c-text-light-1);
                padding: 15px 20px;
                border-radius: 8px;

                .filename {
                    font-weight: 700;
                }

                .filesize {
                    margin-left: auto;
                    color: var(--vt-c-text-light-2);
                    font-weight: 500;
                }
            }

            .warning-message {
                margin-top: 10px;
            }
        }

        .footer {
            display: flex;
            justify-content: flex-end;
            padding: 15px 20px;
            border-top: 1px var(--vt-c-red-border) solid;

        }
    }
}

.button {
    cursor: pointer;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--vt-c-white-soft);
    color: var(--vt-c-text-light-1);
    font-weight: 700;
    font-size: 0.9em;
    margin-left: 8px;

    &.ghost {
        border: 1px var(--vt-c-white-soft) solid;
        background: transparent;
        color: var(--vt-c-white-soft);

        &:hover {
            background: var(--vt-c-white-soft-02-alpha);
        }
    }

    &:hover {
        background: var(--vt-c-white-soft-07-alpha);
    }
}

.link {
    cursor: pointer;
    color: var(--vt-c-blue);
    text-decoration: underline;

    &:hover {
        opacity: 0.7;
    }
}

.wiggle {
    animation: wiggle 0.15s forwards;
}

@keyframes wiggle {
    0% { transform: rotate(0deg); }
   33% { transform: rotate(15deg); }
   66% { transform: rotate(-15deg); }
  100% { transform: rotate(0deg); }
}
</style>
