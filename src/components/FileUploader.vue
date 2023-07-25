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
        triggerUploadFromFileSelectionDialog() {
            // @NOTE: if you select multiple files then hit open in the dialog,
            //        then none of the folders get put in `this.$refs.fileUploadButton.files`.
            Array.from(this.$refs.fileUploadButton.files).forEach(file => this.fileUpload(file));
            this.$refs.fileUploadButton.value = '';  // @BUGFIX: this reset allows the @change event to fire with the file selection dialog even when the same file is selected multiple times.
        },
        fileUpload(file) {
            this.filesUploading.push({
                id: this.filesUploadingNextKey++,
                file: file,
            });
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
        <IndividualFile style="margin-bottom: 8px;" :fileUploading="fileUploading" v-for="fileUploading in filesUploading" :key="fileUploading.id" @removeFilePrompted="openConfirmRemoveModal" @removeFileImmediate="removeFile" />
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
                    This operation cannot be undone.
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
        background: #0000002e;
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
        z-index: 2;
        background: blue;
        position: fixed;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
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
