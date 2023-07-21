<script>
import { filesize } from 'filesize';
import IndividualFile from './IndividualFile.vue';

export default {
    data() {
        return {
            fileDragOverBody: false,
            fileDragOverElement: false,
            filesUploading: [],
            filesUploadingNextKey: 0,
            pendingDeletingFile: null,
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
        },
        fileUpload(file) {
            this.filesUploading.push({
                id: this.filesUploadingNextKey++,
                file: file,
            });
        },
        onPageDragEnterOverListener(e) {
            e.preventDefault();
            e.stopPropagation();
            this.fileDragOverBody = true;
        },
        onPageDragLeaveListener(e) {
            e.preventDefault();
            e.stopPropagation();
            this.fileDragOverBody = false;
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
        document.body.addEventListener('dragleave', this.onPageDragLeaveListener, false);
        document.body.addEventListener('drop', this.onPageDropListener, false);
    },
    unmounted() {
        document.body.removeEventListener('dragenter', this.onPageDragEnterOverListener, false);
        document.body.removeEventListener('dragover', this.onPageDragEnterOverListener, false);
        document.body.removeEventListener('dragleave', this.onPageDragLeaveListener, false);
        document.body.removeEventListener('drop', this.onPageDropListener, false);
    },
    components: {
        IndividualFile,
    },
};
</script>

<template>
    <!-- @TODO: need to figure out how to prevent background flickering (happens for 1 frame)
        when hovering over the <label> inside this div. -->
    <!-- @REPLY: it seems like the solution atm is having the return animation be slow enough where the user doesn't notice? -->
    <!-- @REPLY2: Maybe setting a debounce timer or something? -->
    <div>
        <IndividualFile style="margin-bottom: 8px;" :fileUploading="fileUploading" v-for="fileUploading in filesUploading" :key="fileUploading.id" @removeFilePrompted="openConfirmRemoveModal(fileUploading)" @removeFileImmediate="removeFile(fileUploading)" />
        <div
            :class="['file-uploader', fileDragOverCSSClass]"
            @dragenter.prevent.stop="fileDragOverElement = true"
            @dragover.prevent.stop="fileDragOverElement = true"
            @dragleave.prevent.stop="fileDragOverElement = false"
            @drop.prevent.stop="triggerUploadFromDroppedFiles"
        >
            Drag and drop or 
            <input type="file" id="file-upload-button" ref="fileUploadButton" @change="triggerUploadFromFileSelectionDialog" multiple />
            <label for="file-upload-button" class="link">browse</label>
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
    background: teal;
    border: 2px red dashed;
    border-radius: 8px;

    input[type="file"] {
        display: none;
    }

    &.hovering-element {
        background: pink;
    }

    &.hovering-body {
        background: greenyellow;
    }
}

.modal {
    position: fixed;

    .modal-background {
        z-index: 1;
        background: rgb(255, 255, 255);
        opacity: 0.5;
        position: fixed;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
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
    color: blue;
    text-decoration: underline;
}
</style>
