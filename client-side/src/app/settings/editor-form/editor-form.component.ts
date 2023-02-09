import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';

@Component({
    selector: 'editor-form',
    templateUrl: './editor-form.component.html',
    styleUrls: ['./editor-form.component.scss']
})
export class EditorFormComponent implements OnInit {

    screenSize: PepScreenSizeType;
    constructor(
        public layoutService: PepLayoutService,
        private dialogRef: MatDialogRef<EditorFormComponent>,
        public translate: TranslateService,
        public dialogService: PepDialogService,
        public router: Router,
        public activatedRoute: ActivatedRoute,
        @Inject(MAT_DIALOG_DATA) public incoming: { any: any }
    ) {

        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });

        this.key = this.activatedRoute.snapshot.params['form_key'];
        this.loading = false;
    }

    mode: 'Edit' | 'Add'
    title: string = "Hello"
    field1: string = "Hello"
    loading: boolean = true
    key: string;

    ngOnInit() {
    }

    goBack() {
        this.close(undefined);
    }

    close(event: any) {
        this.dialogRef.close(event);
    }

    backClicked() {
        this.close(undefined);
    }

    saveClicked() {
        this.dialogService.openDefaultDialog(new PepDialogData({
            title: 'Saved'
        }))
    }

    cancelClicked() {
        this.close(undefined);
    }
}
