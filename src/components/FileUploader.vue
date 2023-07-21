<script>
export default {
    data() {
        return {
            fileDragOverBody: false,
            fileDragOverElement: false,
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
            console.log(file);
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
    },
    mounted() {
        console.log('Heyheyhehlhasdfasdf')
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
};
</script>

<template>
    <!-- @TODO: need to figure out how to prevent background flickering (happens for 1 frame)
        when hovering over the <label> inside this div. -->
    <!-- @REPLY: it seems like the solution atm is having the return animation be slow enough where the user doesn't notice? -->
    <div
        :class="['container', fileDragOverCSSClass]"
        @dragenter.prevent.stop="fileDragOverElement = true"
        @dragover.prevent.stop="fileDragOverElement = true"
        @dragleave.prevent.stop="fileDragOverElement = false"
        @drop.prevent.stop="triggerUploadFromDroppedFiles"
    >
        Drag and drop or 
        <input type="file" id="file-upload-button" ref="fileUploadButton" @change="triggerUploadFromFileSelectionDialog" multiple />
        <label for="file-upload-button" class="link">browse</label>
    </div>
</template>

<style lang="scss" scoped>
.container {
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

.link {
    cursor: pointer;
    color: blue;
    text-decoration: underline;
}
</style>
