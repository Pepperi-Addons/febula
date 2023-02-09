import { Component, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { PepAddonService, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';
import { IPepGenericListDataSource, IPepGenericListActions } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { FomoService } from "src/services/fomo.service";
import { FilterObject } from "../../../../../shared/types";
import { PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { EditorFormComponent } from "../editor-form/editor-form.component";

@Component({
    selector: 'filters-list',
    templateUrl: './filters-list.component.html',
    styleUrls: ['./filters-list.component.scss']
})
export class FiltersListComponent implements OnInit {

    screenSize: PepScreenSizeType;
    fomoService: FomoService;
    filterObjectsMap: Map<string, FilterObject> = new Map<string, FilterObject>();
    filterObjects: FilterObject[] = [];


    constructor(
        public router: Router,
        public route: ActivatedRoute,
        public layoutService: PepLayoutService,
        public translate: TranslateService,
        public pepAddonService: PepAddonService,
        private dialogService: PepDialogService,

    ) {
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
        this.fomoService = new FomoService(this.pepAddonService);

    }

    ngOnInit() {
    }


    private async openAttachmentDialog(callback: (value: any) => void) {
        const config = this.dialogService.getDialogConfig({}, 'large');

        config.data = new PepDialogData({
            content: EditorFormComponent,
        })
        this.dialogService.openDialog(EditorFormComponent, {}, config).afterClosed().subscribe((value) => {
            if (value) {
                console.log(JSON.stringify(value));
                callback(value);
            }
        });
    }

    buttonClick($event: any) {
        this.openAttachmentDialog((value) => {
            console.log(`callback from dialog: ${JSON.stringify(value)}`);
        });
    }

    updateFilterObjectsMap(filterObjects: FilterObject[]) {
        this.filterObjectsMap.clear();
        filterObjects.forEach(filterObject => {
            this.filterObjectsMap.set(filterObject.Key, filterObject);
        });
    }

    async updateFilterObjects(searchString: string) {
        this.filterObjects = await this.fomoService.getFilterObjects(searchString);
        this.updateFilterObjectsMap(this.filterObjects);
    }


    getDataSource() {
        return {
            init: async (state) => {
                await this.updateFilterObjects(state?.searchString);
                return {
                    dataView: {
                        Context: {
                            Name: '',
                            Profile: { InternalID: 0 },
                            ScreenSize: 'Landscape'
                        },
                        Type: 'Grid',
                        Title: '',
                        Fields: [
                            {
                                FieldID: 'Name',
                                Type: 'TextBox',
                                Title: 'Name',
                                Mandatory: true,
                                ReadOnly: true
                            },
                            {
                                FieldID: 'Field',
                                Type: 'TextBox',
                                Title: 'Field',
                                Mandatory: true,
                                ReadOnly: true
                            },
                            {
                                FieldID: 'Resource',
                                Type: 'TextBox',
                                Title: 'From Resource',
                                Mandatory: true,
                                ReadOnly: true
                            },
                            {
                                FieldID: 'PreviousField',
                                Type: 'TextBox',
                                Title: 'Filter Field',
                                Mandatory: false,
                                ReadOnly: true
                            },
                            {
                                FieldID: 'PreviousFilter',
                                Type: 'TextBox',
                                Title: 'In Filter Rule',
                                Mandatory: false,
                                ReadOnly: true
                            }

                        ],
                        Columns: [
                            {
                                Width: 25
                            },
                            {
                                Width: 25
                            },
                            {
                                Width: 25
                            },
                            {
                                Width: 25
                            },
                            {
                                Width: 25
                            }
                        ],
                        FrozenColumnsCount: 0,
                        MinimumColumnWidth: 0
                    },
                    items: this.filterObjects,
                    totalCount: this.filterObjects.length
                }
            }
        } as IPepGenericListDataSource;
    }
    listDataSource: IPepGenericListDataSource = this.getDataSource();

    actions: IPepGenericListActions = {
        get: async (data: PepSelectionData) => {
            if (data.rows.length) {
                return [{
                    title: this.translate.instant("Edit"),
                    handler: async (data) => {
                        this.openAttachmentDialog((value) => {
                            console.log(`callback from dialog: ${JSON.stringify(value)}`);
                        });
                    }
                },
                {
                    title: this.translate.instant("Delete"),
                    handler: async (data) => {
                        const filterObjectKeys = data?.rows;
                        await this.fomoService.deleteFilterObjects(filterObjectKeys);
                        this.listDataSource = this.getDataSource();
                    }
                }]
            } else return []
        }
    }
}
