import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { PepAddonService, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';
import { IPepGenericListDataSource, IPepGenericListActions } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { FomoService } from "src/services/fomo.service";
import { FilterObject } from "../../../../../shared/types";
import { PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { FilterFormComponent } from "../filter-form/filter-form.component";
import { config } from "../../app.config";

@Component({
    selector: 'filters-list',
    templateUrl: './filters-list.component.html',
    styleUrls: ['./filters-list.component.scss']
})
export class FiltersListComponent implements OnInit {

    screenSize: PepScreenSizeType;
    fomoService: FomoService;
    filterObjectsMap: Map<string, FilterObject> = new Map<string, FilterObject>();
    filterObjects?: FilterObject[] = undefined;


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


    private async openAttachmentDialog(callback: (value: any) => void, data?: { filterObject: FilterObject }) {
        const config = this.dialogService.getDialogConfig({}, 'large');

        config.data = new PepDialogData({
            content: FilterFormComponent,
        })
        this.dialogService.openDialog(FilterFormComponent, { ...data, filterObjectList: this.filterObjects }, config).afterClosed().subscribe((value) => {
            if (value) {
                console.log(JSON.stringify(value));
                callback(value);
            }
        });
    }

    private isLocked(filterObject: FilterObject) {
        return filterObject.AddonUUID && filterObject.AddonUUID != config.AddonUUID;
    }

    buttonClick($event: any) {
        this.openAttachmentDialog((value) => {
            console.log(`callback from dialog: ${JSON.stringify(value)}`);
        });
    }

    updateFilterObjectsMap(filterObjects: FilterObject[]) {
        filterObjects.forEach(filterObject => {
            this.filterObjectsMap.set(filterObject.Key, filterObject);
        });
    }

    async updateFilterObjects() {
        try {
            this.filterObjects = await this.fomoService.getFilterObjects();
            this.updateFilterObjectsMap(this.filterObjects);
        }
        catch (ex) {
            console.error(`Error in updateFilterObjects: ${ex}`);
            throw ex;
        }
    }

    async getSearchedFilterObjects(searchText?: string): Promise<FilterObject[]> {
        if (this.filterObjects === undefined) {
            try {
                await this.updateFilterObjects();
            }
            catch (ex) {
                console.error(`Error in getSearchedFilterObjects: ${ex}`);
                throw ex;
            }
        }
        if (!searchText) {
            return this.filterObjects;
        }
        return this.filterObjects.filter(filterObject => {
            return filterObject.Name.toLowerCase().includes(searchText.toLowerCase());
        });
    }


    getDataSource() {
        return {
            init: async (state) => {
                const searchedFilterObjects = await this.getSearchedFilterObjects(state.searchString);
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
                            },
                            {
                                FieldID: 'Locked',
                                Type: 'Boolean',
                                Title: 'System',
                                Mandatory: true,
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
                            },
                            {
                                Width: 10
                            }
                        ],
                        FrozenColumnsCount: 0,
                        MinimumColumnWidth: 0
                    },
                    items: searchedFilterObjects.map(filterObject => {
                        return {
                            ...filterObject,
                            Locked: this.isLocked(filterObject)
                        }
                    }),
                    totalCount: searchedFilterObjects.length
                }
            }
        } as IPepGenericListDataSource;
    }
    listDataSource: IPepGenericListDataSource = this.getDataSource();

    editAction = {
        title: this.translate.instant("Edit"),
        handler: async (data) => {
            const filterObjectKey = data?.rows[0];
            const filterObject = this.filterObjectsMap.get(filterObjectKey);
            this.openAttachmentDialog((value) => {
                console.log(`callback from dialog: ${JSON.stringify(value)}`);
            }, { filterObject });
        }
    }

    deleteAction = {
        title: this.translate.instant("Delete"),
        handler: async (data) => {
            const filterObjectKeys = data?.rows;
            await this.fomoService.deleteFilterObjects(filterObjectKeys);
            this.listDataSource = this.getDataSource();
        }
    }

    actions: IPepGenericListActions = {
        get: async (data: PepSelectionData) => {
            // if there is at least one selected row for which the FilterObject has an OwnerUUID that is not config.AddonUUID, then return empty array. we don't want to show the actions in this case since the user doesn't have permission to edit or delete the FilterObject.
            if (data.rows.some(row => {
                const filterObject = this.filterObjectsMap.get(row);
                return this.isLocked(filterObject);
            })) {
                return [];
            }
            if (data.rows.length == 1) {
                return [
                    this.editAction,
                    this.deleteAction
                ]
            }
            else if (data.rows.length > 1) {
                return [
                    this.deleteAction
                ]
            }
            else return []
        }
    }
}
